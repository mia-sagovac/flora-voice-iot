from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect
from app.dependencies import oauth2_scheme
from app.schemas import SensorResponse, SensorData
from app.thingsboard import tb_client

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Šalje podatke svim spojenim frontend klijentima u stvarnom vremenu"""
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()