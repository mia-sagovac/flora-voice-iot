"""Ruter za autentikaciju"""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas import TokenResponse
from app.thingsboard import tb_client

router = APIRouter(tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Autenticiraj se s ThingsBoard credentialsima i vrati token.
    """
    data = await tb_client.login(form_data.username, form_data.password) # koristim tb_client login funkciju

    return TokenResponse( # vracam tokene
        access_token=data["token"],
        refresh_token=data.get("refreshToken"),
    )