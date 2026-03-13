from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from backend.database import get_db
from backend.models.case import Case, Party

router = APIRouter()


class PartyUpdate(BaseModel):
    name: str
    address: Optional[str] = None


class CaseUpdate(BaseModel):
    alias: Optional[str] = None
    case_number: Optional[str] = None
    case_type: Optional[str] = None
    state: Optional[str] = None
    county: Optional[str] = None
    filing_date: Optional[str] = None
    hearing_date: Optional[str] = None
    claim_summary: Optional[str] = None
    amount_sought: Optional[float] = None
    incident_date: Optional[str] = None
    demand_letter_sent: Optional[bool] = None
    agreement_included: Optional[bool] = None
    plaintiffs: Optional[List[PartyUpdate]] = None
    defendants: Optional[List[PartyUpdate]] = None


def _case_to_dict(case: Case) -> dict:
    return {
        "id": case.id,
        "user_id": case.user_id,
        "alias": case.alias,
        "case_number": case.case_number,
        "case_type": case.case_type,
        "state": case.state,
        "county": case.county,
        "filing_date": case.filing_date.isoformat() if case.filing_date else None,
        "hearing_date": case.hearing_date,
        "claim_summary": case.claim_summary,
        "amount_sought": float(case.amount_sought) if case.amount_sought else None,
        "incident_date": case.incident_date.isoformat() if case.incident_date else None,
        "demand_letter_sent": case.demand_letter_sent,
        "agreement_included": case.agreement_included,
        "status": case.status,
        "plaintiffs": [
            {"id": p.id, "name": p.name, "address": p.address}
            for p in case.parties if p.role == "plaintiff"
        ],
        "defendants": [
            {"id": p.id, "name": p.name, "address": p.address}
            for p in case.parties if p.role == "defendant"
        ],
        "created_at": case.created_at.isoformat(),
    }


@router.get("/{case_id}")
def get_case(case_id: int, db: Session = Depends(get_db)):
    """Retrieve case details"""
    case = db.query(Case).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    return _case_to_dict(case)


@router.put("/{case_id}")
def update_case(case_id: int, update: CaseUpdate, db: Session = Depends(get_db)):
    """Update case details"""
    case = db.query(Case).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    # Update scalar fields if provided
    scalar_fields = [
        "alias", "case_number", "case_type", "state", "county",
        "hearing_date", "claim_summary", "demand_letter_sent", "agreement_included",
    ]
    for field in scalar_fields:
        value = getattr(update, field)
        if value is not None:
            setattr(case, field, value)

    # Handle date fields (stored as Date, passed as string)
    if update.filing_date is not None:
        from datetime import date
        try:
            case.filing_date = date.fromisoformat(update.filing_date) if update.filing_date else None
        except ValueError:
            case.filing_date = None

    if update.incident_date is not None:
        from datetime import date
        try:
            case.incident_date = date.fromisoformat(update.incident_date) if update.incident_date else None
        except ValueError:
            case.incident_date = None

    if update.amount_sought is not None:
        case.amount_sought = update.amount_sought

    # Replace parties if provided
    if update.plaintiffs is not None:
        for p in list(case.parties):
            if p.role == "plaintiff":
                db.delete(p)
        db.flush()
        for p in update.plaintiffs:
            db.add(Party(case_id=case.id, role="plaintiff", name=p.name, address=p.address))

    if update.defendants is not None:
        for p in list(case.parties):
            if p.role == "defendant":
                db.delete(p)
        db.flush()
        for p in update.defendants:
            db.add(Party(case_id=case.id, role="defendant", name=p.name, address=p.address))

    db.commit()
    db.refresh(case)
    return _case_to_dict(case)
