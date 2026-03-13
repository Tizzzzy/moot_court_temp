from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional


class Settings(BaseSettings):
    # OPENAI_API_KEY: str  # For evidence analysis
    GEMINI_API_KEY: str  # For OCR and court simulator
    HUGGINGFACE_TOKEN: str
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/moot_court"
    BASE_DATA_DIR: Optional[str] = None  # Will default in path_utils if not set
    MAX_UPLOAD_SIZE_MB: int = 50

    # Authentication
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Email / SMTP (leave blank to use dev-mode console logging)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


settings = Settings()
