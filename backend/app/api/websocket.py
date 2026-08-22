from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

active_connections: list[WebSocket] = []


@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """Owned by Person B. Frontend connects here for live attendance/leave updates."""
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive ping from client
    except WebSocketDisconnect:
        active_connections.remove(websocket)


async def broadcast(message: dict):
    """Called from the LISTEN/NOTIFY callback in services/notify_listener.py"""
    for connection in active_connections:
        await connection.send_json(message)
