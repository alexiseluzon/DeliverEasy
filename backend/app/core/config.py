import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

# Tests set ENV_FILE=.env.test before importing the app (see tests/conftest.py)
# so pytest never reads production credentials from .env.
_ENV_FILE = os.getenv("ENV_FILE", ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    database_url: str
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""

    allowed_origins: str = "http://localhost:3000"
    env: str = "development"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()