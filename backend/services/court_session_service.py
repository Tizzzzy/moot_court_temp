import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
import sys
import os
import logging

logger = logging.getLogger(__name__)

# Add court_simulator to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.models.case import CourtSessionModel, Case
from court_simulator.session import CourtSession
from backend.utils.path_utils import get_user_evidence_dir
from backend.config import settings


class CourtSessionService:
    """
    Service to manage court simulator sessions.
    Wraps the CourtSession class and persists state to database.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        # In-memory cache for active sessions
        self._session_cache: Dict[str, CourtSession] = {}

    def create_session(
        self, user_id: str, case_id: int, db: Session
    ) -> Dict[str, Any]:
        """
        Create a new court session.

        Returns:
            {
                'session_id': str,
                'opening_message': {...}
            }
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        # Load case from database
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        # Create evidence directory (per-session to avoid cross-session contamination)
        session_id = str(uuid.uuid4())
        evidence_dir = get_user_evidence_dir(user_id)
        evidence_submit_dir = str(evidence_dir / f"court_submitted_{session_id}")
        os.makedirs(evidence_submit_dir, exist_ok=True)

        case_data = self._case_to_dict(case)

        # Initialize CourtSession with Gemini API
        court_session = CourtSession(
            case_data=case_data,
            api_key=self.api_key,
            evidence_submit_dir=evidence_submit_dir,
        )

        # Get opening message from Judge
        opening_response = court_session.process_ai_turn()

        # Update current_speaker to Plaintiff after Judge opens
        court_session.current_speaker = "Plaintiff"

        # Count existing sessions for this user to generate title
        session_count = (
            db.query(CourtSessionModel)
            .filter(CourtSessionModel.user_id == user_id)
            .count()
        )

        # Store in database
        db_session = CourtSessionModel(
            session_id=session_id,
            user_id=user_id,
            case_id=case_id,
            status="active",
            current_speaker="Plaintiff",  # After Judge opens, Plaintiff presents case first
            turn_number=1,
            title=f"Practice Session #{session_count + 1}",
            state_snapshot=self._serialize_session(court_session),
        )
        db.add(db_session)
        db.commit()

        # Cache in memory with session ID for tracking
        court_session.session_id = session_id
        self._session_cache[session_id] = court_session

        return {
            "session_id": session_id,
            "opening_message": self._response_to_dict(opening_response),
        }

    def get_session(self, session_id: str, db: Session) -> Optional[CourtSession]:
        """
        Get session from cache or restore from database.
        """
        # Check cache first
        if session_id in self._session_cache:
            return self._session_cache[session_id]

        # Try to restore from database
        db_session = (
            db.query(CourtSessionModel)
            .filter(CourtSessionModel.session_id == session_id)
            .first()
        )
        if not db_session:
            return None

        # Restore session
        court_session = self._restore_session(db_session.state_snapshot)
        self._session_cache[session_id] = court_session
        return court_session

    def save_session(self, session_id: str, db: Session) -> None:
        """
        Save session state to database.
        """
        if session_id not in self._session_cache:
            # Check if already completed — safe to skip
            db_session = (
                db.query(CourtSessionModel)
                .filter(CourtSessionModel.session_id == session_id)
                .first()
            )
            if db_session and db_session.status == "completed":
                logger.info(f"Session {session_id}: Already completed, skipping save")
                return
            raise ValueError(f"Session {session_id} not found in cache")

        court_session = self._session_cache[session_id]
        db_session = (
            db.query(CourtSessionModel)
            .filter(CourtSessionModel.session_id == session_id)
            .first()
        )
        if not db_session:
            raise ValueError(f"Session {session_id} not found in database")

        db_session.state_snapshot = self._serialize_session(court_session)
        db_session.current_speaker = court_session.current_speaker
        db_session.turn_number = court_session.turn_number
        db_session.updated_at = datetime.utcnow()
        db.commit()

    def get_session_state(self, session_id: str, db: Session) -> Optional[Dict[str, Any]]:
        """
        Get current session state for API response.
        """
        court_session = self.get_session(session_id, db)
        if not court_session:
            return None

        # Fetch verdict_outcome from DB (only stored there, not in CourtSession object)
        db_session = (
            db.query(CourtSessionModel)
            .filter(CourtSessionModel.session_id == session_id)
            .first()
        )
        verdict_outcome = db_session.verdict_outcome if db_session else None
        status = db_session.status if db_session else "active"

        return {
            "session_id": session_id,
            "case_id": db_session.case_id if db_session else None,
            "status": status,
            "current_speaker": court_session.current_speaker,
            "turn_number": court_session.turn_number,
            "history": [self._response_to_dict(msg) for msg in court_session.history],
            "verdict_outcome": verdict_outcome,
        }

    def complete_session(
        self,
        session_id: str,
        db: Session,
        verdict_outcome: Optional[str] = None,
        title: Optional[str] = None,
    ) -> None:
        """
        Mark session as completed and save transcript.

        Args:
            session_id: Session identifier
            db: Database session
            verdict_outcome: 'win', 'lose', or None
            title: Session title (e.g., "Practice Session #1")
        """
        # Get session from cache BEFORE deleting it
        court_session = self._session_cache.get(session_id)

        # Get database record to retrieve user_id
        db_session = (
            db.query(CourtSessionModel)
            .filter(CourtSessionModel.session_id == session_id)
            .first()
        )

        # Update state_snapshot with final history (ensures Judge's last message is persisted)
        if court_session and db_session:
            db_session.state_snapshot = self._serialize_session(court_session)

        # Remove from cache
        if session_id in self._session_cache:
            del self._session_cache[session_id]

        # Update database status
        if db_session:
            db_session.status = "completed"
            if verdict_outcome:
                # Normalize 'loss' -> 'lose' for frontend compatibility
                normalized_outcome = 'lose' if verdict_outcome == 'loss' else verdict_outcome
                db_session.verdict_outcome = normalized_outcome
            if title:
                db_session.title = title
            else:
                # Auto-generate title if not provided
                session_count = (
                    db.query(CourtSessionModel)
                    .filter(CourtSessionModel.user_id == db_session.user_id)
                    .count()
                )
                db_session.title = f"Practice Session #{session_count}"
            db.commit()

    def _case_to_dict(self, case: Case) -> Dict[str, Any]:
        """Convert Case model to dictionary."""
        plaintiffs = [
            {"name": p.name, "address": p.address}
            for p in case.parties
            if p.role == "plaintiff"
        ]
        defendants = [
            {"name": p.name, "address": p.address}
            for p in case.parties
            if p.role == "defendant"
        ]

        return {
            "case_number": case.case_number,
            "case_type": case.case_type,
            "state": case.state,
            "county": case.county,
            "filing_date": case.filing_date.isoformat() if case.filing_date else None,
            "claim_summary": case.claim_summary,
            "amount_sought": float(case.amount_sought) if case.amount_sought else 0,
            "incident_date": case.incident_date.isoformat() if case.incident_date else None,
            "demand_letter_sent": case.demand_letter_sent,
            "agreement_included": case.agreement_included,
            "plaintiffs": plaintiffs,
            "defendants": defendants,
        }

    def _serialize_session(self, session: CourtSession) -> str:
        """
        Serialize CourtSession to JSON string for database storage.
        Stores only essential state, not the AI agents.
        """
        state = {
            "session_id": getattr(session, "session_id", ""),
            "case_data": session.case_data,
            "evidence_submit_dir": session.evidence_submit_dir,
            "current_speaker": session.current_speaker,
            "turn_number": session.turn_number,
            "evidence_buffer": session.evidence_buffer,
            "history": session.history,  # Already dicts from session.py
        }
        return json.dumps(state, default=str)

    def _restore_session(self, state_json: str) -> CourtSession:
        """
        Restore CourtSession from JSON string.
        Ensures evidence directory is properly restored and verified.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        state = json.loads(state_json)

        # Get evidence_submit_dir and verify it exists
        evidence_submit_dir = state.get("evidence_submit_dir", "")
        if not evidence_submit_dir:
            logger.warning(f"evidence_submit_dir missing from state snapshot")

        # Create new session with restored state
        session = CourtSession(
            case_data=state["case_data"],
            api_key=self.api_key,
            evidence_submit_dir=evidence_submit_dir,
        )

        session.session_id = state.get("session_id", "")
        session.current_speaker = state.get("current_speaker", "Judge")
        session.turn_number = state.get("turn_number", 0)
        session.evidence_buffer = state.get("evidence_buffer", [])
        session.history = state.get("history", [])

        # Ensure directory exists after restoration
        if evidence_submit_dir:
            os.makedirs(evidence_submit_dir, exist_ok=True)
            logger.info(f"Evidence directory verified: {evidence_submit_dir}")

        return session

    def _response_to_dict(self, response: Any) -> Dict[str, Any]:
        """
        Convert a response object to dictionary.
        Handles both dict and Pydantic models.
        """
        if isinstance(response, dict):
            return response

        # Try Pydantic model_dump
        if hasattr(response, "model_dump"):
            return response.model_dump()

        # Try __dict__
        if hasattr(response, "__dict__"):
            return vars(response)

        return {"content": str(response)}
