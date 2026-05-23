"""
Klijent za ThingsBoard REST API
"""

import httpx
from fastapi import HTTPException, status
from app.config import settings

class ThingsBoardClient:
    """async Klijent za ThingsBoard auth endpointe"""

    def __init__(self, base_url: str, timeout: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def login(self, username: str, password: str) -> dict:
        """
        Salji credentials ThingsBoardu, vrati sirov JSON response.
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client: # otvaram http klijenta
            try:
                response = await client.post( # saljem POST na Thingsboard s json tijelom
                    f"{self.base_url}/api/auth/login",
                    json={"username": username, "password": password},
                )
            except httpx.RequestError as e: # ako mreza pukne
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Neocekivana greska: {e}",
                )

        if response.status_code != 200: # ako dobim odgovor, ali neocekivani
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Neispravni ThingsBoard login credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        #print(f"Login return: {response.json()}") # DEBUG

        return response.json() # ovo sadrzi i token i refresh token

    async def get_user(self, token: str) -> dict:
        """
        Dohvati info o trenutnom useru i usput provjeravam token.
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get( # slicno kao i prosla funkcija, ali saljem GET umjesto POST
                    f"{self.base_url}/api/auth/user",
                    headers={"X-Authorization": f"Bearer {token}"}, # X-Authorization je specificno za Thingsboard
                )
            except httpx.RequestError as e: # ako mreza pukne
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Neocekivana greska: {e}",
                )

        if response.status_code != 200: # ako dobim odg od Thingsboarda, ali token je neispravan
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Neispravan token!",
                headers={"WWW-Authenticate": "Bearer"},
            )

        #print(f"get_user return: {response.json()}") # DEBUG

        return response.json() # isto vraca dict s info o korisniku

tb_client = ThingsBoardClient(
    base_url=settings.thingsboard_url,
    timeout=settings.request_timeout,
)