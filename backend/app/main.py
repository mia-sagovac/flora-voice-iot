"""
FastAPI app

Pokretanje:
fastapi dev app/main.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import test
from app.routers import auth

app = FastAPI(
    title="FastAPI + ThingsBoard",
    description="Demo: autentikacija preko ThingsBoarda + zaštićeni endpoint",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registriraj routere
app.include_router(auth.router)
app.include_router(test.router)


@app.get("/", tags=["meta"])
def root():
    """Sanity check — pokazuje koji ThingsBoard URL app trenutno koristi."""
    return {
        "message": "FastAPI + ThingsBoard demo",
        "docs": "/docs",
        "thingsboard_url": settings.thingsboard_url,
    }
