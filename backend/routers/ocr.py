import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, BackgroundTasks, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from typing import Optional

from backend.database import get_db
from backend.models.case import ProcessingJob, JobType, JobStatus
from backend.models.user import User
from backend.services.ocr_service import run_ocr_pipeline
from backend.config import settings
from backend.utils.path_utils import get_user_claims_dir
from backend.utils.auth_utils import get_optional_user

router = APIRouter()


@router.post("/upload")
async def upload_pdf(
    file: UploadFile,
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Upload PDF and trigger OCR processing"""
    # Use authenticated user_id if available, otherwise use form user_id
    effective_user_id = current_user.id if current_user else user_id
    print(f"[UPLOAD] Received: {file.filename} (user: {effective_user_id})")

    # Validation
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files are allowed")

    # Check file size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, f"File too large (max {settings.MAX_UPLOAD_SIZE_MB}MB)")

    # Generate job ID
    job_id = str(uuid.uuid4())

    # Save file
    user_dir = get_user_claims_dir(effective_user_id)
    print(f"[UPLOAD] Creating directory: {user_dir}")
    file_path = user_dir / f"{job_id}.pdf"

    print(f"[UPLOAD] Saving to: {file_path}")
    with open(file_path, "wb") as f:
        f.write(content)
    print(f"[UPLOAD] File saved successfully ({len(content)} bytes)")

    # Create job record
    job = ProcessingJob(
        job_id=job_id,
        job_type=JobType.OCR,
        status=JobStatus.PENDING,
        input_file_path=str(file_path)
    )
    db.add(job)
    db.commit()
    print(f"[UPLOAD] Job created: {job_id}")

    # Queue background task
    background_tasks.add_task(run_ocr_pipeline, job_id, str(file_path), effective_user_id)
    print(f"[UPLOAD] Background task queued for job: {job_id}")

    return {"job_id": job_id, "status": "pending", "message": "OCR job queued"}


@router.get("/status/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Poll job status"""
    job = db.query(ProcessingJob).filter_by(job_id=job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    response = {
        "job_id": job.job_id,
        "status": job.status.value,
        "created_at": job.created_at.isoformat(),
    }

    if job.status == JobStatus.COMPLETED:
        response["case_id"] = job.case_id
        response["completed_at"] = job.completed_at.isoformat()
    elif job.status == JobStatus.FAILED:
        response["error"] = job.error_message

    return response
