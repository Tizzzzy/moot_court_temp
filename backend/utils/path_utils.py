"""
Centralized path management utility for the Moot Court application.

This module provides:
- Smart defaults that work cross-platform (Windows, Mac, Linux)
- Validation of configured paths with clear error messages
- Automatic directory creation
- Single source of truth for all path operations
"""

import os
import sys
from pathlib import Path
from typing import Optional


def get_project_root() -> Path:
    """
    Get the project root directory reliably.

    Returns:
        Path to the project root (parent of 'backend' directory)
    """
    # This file is at backend/utils/path_utils.py
    # Going up 3 levels: backend/utils/path_utils.py -> backend/utils -> backend -> project_root
    return Path(__file__).parent.parent.parent


def get_base_data_dir() -> Path:
    """
    Get the base data directory with smart defaults.

    Logic:
    1. Check if BASE_DATA_DIR environment variable is set
    2. If set, validate it's an absolute path (has drive letter on Windows)
    3. If not set, default to {project_root}/data
    4. Create directory if it doesn't exist

    Returns:
        Path object pointing to the data directory

    Raises:
        RuntimeError: If BASE_DATA_DIR is configured but invalid
    """
    from backend.config import settings

    # Check if BASE_DATA_DIR is configured in .env
    base_data_dir_str = getattr(settings, "BASE_DATA_DIR", None)

    if base_data_dir_str:
        # Convert string to Path and validate
        path = Path(base_data_dir_str)

        # On Windows, check for drive letter; on Unix, check for leading /
        if sys.platform == "win32":
            is_absolute = path.is_absolute() and len(str(path)) > 2 and str(path)[1] == ":"
        else:
            is_absolute = path.is_absolute()

        if not is_absolute:
            project_root = get_project_root()
            raise RuntimeError(
                f"[ERROR] Path configuration invalid: BASE_DATA_DIR must be an absolute path.\n"
                f"Got: {base_data_dir_str}\n"
                f"Current working directory: {os.getcwd()}\n"
                f"Project root: {project_root}\n"
                f"Hint: Use forward slashes and include drive letter on Windows "
                f"(e.g., C:/Users/...)"
            )

        return path

    # Default to {project_root}/data
    project_root = get_project_root()
    default_dir = project_root / "data"

    # Create if it doesn't exist
    default_dir.mkdir(parents=True, exist_ok=True)

    return default_dir


def get_user_dir(user_id: str) -> Path:
    """
    Get the base directory for a user.

    Args:
        user_id: Unique user identifier

    Returns:
        Path to user's directory (created if doesn't exist)
    """
    base_dir = get_base_data_dir()
    user_path = base_dir / user_id
    user_path.mkdir(parents=True, exist_ok=True)
    return user_path


def get_user_claims_dir(user_id: str) -> Path:
    """
    Get the directory for user's uploaded claims/PDFs.

    Args:
        user_id: Unique user identifier

    Returns:
        Path to {base_data_dir}/{user_id}/claims/ (created if doesn't exist)
    """
    claims_path = get_user_dir(user_id) / "claims"
    claims_path.mkdir(parents=True, exist_ok=True)
    return claims_path


def get_user_ocr_output_dir(user_id: str) -> Path:
    """
    Get the directory for OCR processing output.

    Args:
        user_id: Unique user identifier

    Returns:
        Path to {base_data_dir}/{user_id}/ocr_output/ (created if doesn't exist)
    """
    ocr_path = get_user_dir(user_id) / "ocr_output"
    ocr_path.mkdir(parents=True, exist_ok=True)
    return ocr_path


def get_user_evidence_dir(user_id: str) -> Path:
    """
    Get the directory for evidence files.

    Args:
        user_id: Unique user identifier

    Returns:
        Path to {base_data_dir}/{user_id}/evidence/ (created if doesn't exist)
    """
    evidence_path = get_user_dir(user_id) / "evidence"
    evidence_path.mkdir(parents=True, exist_ok=True)
    return evidence_path


def get_extracted_data_path(user_id: str) -> Path:
    """
    Get the path to extracted_data.json for a user.

    Args:
        user_id: Unique user identifier

    Returns:
        Path to {base_data_dir}/{user_id}/ocr_output/extracted_data.json
    """
    return get_user_ocr_output_dir(user_id) / "extracted_data.json"


def get_case_extracted_data_path(user_id: str, case_id: int) -> Path:
    """
    Get the path to case-specific extracted data JSON.

    Returns:
        Path to {base_data_dir}/{user_id}/ocr_output/case_{case_id}_extracted_data.json
    """
    return get_user_ocr_output_dir(user_id) / f"case_{case_id}_extracted_data.json"


def get_case_evidence_dir(user_id: str, case_id: int) -> Path:
    """
    Get the evidence directory for a specific case.

    Returns:
        Path to {base_data_dir}/{user_id}/evidence/case_{case_id}/ (created if doesn't exist)
    """
    case_evidence_path = get_user_evidence_dir(user_id) / f"case_{case_id}"
    case_evidence_path.mkdir(parents=True, exist_ok=True)
    return case_evidence_path


def get_case_recommend_evidence_dir(user_id: str, case_id: int) -> Path:
    """
    Get the recommend_evidence directory for a specific case (used for uploads/analysis).

    Returns:
        Path to {base_data_dir}/{user_id}/evidence/case_{case_id}/recommend_evidence/
    """
    rec_path = get_case_evidence_dir(user_id, case_id) / "recommend_evidence"
    rec_path.mkdir(parents=True, exist_ok=True)
    return rec_path


def get_case_staging_evidence_dir(user_id: str, case_id: int) -> Path:
    """
    Get the staging directory for recommendation evidence uploads.

    Files are uploaded here first and only promoted to recommend_evidence after
    they pass analysis.

    Returns:
        Path to {base_data_dir}/{user_id}/evidence/case_{case_id}/staging_recommend_evidence/
    """
    staging_path = get_case_evidence_dir(user_id, case_id) / "staging_recommend_evidence"
    staging_path.mkdir(parents=True, exist_ok=True)
    return staging_path


def validate_path_config() -> dict:
    """
    Validate path configuration on startup.

    Returns:
        Dictionary with configuration details:
        {
            "base_data_dir": str,
            "project_root": str,
            "is_default": bool,
            "status": "valid"
        }

    Raises:
        RuntimeError: If configuration is invalid
    """
    try:
        project_root = get_project_root()
        base_data_dir = get_base_data_dir()

        # Check if using default or custom configuration
        is_default = (base_data_dir == project_root / "data")

        return {
            "base_data_dir": str(base_data_dir),
            "project_root": str(project_root),
            "is_default": is_default,
            "status": "valid"
        }
    except Exception as e:
        raise RuntimeError(f"[ERROR] Path configuration validation failed: {e}")
