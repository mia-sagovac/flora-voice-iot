"""Konfiguracija aplikacije"""

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    thingsboard_url: str = "https://eu.thingsboard.cloud" # default, promijeniti na onaj iz maila pomocu env
    request_timeout: float = 10.0

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

settings = Settings()