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
        Salji credentials ThingsBoardu, vrati JSON response.
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

    async def get_sensor_data(self, token: str, device_id: str, keys: str) -> dict:

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/values/timeseries",
                    params={"keys": keys},
                    headers={"X-Authorization": f"Bearer {token}"},
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"error fetching sensor data: {e}",
                )

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"error fetching thingsboard data: {response.status_code}",
            )

        return response.json()

    async def get_customer_devices(self, token: str, customer_id: str) -> list[dict]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/api/customer/{customer_id}/devices",
                params={"pageSize": 1000, "page": 0},
                headers={"X-Authorization": f"Bearer {token}"},
            )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="ne mogu dohvatiti uređaje")
        return response.json()["data"]

    async def set_device_attributes(self, token: str, device_id: str, attributes: dict) -> None:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/attributes/SERVER_SCOPE",
                    json=attributes,
                    headers={"X-Authorization": f"Bearer {token}"},
                )
            except httpx.RequestError as e:
                raise HTTPException(status_code=503, detail=f"greska prema thingsboardu: {e}")
        if response.status_code != 200:
            # 403 = korisnik nema pravo na taj uredjaj
            raise HTTPException(status_code=response.status_code, detail="ne mogu poslati naredbu pumpi")

    """
    async def get_server_attributes(self, token: str, device_id: str, keys: str | None = None) -> dict:
        params = {}
        if keys:
            params["keys"] = keys
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/values/attributes/SERVER_SCOPE",
                    params=params,
                    headers={"X-Authorization": f"Bearer {token}"},
                )
            except httpx.RequestError as e:
                raise HTTPException(status_code=503, detail=f"greska: {e}")
        if response.status_code != 200:
            return {}
        out = {}
        for item in response.json():  # oblik [{"key": "latitude", "value": "45.80", "lastUpdateTs": ...}]
            out[item["key"]] = item.get("value")
        return out
    """

    async def get_timeseries_keys(self, token: str, device_id: str) -> list[str]:
        """Dobivam koje telemetrijske kljuceve uredjaj uopce ima."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/keys/timeseries",
                    headers={"X-Authorization": f"Bearer {token}"},
                )
            except httpx.RequestError as e:
                raise HTTPException(status_code=503, detail=f"greska: {e}")
        return response.json() if response.status_code == 200 else []

    async def get_latest_telemetry(self, token: str, device_id: str, keys: str) -> dict:
        """Dobivam zadnje vrijednost po kljucu, splosteno u {kljuc: vrijednost}."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/values/timeseries",
                    params={"keys": keys},
                    headers={"X-Authorization": f"Bearer {token}"},
                )
            except httpx.RequestError as e:
                raise HTTPException(status_code=503, detail=f"greska: {e}")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="ne mogu dohvatiti telemetriju")

        raw = response.json() # ovo je oblik koji se dobi {"temperature": [{"ts": 1700000, "value": "24.5"}], ...}
        out = {}
        for key, parts in raw.items():
            if parts:
                v = parts[0]["value"]
                try:
                    v = float(v)
                except (TypeError, ValueError):
                    pass
                out[key] = v
        return out

    async def get_timeseries_history(
            self,
            token: str,
            device_id: str,
            keys: str,
            start_ts: int,
            end_ts: int,
            limit: int = 5000,
            order_by: str = "ASC",
    ) -> dict:
        """Povijesna telemetrija u vremenskom prozoru. Vraca sirov TB oblik {kljuc: [{"ts": .., "value": ..}, ..]}."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/values/timeseries",
                    params={
                        "keys": keys,
                        "startTs": start_ts,
                        "endTs": end_ts,
                        "limit": limit,
                        "orderBy": order_by,
                        "agg": "NONE",
                    },
                    headers={"X-Authorization": f"Bearer {token}"},
                )
            except httpx.RequestError as e:
                raise HTTPException(status_code=503, detail=f"greska: {e}")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="ne mogu dohvatiti povijest telemetrije")
        return response.json()

tb_client = ThingsBoardClient(
    base_url=settings.thingsboard_url,
    timeout=settings.request_timeout,
)
