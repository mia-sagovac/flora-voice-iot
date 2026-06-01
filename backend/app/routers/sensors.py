
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import oauth2_scheme
from app.schemas import SensorResponse, SensorData
from app.thingsboard import tb_client

router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.get("/{device_id}/telemetry", response_model=SensorResponse)
async def get_sensor_data(device_id: str, token: str = Depends(oauth2_scheme)):

    keys = "temperature,humidity,groundHumidity"

    raw_data = await tb_client.get_sensor_data(token, device_id, keys)
    # {"temperature": [{"value": "24.5", "ts": 1600000}], "humidity": [{"value": "45", "ts": 1600000}]}

    temp = None
    hum = None
    grHum = None

    if "temperature" in raw_data and len(raw_data["temperature"]) > 0:
        temp = float(raw_data["temperature"][0]["value"])

    if "humidity" in raw_data and len(raw_data["humidity"]) > 0:
        hum = float(raw_data["humidity"][0]["value"])

    if "groundHumidity" in raw_data and len(raw_data["groundHumidity"]) > 0:
        grHum = float(raw_data["groundHumidity"][0]["value"])

    return SensorResponse(
        device_id=device_id,
        data=SensorData(temperature=temp, humidity=hum, groundHumidity=grHum)
    )