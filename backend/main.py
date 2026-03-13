from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from sqlalchemy import text

# Configure logging to show INFO level
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from backend.routers import ocr, cases, court_simulator, evidence, case_data, auth, dashboard
from backend.database import engine, Base
from backend.config import settings
from backend.utils.path_utils import validate_path_config
from backend.models import user as user_model  # Ensure users table is created
from backend.models import verification_token as verification_token_model  # Ensure verification_tokens table is created
from backend.models import case as case_model  # Ensure all case/evidence tables are created


def _ensure_evidence_file_path_nullable() -> None:
    """Backfill schema compatibility for SQLite databases created before nullable file_path."""
    if "sqlite" not in settings.DATABASE_URL:
        return

    try:
        with engine.begin() as conn:
            table_rows = conn.execute(text("PRAGMA table_info(evidence_files)")).mappings().all()
            if not table_rows:
                return

            file_path_row = next((row for row in table_rows if row.get("name") == "file_path"), None)
            if file_path_row is None or int(file_path_row.get("notnull", 0)) == 0:
                return

            print("[STARTUP] Migrating evidence_files.file_path to nullable")
            conn.exec_driver_sql("PRAGMA foreign_keys=OFF")
            conn.exec_driver_sql(
                """
                CREATE TABLE evidence_files_new (
                    id INTEGER PRIMARY KEY,
                    evidence_item_id INTEGER NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    file_path TEXT,
                    feedback TEXT,
                    is_ready BOOLEAN,
                    mime_type VARCHAR(100),
                    size_bytes INTEGER,
                    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(evidence_item_id) REFERENCES evidence_items (id)
                )
                """
            )
            conn.exec_driver_sql(
                """
                INSERT INTO evidence_files_new (
                    id, evidence_item_id, filename, file_path, feedback, is_ready, mime_type, size_bytes, uploaded_at
                )
                SELECT
                    id, evidence_item_id, filename, file_path, feedback, is_ready, mime_type, size_bytes, uploaded_at
                FROM evidence_files
                """
            )
            conn.exec_driver_sql("DROP TABLE evidence_files")
            conn.exec_driver_sql("ALTER TABLE evidence_files_new RENAME TO evidence_files")
            conn.exec_driver_sql("PRAGMA foreign_keys=ON")
            print("[STARTUP] Schema migration complete")
    except Exception as exc:
        logger.exception("Failed to migrate evidence_files.file_path schema: %s", exc)
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate path configuration on startup
    print("[STARTUP] Validating path configuration...")
    config = validate_path_config()
    print(f"[STARTUP] Data directory: {config['base_data_dir']}")
    print(f"[STARTUP] Project root: {config['project_root']}")
    if config['is_default']:
        print("[STARTUP] Using default data directory")
    else:
        print("[STARTUP] Using custom data directory from BASE_DATA_DIR")

    # Create tables on startup
    print("[STARTUP] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    _ensure_evidence_file_path_nullable()
    print("[STARTUP] Database tables created")
    yield
    print("[SHUTDOWN] Closing database connection...")


app = FastAPI(
    title="Moot Court API - Stage 1",
    version="1.0.0",
    lifespan=lifespan
)


# Global exception handler to ensure CORS headers are included in error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check backend logs."},
    )


# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://3.135.62.13:3000",
        "http://3.135.62.13:5173",
        "http://3.135.62.13",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR"])
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])
app.include_router(court_simulator.router, prefix="/api/court", tags=["Court Simulator"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["Evidence"])
app.include_router(case_data.router, prefix="/api/case-data", tags=["Case Data"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
