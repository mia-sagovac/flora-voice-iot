from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect, HTTPException
from app.dependencies import oauth2_scheme
from app.schemas import SensorResponse, SensorData
from app.thingsboard import tb_client
from app.connectionmanager import manager

router = APIRouter(prefix="/sensors", tags=["sensors"])

@router.get("/{device_id}/telemetry", response_model=SensorResponse)
async def get_sensor_data(device_id: str, token: str = Depends(oauth2_scheme)):
    keys = "temperature,humidity,groundHumidity"
    raw = await tb_client.get_sensor_data(token, device_id, keys) # TB enforca pristup
 
    def first(key):
        vals = raw.get(key)
        return float(vals[0]["value"]) if vals else None
 
    return SensorResponse(
        device_id=device_id,
        data=SensorData(
            temperature=first("temperature"),
            humidity=first("humidity"),
            groundHumidity=first("groundHumidity"),
        ),
    )

@router.post("/webhook/telemetry")
async def receive_telemetry_webhook(request: Request, device: str = "unknown"):
    payload = await request.json()
    device_id = manager.resolve(device) # ime -> id
    print(f"STIGLO za '{device}' (id={device_id}): {payload}")
    if device_id: # rutiraj po id-u samo onima koji taj uredjaj smiju vidjeti
        await manager.send_to_device_id(
            device_id, {"device_id": device_id, "device": device, "data": payload}
        )
    return {"status": "success"}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    token = await websocket.receive_text() # prva poruka je token
 
    try:
        user = await tb_client.get_user(token) # validira token
        customer_id = user["customerId"]["id"] # iz tokena dobim customer_id
        devices = await tb_client.get_customer_devices(token, customer_id)
    except (HTTPException, KeyError, TypeError):
        await websocket.close(code=1008) # nevazeci token
        return
 
    manager.connect(websocket, devices)
    print(f"Frontend spojen, gleda uredjaje: {[d['name'] for d in devices]}")
    try:
        while True:
            await websocket.receive_text() # drzi vezu otvorenom
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Frontend se odspojio.")


@router.get("/devices")
async def list_my_devices(token: str = Depends(oauth2_scheme)):
    user = await tb_client.get_user(token)
    customer_id = user.get("customerId", {}).get("id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="korisnik nije customer user")
    devices = await tb_client.get_customer_devices(token, customer_id)
    return {
        "customer_id": customer_id,
        "devices": [{"id": d["id"]["id"], "name": d["name"]} for d in devices],
    }

@router.post("/{device_id}/pump")
async def trigger_pump(device_id: str, token: str = Depends(oauth2_scheme)):
    # isto kao i CURL koji smo koristili dok smo koristili dok smo sve ovo testirali (oni u terminalu)
    await tb_client.set_device_attributes(token, device_id, {"triggerWatering": True})
    return {"status": "ok", "device_id": device_id}
