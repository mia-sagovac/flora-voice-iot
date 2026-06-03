from fastapi import WebSocket

class ConnectionManager:
    """Rutira telemetriju po deviceId. Svaki socket je pretplacen samo
    na uredjaje koje njegov korisnik smije vidjeti."""
 
    def __init__(self):
        self.subscribers: dict[str, set[WebSocket]] = {} # deviceId -> socketi
        self.name_to_id: dict[str, str] = {} # deviceName -> deviceId
 
    def connect(self, websocket: WebSocket, devices: list[dict]):
        # devices je lista iz get_customer_devices oblika [{id: {id: <uuid>}, name: ...}]
        for d in devices:
            dev_id = d["id"]["id"]
            self.name_to_id[d["name"]] = dev_id
            self.subscribers.setdefault(dev_id, set()).add(websocket)
 
    def disconnect(self, websocket: WebSocket):
        for subs in self.subscribers.values():
            subs.discard(websocket)
 
    def resolve(self, device_name: str) -> str | None:
        """deviceName (sto ThingsBoard salje) -> deviceId (po cemu se rutira)."""
        return self.name_to_id.get(device_name)
 
    async def send_to_device_id(self, device_id: str, message: dict):
        dead = []
        for ws in list(self.subscribers.get(device_id, set())):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()
