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
