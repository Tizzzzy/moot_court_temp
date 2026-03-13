"""Dashboard API endpoints for case and session management."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models.user import User
from backend.models.case import Case, CourtSessionModel, Party
from backend.utils.auth_utils import get_current_user
from pydantic import BaseModel


# Response models
class DashboardPartyInfo(BaseModel):
    name: str


class DashboardCase(BaseModel):
    id: int
    alias: Optional[str]
    case_number: Optional[str]
    case_type: str
    amount_sought: Optional[float]
    hearing_date: Optional[str]
    plaintiffs: List[DashboardPartyInfo]
    defendants: List[DashboardPartyInfo]

    class Config:
        from_attributes = True


class DashboardSession(BaseModel):
    session_id: str
    title: Optional[str]
    status: str
    verdict_outcome: Optional[str]
    case_id: int

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    username: str
    tokens_used: int
    token_limit: int
    cases: List[DashboardCase]
    sessions: List[DashboardSession]


router = APIRouter(tags=["dashboard"])


@router.get("/{user_id}/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    user_id: str,
    db: Session = Depends(get_db),
):
    """
    Get dashboard summary for a user.

    Returns user info, cases, and court sessions.
    """
    # Get user from database (by ID, not requiring auth for this endpoint)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Return empty summary if user not found
        return DashboardSummary(
            username="Unknown",
            tokens_used=0,
            token_limit=3000,
            cases=[],
            sessions=[],
        )

    # Get cases for this user
    cases = (
        db.query(Case)
        .filter(Case.user_id == user_id)
        .order_by(Case.id.desc())
        .all()
    )

    # Convert cases to response format
    dashboard_cases = []
    for case in cases:
        plaintiffs = [
            DashboardPartyInfo(name=party.name)
            for party in case.parties
            if party.role == "plaintiff"
        ]
        defendants = [
            DashboardPartyInfo(name=party.name)
            for party in case.parties
            if party.role == "defendant"
        ]
        dashboard_cases.append(
            DashboardCase(
                id=case.id,
                alias=case.alias,
                case_number=case.case_number,
                case_type=case.case_type,
                amount_sought=float(case.amount_sought) if case.amount_sought else None,
                hearing_date=case.hearing_date,
                plaintiffs=plaintiffs,
                defendants=defendants,
            )
        )

    # Get court sessions for this user
    sessions = (
        db.query(CourtSessionModel)
        .filter(CourtSessionModel.user_id == user_id)
        .order_by(CourtSessionModel.created_at.desc())
        .all()
    )

    dashboard_sessions = [
        DashboardSession(
            session_id=session.session_id,
            title=session.title,
            status=session.status,
            verdict_outcome=session.verdict_outcome,
            case_id=session.case_id,
        )
        for session in sessions
    ]

    return DashboardSummary(
        username=user.username,
        tokens_used=user.tokens_used or 0,
        token_limit=user.token_limit or 3000,
        cases=dashboard_cases,
        sessions=dashboard_sessions,
    )
