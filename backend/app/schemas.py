from pydantic import BaseModel

class TokenResponse(BaseModel):
    """Odgovor /login endpointa (token za klijenta)"""

    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None

# IZBACITI OVU KLASU KASNIJE
class TestResponse(BaseModel):
    """Odgovor zasticenog /test endpointa"""

    message: str
    email: str | None = None

class SensorData(BaseModel):
    temperature: float | None = None
    humidity: float | None = None
    groundHumidity: float | None = None

class SensorResponse(BaseModel):
    device_id: str
    data: SensorData

