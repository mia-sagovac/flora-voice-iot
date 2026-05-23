"""Test router — primjer zaštićenog endpointa."""

# MAKNUTI OVAJ FILE KASNIJE

from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.schemas import TestResponse

router = APIRouter(tags=["test"])

@router.get("/test", response_model=TestResponse)
async def test_endpoint(user: dict = Depends(get_current_user)):
    """
    Zasticeni vraca 200 samo s valjanim ThingsBoard tokenom.
    """
    return TestResponse(
        message="Uspjesno autenticiran preko ThingsBoarda!",
        email=user.get("email"),
        authority=user.get("authority"),
    )