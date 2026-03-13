import os
import sys
import json
from datetime import datetime, date
from pathlib import Path
from sqlalchemy.orm import Session

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.models.case import ProcessingJob, Case, Party, JobStatus
from backend.config import settings


def parse_date(date_string):
    """Convert date string to date object"""
    if not date_string:
        return None
    if isinstance(date_string, date):
        return date_string
    try:
        # Try ISO format first (YYYY-MM-DD)
        return datetime.strptime(date_string, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def run_ocr_pipeline(job_id: str, file_path: str, user_id: str):
    """Background task to run OCR pipeline"""
    from backend.database import SessionLocal

    db = SessionLocal()

    try:
        job = db.query(ProcessingJob).filter_by(job_id=job_id).first()
        job.status = JobStatus.PROCESSING
        db.commit()

        # Step 1: Gemini API Extraction (direct PDF processing)
        print(f"[OCR] Processing PDF with Gemini: {file_path}")

        from ocr.info_extract import info_extract

        extracted_data = info_extract(file_path)
        print(f"[OCR] Extraction complete: {extracted_data}")

        # Step 3: Save to database
        case = Case(
            user_id=user_id,
            case_number=extracted_data.get("case_number"),
            case_type=extracted_data["case_type"],
            state=extracted_data["state"],
            county=extracted_data["county"],
            filing_date=parse_date(extracted_data.get("filing_date")),
            claim_summary=extracted_data["claim_summary"],
            amount_sought=extracted_data.get("amount_sought"),
            incident_date=parse_date(extracted_data.get("incident_date")),
            demand_letter_sent=extracted_data.get("demand_letter_sent", False),
            agreement_included=extracted_data.get("agreement_included", False),
            status="draft"
        )
        db.add(case)
        db.flush()

        # Add parties
        for p in extracted_data.get("plaintiffs", []):
            party = Party(case_id=case.id, role="plaintiff", name=p["name"], address=p.get("address"))
            db.add(party)

        for d in extracted_data.get("defendants", []):
            party = Party(case_id=case.id, role="defendant", name=d["name"], address=d.get("address"))
            db.add(party)

        db.commit()

        # Update job
        job.status = JobStatus.COMPLETED
        job.case_id = case.id
        job.output_data = json.dumps(extracted_data, default=str)
        job.completed_at = datetime.utcnow()
        db.commit()

        print(f"[OCR] Job {job_id} completed successfully")

    except Exception as e:
        print(f"[OCR] Error in job {job_id}: {str(e)}")
        job.status = JobStatus.FAILED
        job.error_message = str(e)
        db.commit()
    finally:
        db.close()
