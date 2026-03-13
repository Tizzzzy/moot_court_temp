"""Token tracking utilities for monitoring API usage."""

from sqlalchemy.orm import Session
from backend.models.user import User


def record_tokens(user_id: str, token_count: int, db: Session) -> None:
    """Record tokens used by a user.

    Args:
        user_id: The user ID
        token_count: Number of tokens to add
        db: Database session
    """
    if not token_count:
        return

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.tokens_used = (user.tokens_used or 0) + token_count
        db.commit()
