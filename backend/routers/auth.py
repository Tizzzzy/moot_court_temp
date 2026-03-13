from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google.auth.transport import requests
from google.oauth2 import id_token
from datetime import datetime, timedelta
import os
from backend.database import get_db
from backend.models.user import User
from backend.models.verification_token import VerificationToken
from backend.utils.auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from backend.services.email_service import (
    generate_otp,
    send_verification_email,
    send_password_reset_email,
)

router = APIRouter(tags=["authentication"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    otp: str


class SendVerificationRequest(BaseModel):
    email: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    email: str


class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    tokens_used: int = 0
    token_limit: int = 30000


class GoogleLoginRequest(BaseModel):
    id_token: str


@router.post("/send-verification", response_model=MessageResponse)
async def send_verification(request: SendVerificationRequest, db: Session = Depends(get_db)):
    """
    Send a 6-digit OTP to the given email for registration verification.
    Must be called before /register.
    """
    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    otp = generate_otp()

    # Invalidate any previous unused tokens for this email
    db.query(VerificationToken).filter(
        VerificationToken.email == request.email,
        VerificationToken.token_type == "email_verify",
    ).delete()

    token_record = VerificationToken(
        email=request.email,
        token=otp,
        token_type="email_verify",
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    db.add(token_record)
    db.commit()

    send_verification_email(request.email, otp)

    return MessageResponse(message="Verification code sent to your email")


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user after email OTP verification.
    Requires a valid OTP obtained from /send-verification.
    """
    # Verify OTP
    token_record = db.query(VerificationToken).filter(
        VerificationToken.email == request.email,
        VerificationToken.token_type == "email_verify",
        VerificationToken.token == request.otp,
        VerificationToken.is_used == False,
        VerificationToken.expires_at > datetime.utcnow(),
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    # Mark token as used immediately to prevent replay
    token_record.is_used = True
    db.flush()

    # Check if username already exists
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Create new verified user
    user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create JWT token
    access_token = create_access_token(data={"sub": user.id})

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with username and password.
    Returns JWT token.
    """
    user = db.query(User).filter(User.username == request.username).first()

    if user is None or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    # Create JWT token
    access_token = create_access_token(data={"sub": user.id})

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send a password-reset OTP to the given email.
    Always returns 200 to avoid revealing whether the email is registered.
    """
    user = db.query(User).filter(User.email == request.email).first()

    if user:
        otp = generate_otp()

        # Invalidate previous reset tokens for this email
        db.query(VerificationToken).filter(
            VerificationToken.email == request.email,
            VerificationToken.token_type == "password_reset",
        ).delete()

        token_record = VerificationToken(
            email=request.email,
            token=otp,
            token_type="password_reset",
            expires_at=datetime.utcnow() + timedelta(minutes=15),
        )
        db.add(token_record)
        db.commit()

        send_password_reset_email(request.email, otp)

    return MessageResponse(
        message="If an account with that email exists, a reset code has been sent"
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset a user's password using a valid OTP from /forgot-password.
    """
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )

    token_record = db.query(VerificationToken).filter(
        VerificationToken.email == request.email,
        VerificationToken.token_type == "password_reset",
        VerificationToken.token == request.otp,
        VerificationToken.is_used == False,
        VerificationToken.expires_at > datetime.utcnow(),
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code",
        )

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.hashed_password = hash_password(request.new_password)
    token_record.is_used = True
    db.commit()

    return MessageResponse(message="Password reset successfully")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current user info from JWT token.
    Used by frontend on page load to validate token.
    """
    return UserResponse(
        user_id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        tokens_used=current_user.tokens_used or 0,
        token_limit=current_user.token_limit or 3000,
    )


@router.post("/google", response_model=AuthResponse)
async def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Google OAuth login endpoint.
    Verifies Google ID token and creates/retrieves user.
    """
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    if not google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured",
        )

    try:
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(request.id_token, requests.Request(), google_client_id)

        # Extract user info from token
        email = idinfo.get("email")
        name = idinfo.get("name", "").split()[0] if idinfo.get("name") else "user"

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google token",
            )

        # Find or create user
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Generate a unique username from email
            username_base = email.split("@")[0]
            username = username_base
            counter = 1

            while db.query(User).filter(User.username == username).first():
                username = f"{username_base}{counter}"
                counter += 1

            # Create new user with empty password (OAuth user)
            user = User(
                username=username,
                email=email,
                hashed_password=hash_password(""),  # OAuth users don't have passwords
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is inactive",
            )

        # Create JWT token
        access_token = create_access_token(data={"sub": user.id})

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            username=user.username,
            email=user.email,
        )

    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google authentication failed: {str(e)}",
        )
