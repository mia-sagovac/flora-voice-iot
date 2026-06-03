"""Konfiguracija aplikacije"""

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    thingsboard_url: str = "http://161.53.133.253:8080"
    thingsboard_username: str = "" # iz .env, ali vjerojatno nam nece trebat, vidjet cemo
    thingsboard_password: str = "" # iz .env
    request_timeout: float = 10.0

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
settings = Settings()
