import shutil
import logging
import mimetypes
from pathlib import Path
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, UploadFile, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.case import (
    Case as CaseModel,
    Party as PartyModel,
    EvidenceItem as EvidenceItemModel,
    EvidenceFile as EvidenceFileModel,
    EvidenceStatus,
)
from backend.config import settings
from backend.services.openai_evidence import recommend_evidence
from backend.services.evidence_analysis import evidence_feedback as analyze_evidence_file
from fastapi import Query
from backend.utils.path_utils import (
    get_user_evidence_dir,
    get_case_recommend_evidence_dir,
    get_case_staging_evidence_dir,
)
from backend.utils.auth_utils import get_optional_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pydantic input/output models
# ---------------------------------------------------------------------------

class Party(BaseModel):
    name: str
    address: Optional[str] = None


class CaseDataInput(BaseModel):
    """Input model for manually entered case data from frontend form."""
    case_number: Optional[str] = None
    case_type: str
    state: str
    county: Optional[str] = None
    filing_date: Optional[str] = None
    hearing_date: Optional[str] = None
    plaintiffs: List[Party]
    defendants: List[Party]
    claim_summary: str
    amount_sought: Optional[float] = None
    incident_date: Optional[str] = None
    demand_letter_sent: bool = False
    agreement_included: bool = False
    existing_case_id: Optional[int] = None  # If set, update this case instead of creating new


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_date(s):
    if not s:
        return None
    if isinstance(s, date):
        return s
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _case_model_to_dict(case: CaseModel) -> dict:
    """Serialize a Case ORM object to the same shape the LLM / analysis code expects."""
    return {
        "case_number": case.case_number,
        "case_type": case.case_type,
        "state": case.state,
        "county": case.county,
        "filing_date": case.filing_date.isoformat() if case.filing_date else None,
        "hearing_date": case.hearing_date,
        "plaintiffs": [
            {"name": p.name, "address": p.address}
            for p in case.parties if p.role == "plaintiff"
        ],
        "defendants": [
            {"name": p.name, "address": p.address}
            for p in case.parties if p.role == "defendant"
        ],
        "claim_summary": case.claim_summary,
        "amount_sought": float(case.amount_sought) if case.amount_sought else None,
        "incident_date": case.incident_date.isoformat() if case.incident_date else None,
        "demand_letter_sent": case.demand_letter_sent,
        "agreement_included": case.agreement_included,
    }


def _save_evidence_items(case_id: int, evidence_dict: dict, db: Session):
    """
    Persist evidence recommendations as EvidenceItem rows.
    Skips names that already exist for this case.
    """
    existing_names = {
        row.evidence_name
        for row in db.query(EvidenceItemModel.evidence_name)
                      .filter_by(case_id=case_id)
                      .all()
    }
    for name, description in evidence_dict.items():
        if name not in existing_names:
            db.add(EvidenceItemModel(
                case_id=case_id,
                evidence_name=name,
                description=description,
            ))
    db.commit()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/submit-case/{user_id}")
def submit_case_data(
    user_id: str,
    case_data: CaseDataInput,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Accept manually entered case data from the frontend form, save/update the
    Case row in the database, generate evidence recommendations via Gemini, and
    persist them as EvidenceItem rows.  No JSON files are written to disk.
    """
    effective_user_id = current_user.id if current_user else user_id

    # ---------- Upsert Case in DB ----------
    if case_data.existing_case_id is not None:
        existing_case = db.query(CaseModel).filter_by(id=case_data.existing_case_id).first()
        if existing_case and existing_case.user_id == effective_user_id:
            existing_case.case_number = case_data.case_number
            existing_case.case_type = case_data.case_type
            existing_case.state = case_data.state
            existing_case.county = case_data.county
            existing_case.filing_date = _parse_date(case_data.filing_date)
            existing_case.hearing_date = case_data.hearing_date
            existing_case.claim_summary = case_data.claim_summary
            existing_case.amount_sought = case_data.amount_sought
            existing_case.incident_date = _parse_date(case_data.incident_date)
            existing_case.demand_letter_sent = case_data.demand_letter_sent
            existing_case.agreement_included = case_data.agreement_included
            existing_case.status = "active"

            for party in list(existing_case.parties):
                db.delete(party)
            db.flush()
            for p in case_data.plaintiffs:
                db.add(PartyModel(case_id=existing_case.id, role="plaintiff", name=p.name, address=p.address))
            for d in case_data.defendants:
                db.add(PartyModel(case_id=existing_case.id, role="defendant", name=d.name, address=d.address))

            db.commit()
            case_id = existing_case.id
            case_obj = existing_case
            print(f"[CASE] Updated existing OCR case {case_id} for user {effective_user_id}")
        else:
            case_data.existing_case_id = None

    if case_data.existing_case_id is None:
        new_case = CaseModel(
            user_id=effective_user_id,
            case_number=case_data.case_number,
            case_type=case_data.case_type,
            state=case_data.state,
            county=case_data.county,
            filing_date=_parse_date(case_data.filing_date),
            hearing_date=case_data.hearing_date,
            claim_summary=case_data.claim_summary,
            amount_sought=case_data.amount_sought,
            incident_date=_parse_date(case_data.incident_date),
            demand_letter_sent=case_data.demand_letter_sent,
            agreement_included=case_data.agreement_included,
            status="active",
        )
        db.add(new_case)
        db.flush()

        for p in case_data.plaintiffs:
            db.add(PartyModel(case_id=new_case.id, role="plaintiff", name=p.name, address=p.address))
        for d in case_data.defendants:
            db.add(PartyModel(case_id=new_case.id, role="defendant", name=d.name, address=d.address))

        db.commit()
        case_id = new_case.id
        case_obj = new_case

    print(f"[CASE] Saved case data for user {effective_user_id}, case_id={case_id}")

    # ---------- Generate evidence recommendations ----------
    case_dict = _case_model_to_dict(case_obj)
    try:
        evidence_dict = recommend_evidence(case_dict, settings.GEMINI_API_KEY)
        print(f"[EVIDENCE] Generated {len(evidence_dict)} recommendations via Gemini")
    except Exception as e:
        print(f"[WARN] Gemini API failed ({e}), using fallback recommendations")
        evidence_dict = _fallback_recommendations(case_dict)

    # ---------- Persist recommendations to DB ----------
    _save_evidence_items(case_id, evidence_dict, db)

    return {
        "success": True,
        "user_id": effective_user_id,
        "case_id": case_id,
        "recommendations": evidence_dict,
        "message": "Case data saved and evidence recommendations generated",
    }


@router.get("/recommend/{user_id}")
def get_evidence_recommendations(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Return evidence recommendations for the user's most recent case from the database."""
    effective_user_id = current_user.id if current_user else user_id

    case = (
        db.query(CaseModel)
        .filter(CaseModel.user_id == effective_user_id)
        .order_by(CaseModel.id.desc())
        .first()
    )
    if not case:
        raise HTTPException(404, f"No case found for user {effective_user_id}")

    items = db.query(EvidenceItemModel).filter_by(case_id=case.id).all()

    if items:
        evidence_dict = {item.evidence_name: item.description for item in items}
        return {"recommendations": evidence_dict, "cached": True}

    # Nothing in DB yet â€” generate and save
    case_dict = _case_model_to_dict(case)
    try:
        evidence_dict = recommend_evidence(case_dict, settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"[WARN] Gemini API failed ({e}), using fallback recommendations")
        evidence_dict = _fallback_recommendations(case_dict)

    _save_evidence_items(case.id, evidence_dict, db)
    return {"recommendations": evidence_dict, "cached": False}


@router.get("/for-case/{case_id}")
def get_evidence_recommendations_for_case(
    case_id: int,
    db: Session = Depends(get_db),
):
    """Return evidence recommendations for a specific case from the database."""
    case = db.query(CaseModel).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    items = db.query(EvidenceItemModel).filter_by(case_id=case_id).all()

    if items:
        evidence_dict = {item.evidence_name: item.description for item in items}
        return {"recommendations": evidence_dict, "cached": True}

    # Generate and save
    case_dict = _case_model_to_dict(case)
    try:
        evidence_dict = recommend_evidence(case_dict, settings.GEMINI_API_KEY)
        print(f"[EVIDENCE] Generated {len(evidence_dict)} recommendations for case {case_id}")
    except Exception as e:
        print(f"[WARN] Gemini API failed ({e}), using fallback recommendations")
        evidence_dict = _fallback_recommendations(case_dict)

    _save_evidence_items(case_id, evidence_dict, db)
    return {"recommendations": evidence_dict, "cached": False}


@router.post("/upload/{user_id}/{folder_name}")
async def upload_evidence_file(
    user_id: str,
    folder_name: str,
    file: UploadFile,
    case_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Upload an evidence file to staging.

    The file is only promoted to recommend_evidence after analysis marks it as ready.
    """
    if case_id is not None:
        evidence_folder = get_case_staging_evidence_dir(user_id, case_id) / folder_name
    else:
        evidence_folder = get_user_evidence_dir(user_id) / "staging_recommend_evidence" / folder_name

    evidence_folder.mkdir(parents=True, exist_ok=True)

    file_path = evidence_folder / file.filename
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "filename": file.filename,
        "size": len(content),
        "path": str(file_path),
        "staged": True,
    }


@router.post("/analyze/{user_id}/{folder_name}")
def analyze_evidence(
    user_id: str,
    folder_name: str,
    case_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Analyze uploaded evidence files.  Case data and evidence description are
    read from the database; feedback is written back to EvidenceFile rows in
    the database (no feedback_*.md files on disk).
    """
    # ---------- Load case data from DB ----------
    if case_id is not None:
        case = db.query(CaseModel).filter_by(id=case_id).first()
        if not case:
            raise HTTPException(404, f"Case {case_id} not found")
        case_data = _case_model_to_dict(case)
    else:
        # Fallback: use the most recent case for this user
        case = (
            db.query(CaseModel)
            .filter(CaseModel.user_id == user_id)
            .order_by(CaseModel.id.desc())
            .first()
        )
        if not case:
            raise HTTPException(404, "No case found for this user")
        case_data = _case_model_to_dict(case)
        case_id = case.id

    # ---------- Load evidence description from DB ----------
    evidence_item = (
        db.query(EvidenceItemModel)
        .filter_by(case_id=case_id, evidence_name=folder_name)
        .first()
    )
    if not evidence_item:
        raise HTTPException(404, f"Evidence folder '{folder_name}' not found in database")

    description = evidence_item.description

    # ---------- Collect staged evidence files ----------
    if case_id is not None:
        staging_folder = get_case_staging_evidence_dir(user_id, case_id) / folder_name
        ready_folder = get_case_recommend_evidence_dir(user_id, case_id) / folder_name
    else:
        staging_folder = get_user_evidence_dir(user_id) / "staging_recommend_evidence" / folder_name
        ready_folder = get_user_evidence_dir(user_id) / "recommend_evidence" / folder_name

    if not staging_folder.exists():
        raise HTTPException(400, "No staged evidence found for this folder")

    staged_file_paths = [
        f for f in staging_folder.iterdir()
        if f.is_file() and f.name != "description.txt" and not f.name.startswith("feedback_")
    ]

    if not staged_file_paths:
        raise HTTPException(400, "No staged evidence files found for this folder")

    # ---------- Analyze and save feedback to DB ----------
    results = []
    ready_folder.mkdir(parents=True, exist_ok=True)

    # Replacement semantics: once user submits new evidence for a category,
    # old stored files are removed and replaced by this analysis batch.
    existing_files = (
        db.query(EvidenceFileModel)
        .filter_by(evidence_item_id=evidence_item.id)
        .all()
    )
    for existing in existing_files:
        if existing.file_path:
            existing_path = Path(existing.file_path)
            if existing_path.exists() and existing_path.is_file():
                existing_path.unlink(missing_ok=True)
        db.delete(existing)
    db.flush()

    for staged_file_path in staged_file_paths:
        file_path = str(staged_file_path)
        filename = staged_file_path.name
        staged_size = staged_file_path.stat().st_size if staged_file_path.exists() else 0
        
        guessed_type, _ = mimetypes.guess_type(filename)
        # Fallback to octet-stream only if the extension is completely unknown
        final_mime_type = guessed_type or "application/octet-stream"
        
        ready_status, feedback = analyze_evidence_file(
            case_data, description, [file_path], settings.GEMINI_API_KEY
        )

        if ready_status:
            ready_path = ready_folder / filename
            if ready_path.exists():
                ready_path.unlink()
            shutil.move(str(staged_file_path), str(ready_path))

            db.add(EvidenceFileModel(
                evidence_item_id=evidence_item.id,
                filename=filename,
                file_path=str(ready_path),
                feedback=feedback,
                is_ready=True,
                mime_type=final_mime_type,
                size_bytes=ready_path.stat().st_size,
            ))
        else:
            staged_file_path.unlink(missing_ok=True)
            db.add(EvidenceFileModel(
                evidence_item_id=evidence_item.id,
                filename=filename,
                file_path=None,
                feedback=feedback,
                is_ready=False,
                mime_type=final_mime_type,
                size_bytes=staged_size,
            ))

        results.append({
            "filename": filename,
            "ready_status": ready_status,
            "specific_feedback": feedback,
        })

    db.flush()

    # Update parent EvidenceItem status from persisted ready files only
    persisted_ready_count = (
        db.query(EvidenceFileModel)
        .filter_by(evidence_item_id=evidence_item.id, is_ready=True)
        .count()
    )
    evidence_item.status = (
        EvidenceStatus.READY if persisted_ready_count > 0 else EvidenceStatus.NOT_READY
    )
    db.commit()

    return {"folder": folder_name, "results": results}


@router.get("/status/{user_id}")
def get_evidence_status(
    user_id: str,
    case_id: Optional[int] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Returns readiness status for each evidence category.
    Reads entirely from the database â€” no filesystem scanning.
    """
    effective_user_id = current_user.id if current_user else user_id

    if case_id is None:
        # Determine the latest case for this user
        case = (
            db.query(CaseModel)
            .filter(CaseModel.user_id == effective_user_id)
            .order_by(CaseModel.id.desc())
            .first()
        )
        if not case:
            return {"status": {}}
        case_id = case.id

    items = db.query(EvidenceItemModel).filter_by(case_id=case_id).all()
    status: dict = {}

    for item in items:
        files_info = []
        file_feedbacks: dict = {}
        is_ready = False
        ready_file_count = 0

        for ef in item.files:
            files_info.append({
                "filename": ef.filename,
                "is_ready": bool(ef.is_ready),
                "feedback": ef.feedback,
                "size_bytes": ef.size_bytes,
            })
            if ef.is_ready:
                ready_file_count += 1
                is_ready = True
            if ef.feedback:
                stem = Path(ef.filename).stem
                file_feedbacks[stem] = ef.feedback

        status[item.evidence_name] = {
            "has_files": len(files_info) > 0,
            "file_count": len(files_info),
            "files": files_info,
            "is_ready": is_ready,
            "file_feedbacks": file_feedbacks,
            "description": item.description,
        }

        expected_status = (
            EvidenceStatus.READY if ready_file_count > 0 else EvidenceStatus.NOT_READY
        )
        if item.status != expected_status:
            logger.warning(
                "Correcting evidence status mismatch: case_id=%s evidence_name=%s old=%s new=%s",
                item.case_id,
                item.evidence_name,
                item.status,
                expected_status,
            )
            item.status = expected_status

    db.commit()

    return {"status": status}


# ---------------------------------------------------------------------------
# Fallback evidence recommendations (no LLM)
# ---------------------------------------------------------------------------

def _fallback_recommendations(case_data: dict) -> dict:
    """Generate basic evidence recommendations without an LLM call."""
    case_type = case_data.get("case_type", "").lower()
    summary = case_data.get("claim_summary", "")
    defendant = case_data.get("defendants", [{}])[0].get("name", "the defendant")

    recs = {}

    recs["Incident_Documentation"] = (
        f"Any documents, photos, or records that describe the incident involving {defendant}. "
        "This could include written accounts, dated notes, or official reports."
    )

    recs["Financial_Records"] = (
        f"Receipts, invoices, bills, or payment records showing the financial damages "
        f"of ${case_data.get('amount_sought', 'N/A')}. Include any out-of-pocket expenses."
    )

    recs["Communication_Records"] = (
        f"Emails, text messages, letters, or any written communication between you and {defendant} "
        "related to this dispute, including any attempts to resolve the matter."
    )

    recs["Photographic_Evidence"] = (
        "Photos or videos documenting the damage, injury, or conditions relevant to your claim. "
        "Include timestamps if available."
    )

    if "medical" in summary.lower() or "dental" in summary.lower() or "injury" in summary.lower() or "tooth" in summary.lower():
        recs["Medical_Records"] = (
            "Medical or dental records, treatment plans, diagnosis reports, and bills "
            "showing the treatment required as a result of the incident."
        )

    if case_data.get("demand_letter_sent"):
        recs["Demand_Letter_Copy"] = (
            f"A copy of the demand letter sent to {defendant} requesting resolution "
            "before filing this claim."
        )

    return recs

