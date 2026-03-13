from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.case import Case, Party

router = APIRouter()


def _case_to_dict(case: Case) -> dict:
    """Serialize a Case ORM object to the same dict format the frontend expects."""
    return {
        "case_id": case.id,
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


@router.get("/{user_id}")
def get_case_data(user_id: str, db: Session = Depends(get_db)):
    """Return the most recent case for a user, read entirely from the database."""
    case = (
        db.query(Case)
        .filter(Case.user_id == user_id)
        .order_by(Case.id.desc())
        .first()
    )
    if not case:
        raise HTTPException(404, f"No case found for user {user_id}")
    return _case_to_dict(case)
