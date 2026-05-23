"""Pydantic modeli (request/response sheme)"""

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