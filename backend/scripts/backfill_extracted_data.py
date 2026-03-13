#!/usr/bin/env python3
"""
Backfill script to create extracted_data.json from database for existing users.
This handles users who uploaded PDFs before the JSON file writing fix was implemented.
"""

import json
import sys
from pathlib import Path
from datetime import date

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.database import SessionLocal
from backend.models.case import Case, Party
from backend.config import settings
from backend.utils.path_utils import get_user_ocr_output_dir


def backfill_user_data(user_id: str) -> bool:
    """Create extracted_data.json from database for existing user"""
    db = SessionLocal()

    try:
        # Find case in database
        case = db.query(Case).filter_by(user_id=user_id).first()
        if not case:
            print(f"[FAIL] No case found for user {user_id}")
            return False

        # Get parties
        plaintiffs = [
            {"name": p.name, "address": p.address}
            for p in db.query(Party).filter_by(case_id=case.id, role="plaintiff").all()
        ]
        defendants = [
            {"name": d.name, "address": d.address}
            for d in db.query(Party).filter_by(case_id=case.id, role="defendant").all()
        ]

        # Format output (matching OCR service output format)
        output_data = {
            "case_number": case.case_number,
            "case_type": case.case_type,
            "state": case.state,
            "county": case.county,
            "filing_date": case.filing_date.isoformat() if case.filing_date else None,
            "hearing_date": None,  # Not stored in current schema
            "plaintiffs": plaintiffs,
            "defendants": defendants,
            "claim_summary": case.claim_summary,
            "amount_sought": case.amount_sought,
            "incident_date": case.incident_date.isoformat() if case.incident_date else None,
            "demand_letter_sent": case.demand_letter_sent,
            "agreement_included": case.agreement_included
        }

        # Write file
        ocr_output_dir = get_user_ocr_output_dir(user_id)
        json_output_path = ocr_output_dir / "extracted_data.json"

        with open(json_output_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=4, default=str)

        print(f"[OK] Created: {json_output_path}")
        db.close()
        return True

    except Exception as e:
        print(f"[FAIL] Error backfilling user {user_id}: {str(e)}")
        db.close()
        return False


def backfill_all_users() -> None:
    """Backfill all users in the database"""
    db = SessionLocal()

    try:
        # Get all unique user IDs
        user_ids = set(case.user_id for case in db.query(Case.user_id).all())

        if not user_ids:
            print("[WARN] No users found in database")
            return

        print(f"\n[INFO] Backfilling {len(user_ids)} users...\n")

        success_count = 0
        for user_id in sorted(user_ids):
            if backfill_user_data(user_id):
                success_count += 1

        print(f"\n[OK] Backfill complete: {success_count}/{len(user_ids)} users processed")

    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Backfill specific user
        user_id = sys.argv[1]
        print(f"\n[INFO] Backfilling user: {user_id}\n")
        backfill_user_data(user_id)
    else:
        # Backfill all users
        backfill_all_users()
