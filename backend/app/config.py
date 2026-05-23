"""Konfiguracija aplikacije"""

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    thingsboard_url: str = "https://eu.thingsboard.cloud"
    thingsboard_username: str = ""  # iz .env
    thingsboard_password: str = ""  # iz .env
    request_timeout: float = 10.0

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
settings = Settings()