"""Token tracking utilities for monitoring API usage."""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models.user import User


TOKEN_RESET_INTERVAL = timedelta(hours=24)


def refresh_user_tokens_if_needed(user: User, db: Session) -> bool:
    """Reset user token usage if 24 hours have elapsed since last reset.

    Returns:
        True if a reset happened, False otherwise.
    """
    if not user:
        return False

    now = datetime.utcnow()
    last_reset = user.token_reset_at or user.created_at

    if not last_reset or (now - last_reset) >= TOKEN_RESET_INTERVAL:
        user.tokens_used = 0
        user.token_reset_at = now
        db.commit()
        return True

    return False


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
        refresh_user_tokens_if_needed(user, db)
        user.tokens_used = (user.tokens_used or 0) + token_count
        if not user.token_reset_at:
            user.token_reset_at = datetime.utcnow()
        db.commit()
