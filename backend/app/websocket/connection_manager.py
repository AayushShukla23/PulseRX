from fastapi import WebSocket
from typing import Dict, List, Set
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Maps order_id -> Set of active WebSocket connections listening to that order
        self.active_order_connections: Dict[str, Set[WebSocket]] = {}
        # List of all operational dashboard active connections
        self.dashboard_connections: Set[WebSocket] = set()

    async def connect_order(self, websocket: WebSocket, order_id: str):
        await websocket.accept()
        if order_id not in self.active_order_connections:
            self.active_order_connections[order_id] = set()
        self.active_order_connections[order_id].add(websocket)
        logger.info(f"WebSocket client connected for order: {order_id}")

    def disconnect_order(self, websocket: WebSocket, order_id: str):
        if order_id in self.active_order_connections:
            self.active_order_connections[order_id].discard(websocket)
            if not self.active_order_connections[order_id]:
                del self.active_order_connections[order_id]

    async def connect_dashboard(self, websocket: WebSocket):
        await websocket.accept()
        self.dashboard_connections.add(websocket)

    def disconnect_dashboard(self, websocket: WebSocket):
        self.dashboard_connections.discard(websocket)

    async def broadcast_order_update(self, order_id: str, payload: dict):
        """Pushes state change payload to customer live tracker and ops dashboard."""
        message = json.dumps(payload)
        
        # 1. Send to customer order room
        if order_id in self.active_order_connections:
            disconnected = set()
            for ws in self.active_order_connections[order_id]:
                try:
                    await ws.send_text(message)
                except Exception:
                    disconnected.add(ws)
            for ws in disconnected:
                self.active_order_connections[order_id].discard(ws)

        # 2. Send to Ops Dashboard
        disconnected_dash = set()
        for ws in self.dashboard_connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected_dash.add(ws)
        for ws in disconnected_dash:
            self.dashboard_connections.discard(ws)


ws_manager = ConnectionManager()