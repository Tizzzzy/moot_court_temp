from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# ===== Request Models =====


class CreateSessionRequest(BaseModel):
    """Request to create a new court session."""

    user_id: str
    case_id: int


class SendMessageRequest(BaseModel):
    """Request to send a plaintiff message."""

    message: str


class ContinueAfterObjectionRequest(BaseModel):
    """Request to continue after objection (with or without rephrase)."""

    use_original: bool  # True = use original, False = already rephrased
    message: Optional[str] = None  # Original or rephrased plaintiff statement


class EvidenceRequestModel(BaseModel):
    """Evidence request from Judge."""

    requesting_evidence: bool
    evidence_types: Optional[List[str]] = None
    urgency: Optional[str] = None  # 'required' | 'optional'


# ===== Response Models =====


class CourtroomResponse(BaseModel):
    """Response from a courtroom participant."""

    role: str  # Judge, Defendant, Plaintiff, Clerk
    dialogue: str
    inner_thought: Optional[str] = None
    evidence_request: Optional[EvidenceRequestModel] = None

    class Config:
        from_attributes = True


class ObjectionDecision(BaseModel):
    """Decision about whether a statement has a legal objection."""

    has_objection: bool
    objection_type: Optional[str] = None  # e.g., "Hearsay", "Speculation"
    legal_reasoning: Optional[str] = None
    suggested_rephrasing: Optional[str] = None
    severity: Optional[str] = None  # 'minor', 'moderate', 'severe'

    class Config:
        from_attributes = True


class PlaintiffFeedback(BaseModel):
    """Educational feedback for plaintiff statement."""

    positive: str
    improvements: List[str]

    class Config:
        from_attributes = True


class Message(BaseModel):
    """Message in conversation history."""

    role: str
    content: str
    turn: int


class SendMessageResponse(BaseModel):
    """Response after sending a plaintiff message."""

    status: str  # 'success', 'objection_raised', 'verdict'
    objection: Optional[ObjectionDecision] = None
    feedback: Optional[PlaintiffFeedback] = None
    message: Optional[str] = None  # Optional explanatory message
    ai_response: Optional[CourtroomResponse] = None  # AI response (Judge/Defendant)
    evidence_upload_allowed: Optional[bool] = None  # Whether evidence upload is now allowed
    verdict_outcome: Optional[str] = None  # 'win' or 'lose' when status is 'verdict'


class SessionStateResponse(BaseModel):
    """Current state of a court session."""

    session_id: str
    case_id: Optional[int] = None
    status: str  # 'active' or 'completed'
    current_speaker: str
    turn_number: int
    evidence_upload_allowed: bool
    history: List[Dict[str, Any]]
    submitted_evidence: List["EvidenceFileMetadata"] = []
    verdict_outcome: Optional[str] = None


class CreateSessionResponse(BaseModel):
    """Response after creating a session."""

    session_id: str
    opening_message: Dict[str, Any]


class EvidenceFileMetadata(BaseModel):
    """Metadata about an uploaded evidence file."""

    filename: str
    path: str
    size_bytes: int
    mime_type: str
    upload_time: datetime


class UploadEvidenceResponse(BaseModel):
    """Response after uploading evidence files."""

    uploaded_files: List[EvidenceFileMetadata]


class SessionTranscript(BaseModel):
    """Full trial transcript."""

    history: List[Dict[str, Any]]
    evidence_count: int


class PerformanceMetrics(BaseModel):
    """Performance metrics for the trial."""

    overall_score: float
    strengths: List[str]
    improvements: List[str]
    difficulty: str


class ErrorResponse(BaseModel):
    """Error response from API."""

    error: str
    message: str
    detail: Optional[str] = None


# ===== WebSocket Message Models =====


class WSConnectedMessage(BaseModel):
    """WebSocket: Connection established."""

    type: str = "connected"
    data: Dict[str, str]  # { session_id: string }


class WSResponseMessage(BaseModel):
    """WebSocket: Courtroom response received."""

    type: str = "response"
    data: CourtroomResponse


class WSNextSpeakerMessage(BaseModel):
    """WebSocket: Next speaker determined."""

    type: str = "next_speaker"
    data: Dict[str, str]  # { speaker: string }


class WSEvidenceRequestMessage(BaseModel):
    """WebSocket: Evidence request from Judge."""

    type: str = "evidence_request"
    data: Dict[str, Any]  # { requesting: bool, types: [] }


class WSErrorMessage(BaseModel):
    """WebSocket: Error occurred."""

    type: str = "error"
    data: Dict[str, str]  # { message: string }
