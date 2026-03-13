from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.sql import func
from backend.database import Base


class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    token = Column(String(6), nullable=False)
    token_type = Column(String(20), nullable=False)  # "email_verify" or "password_reset"
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
