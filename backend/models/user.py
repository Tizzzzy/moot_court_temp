import uuid
from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.sql import func
from backend.database import Base


def generate_user_id():
    """Generate a UUID for user ID."""
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_user_id)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    tokens_used = Column(Integer, default=0)
    token_limit = Column(Integer, default=30000)
    created_at = Column(DateTime, server_default=func.now())
