from backend.database import SessionLocal
from backend.models.case import EvidenceFile, EvidenceItem, EvidenceStatus
from sqlalchemy.exc import ProgrammingError


def repair_evidence_status() -> None:
    db = SessionLocal()
    try:
        try:
            items = db.query(EvidenceItem).all()
        except ProgrammingError as exc:
            print("[REPAIR] Skipped. Evidence tables are not available in current DATABASE_URL.")
            print(f"[REPAIR] Details: {exc}")
            db.rollback()
            return
        updated = 0

        for item in items:
            ready_count = (
                db.query(EvidenceFile)
                .filter_by(evidence_item_id=item.id, is_ready=True)
                .count()
            )
            expected = EvidenceStatus.READY if ready_count > 0 else EvidenceStatus.NOT_READY
            if item.status != expected:
                print(
                    f"[REPAIR] case_id={item.case_id} evidence={item.evidence_name} {item.status} -> {expected}"
                )
                item.status = expected
                updated += 1

        db.commit()
        print(f"[REPAIR] Completed. Updated {updated} evidence item(s).")
    finally:
        db.close()


if __name__ == "__main__":
    repair_evidence_status()
