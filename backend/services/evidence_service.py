import os
import shutil
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from fastapi import UploadFile


class EvidenceService:
    """
    Service for handling evidence file uploads during court simulation.
    """

    # Allowed MIME types for evidence
    ALLOWED_MIME_TYPES = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
    }

    MAX_FILE_SIZE_MB = 10

    def __init__(self, base_evidence_dir: str):
        """
        Initialize the evidence service.

        Args:
            base_evidence_dir: Base directory for evidence storage
        """
        self.base_dir = Path(base_evidence_dir)

    async def upload_evidence(
        self,
        files: List[UploadFile],
        turn_number: int,
    ) -> List[dict]:
        """
        Upload evidence files for a court session.

        Args:
            files: List of uploaded files
            turn_number: Current turn number for naming files

        Returns:
            List of uploaded file metadata

        Raises:
            ValueError: If file validation fails
        """
        uploaded_files = []

        # Create target directory
        self.base_dir.mkdir(parents=True, exist_ok=True)

        for idx, file in enumerate(files):
            # Validate MIME type
            if file.content_type not in self.ALLOWED_MIME_TYPES:
                raise ValueError(
                    f"File '{file.filename}' has unsupported type '{file.content_type}'. "
                    f"Allowed: PDF, JPEG, PNG"
                )

            # Read file content to check size
            content = await file.read()
            file_size_mb = len(content) / (1024 * 1024)

            if file_size_mb > self.MAX_FILE_SIZE_MB:
                raise ValueError(
                    f"File '{file.filename}' is too large ({file_size_mb:.1f}MB). "
                    f"Maximum: {self.MAX_FILE_SIZE_MB}MB"
                )

            # Generate filename
            ext = self.ALLOWED_MIME_TYPES[file.content_type]
            sanitized_name = self._sanitize_filename(file.filename)
            base_name = os.path.splitext(sanitized_name)[0]

            # Handle duplicate filenames in same turn
            turn_filename = f"turn_{turn_number}_{idx + 1}_{base_name}{ext}"
            file_path = self.base_dir / turn_filename

            # Save file
            with open(file_path, "wb") as f:
                f.write(content)

            uploaded_files.append(
                {
                    "filename": turn_filename,
                    "path": str(file_path),
                    "size_bytes": len(content),
                    "mime_type": file.content_type,
                    "upload_time": datetime.utcnow().isoformat(),
                }
            )

        return uploaded_files

    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """
        Sanitize filename: lowercase, replace spaces, remove special chars.

        Args:
            filename: Original filename

        Returns:
            Sanitized filename
        """
        name, ext = os.path.splitext(filename)
        name = name.lower().replace(" ", "_")
        name = "".join(c for c in name if c.isalnum() or c in "-_")
        return name + ext.lower()

    def get_evidence_files(self) -> List[dict]:
        """
        Get list of all evidence files in the directory.

        Returns:
            List of file metadata
        """
        files = []

        if not self.base_dir.exists():
            return files

        for file_path in sorted(self.base_dir.iterdir()):
            if file_path.is_file():
                stat = file_path.stat()
                files.append(
                    {
                        "filename": file_path.name,
                        "path": str(file_path),
                        "size_bytes": stat.st_size,
                        "upload_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    }
                )

        return files

    def validate_evidence_permission(self, evidence_upload_allowed: bool) -> None:
        """
        Validate that evidence upload is currently allowed.

        Args:
            evidence_upload_allowed: Whether upload is allowed

        Raises:
            ValueError: If upload is not allowed
        """
        if not evidence_upload_allowed:
            raise ValueError(
                "Evidence upload not currently allowed. "
                "The Judge must request evidence first."
            )
