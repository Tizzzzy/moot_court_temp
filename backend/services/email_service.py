import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)


def generate_otp() -> str:
    """Generate a cryptographically-safe 6-digit OTP."""
    return ''.join(random.SystemRandom().choices(string.digits, k=6))


def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """
    Send an HTML email via SMTP.
    Returns True on success.
    Falls back to logging the OTP when SMTP is not configured (dev mode).
    """
    from backend.config import settings

    smtp_host: str = getattr(settings, 'SMTP_HOST', 'smtp.gmail.com')
    smtp_port: int = int(getattr(settings, 'SMTP_PORT', 587))
    smtp_username: str | None = getattr(settings, 'SMTP_USERNAME', None)
    smtp_password: str | None = getattr(settings, 'SMTP_PASSWORD', None)
    smtp_from: str | None = getattr(settings, 'SMTP_FROM_EMAIL', None) or smtp_username

    if not smtp_username or not smtp_password:
        logger.warning(
            "[DEV MODE] SMTP not configured – printing email instead of sending.\n"
            f"  To      : {to_email}\n"
            f"  Subject : {subject}\n"
            f"  (Set SMTP_HOST / SMTP_USERNAME / SMTP_PASSWORD in .env to enable real sending)"
        )
        # Emit the OTP at INFO level so developers can see it in the console
        import re
        otp_match = re.search(r'\b\d{6}\b', body_html)
        if otp_match:
            logger.info(f"[DEV MODE] OTP for {to_email}: {otp_match.group()}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_from, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        return False


def send_verification_email(to_email: str, otp: str) -> bool:
    subject = "Verify your email – Pro Se Pro"
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e40af;margin-bottom:8px;">Email Verification</h2>
      <p style="color:#374151;margin-bottom:16px;">
        Use the code below to verify your email address and complete registration.
      </p>
      <div style="font-size:36px;font-weight:700;letter-spacing:12px;padding:24px;
                  background:#eff6ff;border-radius:10px;text-align:center;
                  color:#1e40af;margin:0 0 20px;">
        {otp}
      </div>
      <p style="color:#6b7280;font-size:14px;">This code expires in <strong>15 minutes</strong>.</p>
      <p style="color:#6b7280;font-size:14px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    """
    return send_email(to_email, subject, body)


def send_password_reset_email(to_email: str, otp: str) -> bool:
    subject = "Reset your password – Pro Se Pro"
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e40af;margin-bottom:8px;">Password Reset</h2>
      <p style="color:#374151;margin-bottom:16px;">
        Use the code below to reset your password.
      </p>
      <div style="font-size:36px;font-weight:700;letter-spacing:12px;padding:24px;
                  background:#eff6ff;border-radius:10px;text-align:center;
                  color:#1e40af;margin:0 0 20px;">
        {otp}
      </div>
      <p style="color:#6b7280;font-size:14px;">This code expires in <strong>15 minutes</strong>.</p>
      <p style="color:#6b7280;font-size:14px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
    """
    return send_email(to_email, subject, body)
