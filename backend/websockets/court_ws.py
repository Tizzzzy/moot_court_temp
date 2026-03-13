import json
from typing import Dict, List, Callable, Any
from fastapi import WebSocket, WebSocketDisconnect
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages WebSocket connections for court simulator sessions.
    Maps session_id to connected WebSocket clients.
    """

    def __init__(self):
        # session_id -> list of connected clients
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Message handlers
        self.message_handlers: Dict[str, List[Callable]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        """
        Accept and register a WebSocket connection.
        """
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        logger.info(f"WebSocket connected: session={session_id}")

    async def disconnect(self, session_id: str, websocket: WebSocket):
        """
        Unregister and close a WebSocket connection.
        """
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        logger.info(f"WebSocket disconnected: session={session_id}")

    async def broadcast(self, session_id: str, message: Dict[str, Any]):
        """
        Send a message to all connected clients for a session.
        """
        if session_id not in self.active_connections:
            return

        message_json = json.dumps(message)
        disconnected = []

        for connection in self.active_connections[session_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending message: {e}")
                disconnected.append(connection)

        # Clean up dead connections
        for connection in disconnected:
            await self.disconnect(session_id, connection)

    async def send_response(self, session_id: str, role: str, dialogue: str, **kwargs):
        """
        Send a courtroom response via WebSocket.
        """
        message = {
            "type": "response",
            "data": {
                "role": role,
                "dialogue": dialogue,
                **kwargs,
            },
        }
        await self.broadcast(session_id, message)

    async def send_next_speaker(self, session_id: str, speaker: str, verdict_outcome: str = None):
        """
        Notify clients of the next speaker.
        """
        data: Dict[str, Any] = {"speaker": speaker}
        if verdict_outcome is not None:
            data["verdict_outcome"] = verdict_outcome
        message = {
            "type": "next_speaker",
            "data": data,
        }
        await self.broadcast(session_id, message)

    async def send_evidence_request(self, session_id: str, requesting: bool, types: List[str] = None):
        """
        Notify clients of an evidence request.
        """
        message = {
            "type": "evidence_request",
            "data": {
                "requesting": requesting,
                "types": types or [],
            },
        }
        await self.broadcast(session_id, message)

    async def send_error(self, session_id: str, error_message: str):
        """
        Send an error notification via WebSocket.
        """
        message = {
            "type": "error",
            "data": {"message": error_message},
        }
        await self.broadcast(session_id, message)

    async def send_feedback(self, session_id: str, positive: str, improvements: List[str]):
        """
        Send plaintiff feedback via WebSocket.
        """
        message = {
            "type": "feedback",
            "data": {
                "positive": positive,
                "improvements": improvements,
            },
        }
        await self.broadcast(session_id, message)

    def get_connected_count(self, session_id: str) -> int:
        """
        Get number of connected clients for a session.
        """
        return len(self.active_connections.get(session_id, []))


# Global instance
ws_manager = WebSocketManager()
