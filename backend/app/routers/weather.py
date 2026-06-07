"""Weather router - proxy prema Open-Meteo (bez API kljuca)."""

import httpx
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import oauth2_scheme

router = APIRouter(prefix="/weather", tags=["weather"])

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

@router.get("")
async def get_weather(lat: float, lon: float, token: str = Depends(oauth2_scheme)):
    """Trenutno vrijeme + 5-dnevna prognoza za zadane koordinate."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "timezone": "auto",
        "forecast_days": 5,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(OPEN_METEO_URL, params=params)
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"greska prema weather servisu: {e}")
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="weather servis nije vratio podatke")

    data = response.json()
    current = data.get("current", {})
    daily = data.get("daily", {})

    days = []
    times = daily.get("time", [])
    for i in range(len(times)):
        days.append({
            "date": times[i],
            "weatherCode": daily.get("weather_code", [None] * len(times))[i],
            "tempMax": daily.get("temperature_2m_max", [None] * len(times))[i],
            "tempMin": daily.get("temperature_2m_min", [None] * len(times))[i],
            "rainChance": daily.get("precipitation_probability_max", [None] * len(times))[i],
        })

    return {
        "current": {
            "temperature": current.get("temperature_2m"),
            "humidity": current.get("relative_humidity_2m"),
            "precipitation": current.get("precipitation"),
            "weatherCode": current.get("weather_code"),
            "windSpeed": current.get("wind_speed_10m"),
        },
        "daily": days,
    }
