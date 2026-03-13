import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, File, UploadFile, Form, Query, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import json
import shutil
from pydantic import BaseModel
from datetime import datetime

from backend.database import get_db
from backend.models.user import User
from backend.models.case import Case, CourtSessionModel, CourtSubmittedEvidence, EvidenceItem, EvidenceFile
from backend.schemas.court_schemas import (
    CreateSessionRequest,
    CreateSessionResponse,
    SessionStateResponse,
    SendMessageRequest,
    SendMessageResponse,
    ObjectionDecision,
    PlaintiffFeedback,
    ContinueAfterObjectionRequest,
    UploadEvidenceResponse,
    EvidenceFileMetadata,
    ErrorResponse,
    CourtroomResponse as SchemaResponse,
    EvidenceRequestModel,
)
from backend.services.court_session_service import CourtSessionService
from backend.services.evidence_service import EvidenceService
from backend.websockets.court_ws import ws_manager
from backend.utils.auth_utils import get_current_user, decode_access_token
from backend.utils.token_tracker import record_tokens
from pathlib import Path
import os
from backend.utils.path_utils import get_user_evidence_dir

logger = logging.getLogger(__name__)

router = APIRouter(tags=["court"])

# Feature flags - set to False to disable
ENABLE_FEEDBACK = True
ENABLE_OBJECTIONS = True

# Initialize services
_session_service: Optional[CourtSessionService] = None
_evidence_services: dict = {}  # session_id -> EvidenceService


class SubmitPreparedEvidenceRequest(BaseModel):
    user_id: str
    case_id: int
    folder_names: List[str]


def get_session_service() -> CourtSessionService:
    """Lazy initialize session service."""
    global _session_service
    if _session_service is None:
        _session_service = CourtSessionService()
    return _session_service


def get_evidence_service(session_id: str, user_id: str = None) -> EvidenceService:
    """Get evidence service for a session."""
    if session_id not in _evidence_services:
        # Use user-specific directory if available
        if user_id:
            evidence_dir = get_user_evidence_dir(user_id) / "court_submitted"
        else:
            evidence_dir = Path("data") / "evidence" / "court_submitted"
        _evidence_services[session_id] = EvidenceService(str(evidence_dir))
    return _evidence_services[session_id]


# ===== REST Endpoints =====


@router.get("/case-data")
async def get_case_data(
    user_id: str = "user_1",
    case_id: int = 1,
    db: Session = Depends(get_db),
):
    """
    Get case data from the database.
    Returns the case information for the UI to display.
    """
    try:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            # Fallback: get the most recent case for this user
            case = (
                db.query(Case)
                .filter(Case.user_id == user_id)
                .order_by(Case.id.desc())
                .first()
            )
        if case:
            plaintiffs = [
                {"name": p.name, "address": p.address}
                for p in case.parties if p.role == "plaintiff"
            ]
            defendants = [
                {"name": p.name, "address": p.address}
                for p in case.parties if p.role == "defendant"
            ]
            logger.info(f"Loaded case data for user={user_id} case_id={case_id} from DB")
            return {
                "case_number": case.case_number,
                "case_type": case.case_type,
                "state": case.state,
                "county": case.county,
                "filing_date": case.filing_date.isoformat() if case.filing_date else None,
                "hearing_date": case.hearing_date,
                "plaintiffs": plaintiffs,
                "defendants": defendants,
                "claim_summary": case.claim_summary,
                "amount_sought": float(case.amount_sought) if case.amount_sought else 0,
                "incident_date": case.incident_date.isoformat() if case.incident_date else None,
                "demand_letter_sent": case.demand_letter_sent,
                "agreement_included": case.agreement_included,
            }
        logger.warning(f"Case not found in DB for user={user_id} case_id={case_id}")
        return {
            "case_type": "Small Claims",
            "state": "Unknown",
            "plaintiffs": [{"name": "Plaintiff"}],
            "defendants": [{"name": "Defendant"}],
            "claim_summary": "Case information not available",
            "amount_sought": 0,
        }
    except Exception as e:
        logger.error(f"Error loading case data: {e}")
        return {
            "case_type": "Small Claims",
            "state": "Unknown",
            "plaintiffs": [{"name": "Plaintiff"}],
            "defendants": [{"name": "Defendant"}],
            "claim_summary": "Error loading case information",
            "amount_sought": 0,
        }


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(
    request: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new court simulator session.
    Requires authentication.

    Returns the session ID and the Judge's opening statement.
    """
    try:
        # Use authenticated user's ID
        effective_user_id = current_user.id
        service = get_session_service()
        result = service.create_session(effective_user_id, request.case_id, db)

        # Notify frontend that turn is now Plaintiff's
        await ws_manager.send_next_speaker(result["session_id"], "Plaintiff")

        return CreateSessionResponse(**result)
    except ValueError as e:
        logger.error(f"Session creation failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating session: {e}")
        raise


@router.get("/sessions/{session_id}", response_model=SessionStateResponse)
async def get_session_state(
    session_id: str,
    db: Session = Depends(get_db),
):
    """
    Get the current state of a court session.

    Useful for restoring session state on page refresh.
    """
    try:
        service = get_session_service()
        state = service.get_session_state(session_id, db)
        if not state:
            raise ValueError(f"Session {session_id} not found")
        state.setdefault('evidence_upload_allowed', False)
        return SessionStateResponse(**state)
    except Exception as e:
        logger.error(f"Error getting session state: {e}")
        raise


@router.post("/sessions/{session_id}/messages", response_model=SendMessageResponse)
async def send_plaintiff_message(
    session_id: str,
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a plaintiff statement during the hearing.

    Performs objection check and returns feedback.
    Note: AI responses are sent via WebSocket in real-time.
    """
    try:
        service = get_session_service()
        court_session = service.get_session(session_id, db)

        if not court_session:
            raise ValueError(f"Session {session_id} not found")

        # Track if session was completed to avoid double-save
        session_completed = False
        total_tokens = 0

        # Check for objections (if enabled)
        if ENABLE_OBJECTIONS:
            objection_result = court_session.process_plaintiff_turn(request.message)
            has_objection, objection_decision = objection_result

            if has_objection:
                # Track tokens from objection decision
                if hasattr(objection_decision, 'tokens_used') and objection_decision.tokens_used:
                    total_tokens += objection_decision.tokens_used
                # Record tokens if any were used
                if total_tokens > 0:
                    record_tokens(current_user.id, total_tokens, db)
                return SendMessageResponse(
                    status="objection_raised",
                    objection=ObjectionDecision(**objection_decision.model_dump())
                    if hasattr(objection_decision, "model_dump")
                    else ObjectionDecision(**vars(objection_decision)),
                )
                # logger.info("\n" + "="*70)
                # logger.info(f"⚠️  OBJECTION RAISED BY DEFENSE in session {session_id}")
                # logger.info(f"Type: {objection_decision.objection_type}, Severity: {objection_decision.severity}")
                # logger.info(f"Type: {objection_decision.objection_type}")
                # logger.info(f"Severity: {objection_decision.severity.upper()}")
                # logger.info(f"Reasoning:\n{objection_decision.legal_reasoning}")
                # if objection_decision.suggested_rephrasing:
                #     logger.info(f"Suggested Rephrasing:\n\"{objection_decision.suggested_rephrasing}\"")
                # logger.info("="*70 + "\n")

        # Finalize plaintiff turn (objection checking is disabled or no objection found)
        logger.info(f"Session {session_id}: Finalizing plaintiff turn")
        court_session.finalize_plaintiff_turn(request.message)

        # Generate educational feedback for the plaintiff (if enabled)
        plaintiff_feedback = None
        if ENABLE_FEEDBACK:
            try:
                logger.info(f"Session {session_id}: Generating feedback...")
                feedback_result = court_session.get_plaintiff_feedback(request.message)
                plaintiff_feedback = PlaintiffFeedback(
                    positive=feedback_result.did_well,
                    improvements=feedback_result.improvements
                )
                # Track tokens from feedback
                if hasattr(feedback_result, 'tokens_used') and feedback_result.tokens_used:
                    total_tokens += feedback_result.tokens_used
                logger.info(f"Session {session_id}: Generated feedback: {feedback_result.did_well[:50]}...")
                # Send feedback via WebSocket for real-time update
                await ws_manager.send_feedback(
                    session_id,
                    feedback_result.did_well,
                    feedback_result.improvements
                )
            except Exception as feedback_error:
                logger.warning(f"Failed to generate plaintiff feedback: {feedback_error}", exc_info=True)

        service.save_session(session_id, db)

        # Collect all AI responses (Judge and/or Defendant may both respond)
        all_responses = []

        # Decide first who should respond
        logger.info(f"Session {session_id}: Deciding next speaker...")
        next_speaker_response = court_session.decide_next_speaker()
        next_speaker = next_speaker_response.lower() if isinstance(next_speaker_response, str) else next_speaker_response.next_speaker.lower()

        # Track tokens from controller decision
        if hasattr(next_speaker_response, 'tokens_used') and next_speaker_response.tokens_used:
            total_tokens += next_speaker_response.tokens_used

        logger.info(f"Session {session_id}: Next speaker decided: {next_speaker}")

        # If verdict, notify frontend and complete session (verdict already delivered by Judge)
        if next_speaker == "verdict":
            logger.info(f"Session {session_id}: Verdict reached")

            # Detect verdict outcome using AI analysis
            verdict_outcome = court_session.detect_verdict_outcome()
            logger.info(f"Verdict outcome detected: {verdict_outcome}")

            await ws_manager.send_next_speaker(session_id, "Verdict", verdict_outcome=verdict_outcome)

            # Record tokens used
            if total_tokens > 0:
                record_tokens(current_user.id, total_tokens, db)

            # Mark trial as complete and save transcript
            session_completed = True
            service.complete_session(session_id, db, verdict_outcome=verdict_outcome)

            return SendMessageResponse(
                status="verdict",
                verdict_outcome=verdict_outcome,
                message="The trial has concluded.",
                feedback=plaintiff_feedback,
            )

        # Process AI turns until it's Plaintiff's turn or verdict
        max_ai_turns = 5  # Allow more turns for proper proceedings
        ai_turn_count = 0

        try:
            while next_speaker not in ["plaintiff", "verdict"] and ai_turn_count < max_ai_turns:
                ai_turn_count += 1
                logger.info(f"Session {session_id}: AI turn {ai_turn_count}, speaker: {next_speaker}")

                # Get AI response
                ai_response = court_session.process_ai_turn()
                logger.info(f"Session {session_id}: AI response from {ai_response.role}: {ai_response.dialogue[:50] if ai_response.dialogue else 'empty'}...")
                all_responses.append(ai_response)

                # Track tokens from AI response
                if hasattr(ai_response, 'tokens_used') and ai_response.tokens_used:
                    total_tokens += ai_response.tokens_used

                # Send to WebSocket clients
                await ws_manager.send_response(
                    session_id,
                    ai_response.role,
                    ai_response.dialogue,
                    inner_thought=ai_response.inner_thought,
                )


                # Decide next speaker
                next_speaker_response = court_session.decide_next_speaker()
                next_speaker = next_speaker_response.lower() if isinstance(next_speaker_response, str) else next_speaker_response.next_speaker.lower()

                # Track tokens from controller decision
                if hasattr(next_speaker_response, 'tokens_used') and next_speaker_response.tokens_used:
                    total_tokens += next_speaker_response.tokens_used

                # If Plaintiff's turn, break and let them speak
                if next_speaker == "plaintiff":
                    await ws_manager.send_next_speaker(session_id, "Plaintiff")
                    break

                # CRITICAL FIX: Check for verdict in AI loop
                if next_speaker == "verdict":
                    logger.info(f"Session {session_id}: Verdict reached in AI loop")

                    # Detect verdict outcome using AI analysis
                    verdict_outcome = court_session.detect_verdict_outcome()
                    logger.info(f"Verdict outcome detected: {verdict_outcome}")

                    await ws_manager.send_next_speaker(session_id, "Verdict", verdict_outcome=verdict_outcome)

                    # Record tokens used
                    if total_tokens > 0:
                        record_tokens(current_user.id, total_tokens, db)

                    # Complete session with transcript save
                    session_completed = True
                    service.complete_session(session_id, db, verdict_outcome=verdict_outcome)
                    break

        except Exception as ai_loop_error:
            logger.error(f"Session {session_id}: Error in AI turn loop: {ai_loop_error}", exc_info=True)
            # Still try to return what we have
            await ws_manager.send_error(session_id, f"AI processing error: {str(ai_loop_error)}")

        if not session_completed:
            service.save_session(session_id, db)

        # Return the last AI response in HTTP response (fallback for when WebSocket fails)
        # Use the last response for the HTTP return
        if not all_responses:
            logger.warning(f"Session {session_id}: No AI responses generated")
            return SendMessageResponse(
                status="success",
                feedback=plaintiff_feedback,
                message="Waiting for court response...",
            )

        last_response = all_responses[-1]

        return SendMessageResponse(
            status="success",
            feedback=plaintiff_feedback,
            ai_response=SchemaResponse(
                role=last_response.role,
                dialogue=last_response.dialogue,
                inner_thought=last_response.inner_thought,
                evidence_request=None,
            ),
        )
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        await ws_manager.send_error(session_id, str(e))
        raise


@router.post("/sessions/{session_id}/objections/continue", response_model=SendMessageResponse)
async def continue_after_objection(
    session_id: str,
    request: ContinueAfterObjectionRequest,
    db: Session = Depends(get_db),
):
    """
    Continue with plaintiff's turn after objection handling.

    Called when plaintiff either uses original statement or after rephrasing.
    Processes the (possibly rephrased) statement and triggers AI response.
    """
    try:
        service = get_session_service()
        court_session = service.get_session(session_id, db)

        if not court_session:
            raise ValueError(f"Session {session_id} not found")

        # Track if session was completed to avoid double-save
        session_completed = False

        # Finalize plaintiff turn with the message (original or rephrased)
        if request.message:
            logger.info(f"Session {session_id}: Finalizing plaintiff turn after objection with message: {request.message[:50]}...")
            court_session.finalize_plaintiff_turn(request.message)
        else:
            logger.warning(f"Session {session_id}: No message provided in continue_after_objection")

        # Generate educational feedback for the plaintiff (if enabled)
        plaintiff_feedback = None
        if ENABLE_FEEDBACK and request.message:
            try:
                logger.info(f"Session {session_id}: Generating feedback after objection...")
                feedback_result = court_session.get_plaintiff_feedback(request.message)
                plaintiff_feedback = PlaintiffFeedback(
                    positive=feedback_result.did_well,
                    improvements=feedback_result.improvements
                )
                logger.info(f"Session {session_id}: Generated feedback: {feedback_result.did_well[:50]}...")
                # Send feedback via WebSocket for real-time update
                await ws_manager.send_feedback(
                    session_id,
                    feedback_result.did_well,
                    feedback_result.improvements
                )
            except Exception as feedback_error:
                logger.warning(f"Failed to generate plaintiff feedback after objection: {feedback_error}", exc_info=True)

        service.save_session(session_id, db)

        # Collect all AI responses (Judge and/or Defendant may both respond)
        all_responses = []

        # Decide first who should respond
        logger.info(f"Session {session_id}: Deciding next speaker after objection...")
        next_speaker = court_session.decide_next_speaker().lower()
        logger.info(f"Session {session_id}: Next speaker decided: {next_speaker}")

        # If verdict, notify frontend and complete session (verdict already delivered by Judge)
        if next_speaker == "verdict":
            logger.info(f"Session {session_id}: Verdict reached after objection")

            # Detect verdict outcome using AI analysis
            verdict_outcome = court_session.detect_verdict_outcome()
            logger.info(f"Verdict outcome detected: {verdict_outcome}")

            await ws_manager.send_next_speaker(session_id, "Verdict", verdict_outcome=verdict_outcome)

            # Mark trial as complete and save transcript
            session_completed = True
            service.complete_session(session_id, db, verdict_outcome=verdict_outcome)

            return SendMessageResponse(
                status="verdict",
                verdict_outcome=verdict_outcome,
                message="The trial has concluded.",
                feedback=plaintiff_feedback,
            )

        # Process AI turns until it's Plaintiff's turn or verdict
        max_ai_turns = 5
        ai_turn_count = 0

        try:
            while next_speaker not in ["plaintiff", "verdict"] and ai_turn_count < max_ai_turns:
                ai_turn_count += 1
                logger.info(f"Session {session_id}: AI turn {ai_turn_count} after objection, speaker: {next_speaker}")

                # Get AI response
                ai_response = court_session.process_ai_turn()
                logger.info(f"Session {session_id}: AI response from {ai_response.role}: {ai_response.dialogue[:50] if ai_response.dialogue else 'empty'}...")
                all_responses.append(ai_response)

                # Send to WebSocket clients
                await ws_manager.send_response(
                    session_id,
                    ai_response.role,
                    ai_response.dialogue,
                    inner_thought=ai_response.inner_thought,
                )

                # Decide next speaker
                next_speaker = court_session.decide_next_speaker().lower()

                # If Plaintiff's turn, break and let them speak
                if next_speaker == "plaintiff":
                    await ws_manager.send_next_speaker(session_id, "Plaintiff")
                    break

                # Check for verdict in AI loop
                if next_speaker == "verdict":
                    logger.info(f"Session {session_id}: Verdict reached in AI loop after objection")

                    # Detect verdict outcome using AI analysis
                    verdict_outcome = court_session.detect_verdict_outcome()
                    logger.info(f"Verdict outcome detected: {verdict_outcome}")

                    await ws_manager.send_next_speaker(session_id, "Verdict", verdict_outcome=verdict_outcome)

                    # Complete session with transcript save
                    session_completed = True
                    service.complete_session(session_id, db, verdict_outcome=verdict_outcome)
                    break

        except Exception as ai_loop_error:
            logger.error(f"Session {session_id}: Error in AI turn loop after objection: {ai_loop_error}", exc_info=True)
            await ws_manager.send_error(session_id, f"AI processing error: {str(ai_loop_error)}")

        if not session_completed:
            service.save_session(session_id, db)

        # Return the last AI response in HTTP response (fallback for when WebSocket fails)
        if not all_responses:
            logger.warning(f"Session {session_id}: No AI responses generated after objection")
            return SendMessageResponse(
                status="success",
                feedback=plaintiff_feedback,
                message="Waiting for court response...",
            )

        last_response = all_responses[-1]

        return SendMessageResponse(
            status="success",
            feedback=plaintiff_feedback,
            ai_response=SchemaResponse(
                role=last_response.role,
                dialogue=last_response.dialogue,
                inner_thought=last_response.inner_thought,
                evidence_request=None,
            ),
        )
    except Exception as e:
        logger.error(f"Error continuing after objection: {e}", exc_info=True)
        await ws_manager.send_error(session_id, str(e))
        raise


@router.post("/sessions/{session_id}/evidence", response_model=UploadEvidenceResponse)
async def upload_evidence(
    session_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload evidence files during the hearing.

    Evidence can be uploaded anytime during Plaintiff's turn.
    """
    try:
        service = get_session_service()
        court_session = service.get_session(session_id, db)

        if not court_session:
            raise ValueError(f"Session {session_id} not found")

        # Validate it's Plaintiff's turn
        logger.info(f"It is {court_session.current_speaker}'s turn")   
        if court_session.current_speaker != "Plaintiff":
            raise ValueError(
                "Evidence can only be uploaded during your turn to speak."
            )

        # Upload files to the session's evidence directory
        evidence_service = EvidenceService(court_session.evidence_submit_dir)
        logger.info(f"Session {session_id}: Uploading evidence to: {court_session.evidence_submit_dir}, turn: {court_session.turn_number}")
        uploaded = await evidence_service.upload_evidence(
            files, court_session.turn_number
        )
        logger.info(f"Session {session_id}: Uploaded {len(uploaded)} evidence files")

        # Store file paths in session for AI processing
        file_paths = [f["path"] for f in uploaded]
        court_session.evidence_buffer.extend(file_paths)

        # Record uploaded files in the database linked to this session
        for f in uploaded:
            db.add(CourtSubmittedEvidence(
                session_id=session_id,
                filename=f["filename"],
                file_path=f["path"],
                turn_number=court_session.turn_number,
                mime_type=f.get("mime_type"),
                size_bytes=f.get("size_bytes"),
            ))
        db.commit()

        # Add a system message indicating evidence was submitted
        file_names = [f["filename"] for f in uploaded]
        evidence_msg = f"[Plaintiff submitted evidence: {', '.join(file_names)}]"
        court_session.history.append({
            "role": "System",
            "content": evidence_msg,
            "turn": court_session.turn_number
        })

        logger.info(f"Session {session_id}: Evidence uploaded - {file_names}")

        # Trigger Judge response to acknowledge evidence
        # court_session.current_speaker = "Judge"
        # ai_response = court_session.process_ai_turn()

        # # Send AI response via WebSocket
        # await ws_manager.send_response(
        #     session_id,
        #     ai_response.role,
        #     ai_response.dialogue,
        #     inner_thought=ai_response.inner_thought,
        # )

        # ALWAYS return turn to Plaintiff after evidence acknowledgement
        # This prevents Defendant from interrupting while Plaintiff is typing context
        court_session.current_speaker = "Plaintiff"
        await ws_manager.send_next_speaker(session_id, "Plaintiff")
        logger.info(f"Session {session_id}: Returned turn to Plaintiff after evidence acknowledgement")

        service.save_session(session_id, db)

        return UploadEvidenceResponse(
            uploaded_files=[EvidenceFileMetadata(**f) for f in uploaded]
        )
    except ValueError as e:
        logger.warning(f"Evidence upload validation failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Error uploading evidence: {e}")
        raise


@router.post("/sessions/{session_id}/evidence/prepared", response_model=UploadEvidenceResponse)
async def upload_prepared_evidence(
    session_id: str,
    request: SubmitPreparedEvidenceRequest,
    db: Session = Depends(get_db),
):
    """
    Submit ready evidence that was prepared in the dashboard without re-uploading
    from local user files.
    """
    try:
        service = get_session_service()
        court_session = service.get_session(session_id, db)

        if not court_session:
            raise ValueError(f"Session {session_id} not found")

        if court_session.current_speaker != "Plaintiff":
            raise ValueError("Evidence can only be uploaded during your turn to speak.")

        folder_names = [name for name in request.folder_names if name]
        if not folder_names:
            raise ValueError("No prepared evidence folders selected")

        evidence_service = EvidenceService(court_session.evidence_submit_dir)
        evidence_service.base_dir.mkdir(parents=True, exist_ok=True)

        uploaded = []
        for folder_name in folder_names:
            evidence_item = (
                db.query(EvidenceItem)
                .filter_by(case_id=request.case_id, evidence_name=folder_name)
                .first()
            )
            if not evidence_item:
                continue

            ready_files = (
                db.query(EvidenceFile)
                .filter_by(evidence_item_id=evidence_item.id, is_ready=True)
                .all()
            )

            for idx, ready_file in enumerate(ready_files, start=1):
                source_path = Path(ready_file.file_path)
                if not source_path.exists():
                    continue

                ext = source_path.suffix.lower() or ".bin"
                sanitized_name = EvidenceService._sanitize_filename(source_path.name)
                base_name = os.path.splitext(sanitized_name)[0]
                target_name = f"turn_{court_session.turn_number}_prepared_{idx}_{base_name}{ext}"
                target_path = evidence_service.base_dir / target_name

                suffix = 1
                while target_path.exists():
                    target_name = f"turn_{court_session.turn_number}_prepared_{idx}_{base_name}_{suffix}{ext}"
                    target_path = evidence_service.base_dir / target_name
                    suffix += 1

                shutil.copy2(str(source_path), str(target_path))
                stat = target_path.stat()
                uploaded.append(
                    {
                        "filename": target_name,
                        "path": str(target_path),
                        "size_bytes": stat.st_size,
                        "mime_type": ready_file.mime_type or "application/octet-stream",
                        "upload_time": datetime.utcnow().isoformat(),
                    }
                )

        if not uploaded:
            raise ValueError("No ready evidence files found in selected folders")

        court_session.evidence_buffer.extend([f["path"] for f in uploaded])

        for f in uploaded:
            db.add(CourtSubmittedEvidence(
                session_id=session_id,
                filename=f["filename"],
                file_path=f["path"],
                turn_number=court_session.turn_number,
                mime_type=f.get("mime_type"),
                size_bytes=f.get("size_bytes"),
            ))
        db.commit()

        file_names = [f["filename"] for f in uploaded]
        evidence_msg = f"[Plaintiff submitted prepared evidence: {', '.join(file_names)}]"
        court_session.history.append({
            "role": "System",
            "content": evidence_msg,
            "turn": court_session.turn_number,
        })

        court_session.current_speaker = "Plaintiff"
        await ws_manager.send_next_speaker(session_id, "Plaintiff")

        service.save_session(session_id, db)
        return UploadEvidenceResponse(
            uploaded_files=[EvidenceFileMetadata(**f) for f in uploaded]
        )
    except ValueError as e:
        logger.warning(f"Prepared evidence upload validation failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Error uploading prepared evidence: {e}")
        raise


@router.get("/sessions/{session_id}/transcript", response_model=dict)
async def get_transcript(
    session_id: str,
    db: Session = Depends(get_db),
):
    """
    Get the full trial transcript for a session.
    """
    try:
        service = get_session_service()
        state = service.get_session_state(session_id, db)

        if not state:
            raise ValueError(f"Session {session_id} not found")

        return {
            "history": state["history"],
            "evidence_count": db.query(CourtSubmittedEvidence)
                .filter(CourtSubmittedEvidence.session_id == session_id)
                .count(),
        }
    except Exception as e:
        logger.error(f"Error retrieving transcript: {e}")
        raise


@router.get("/sessions/{session_id}/evidence/download")
async def download_submitted_evidence(
    session_id: str,
    filename: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Download a submitted evidence file for preview in the simulation UI.
    """
    submitted = (
        db.query(CourtSubmittedEvidence)
        .filter_by(session_id=session_id, filename=filename)
        .order_by(CourtSubmittedEvidence.id.desc())
        .first()
    )
    if not submitted:
        raise HTTPException(status_code=404, detail="Evidence file not found")

    file_path = Path(submitted.file_path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Evidence file missing on disk")

    return FileResponse(
        path=str(file_path),
        media_type=submitted.mime_type or "application/octet-stream",
        filename=submitted.filename,
    )


@router.delete("/sessions/{session_id}", response_model=dict)
async def complete_session(
    session_id: str,
    db: Session = Depends(get_db),
):
    """
    End a court session and save the transcript.
    """
    try:
        service = get_session_service()
        service.complete_session(session_id, db)
        return {"status": "completed"}
    except Exception as e:
        logger.error(f"Error completing session: {e}")
        raise


# ===== WebSocket Endpoint =====


@router.websocket("/sessions/{session_id}/ws")
async def websocket_endpoint(
    session_id: str,
    websocket: WebSocket,
    db: Session = Depends(get_db),
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time court simulator updates.

    Clients connect to receive:
    - AI responses (Judge/Defendant)
    - Next speaker notifications
    - Evidence request alerts
    - Error messages

    Token passed as query param for authentication.
    """
    # Validate token if provided
    if token:
        payload = decode_access_token(token)
        if payload is None:
            await websocket.close(code=4001, reason="Invalid or expired token")
            return

    await ws_manager.connect(session_id, websocket)

    # Send connection confirmation
    await websocket.send_json({
        "type": "connected",
        "data": {"session_id": session_id}
    })

    try:
        while True:
            # Keep connection alive - messages are sent via broadcast
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(session_id, websocket)
        logger.info(f"WebSocket client disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await ws_manager.disconnect(session_id, websocket)
