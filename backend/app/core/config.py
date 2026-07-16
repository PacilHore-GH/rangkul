import json
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    APP_NAME: str = "Rangkul Backend API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    DATABASE_URL: str = "sqlite:///./rangkul.db"
    JWT_SECRET_KEY: str = "change-me-in-production"
    SESSION_COOKIE_NAME: str = "rangkul_session"
    COOKIE_SECURE: bool = False
    SESSION_EXPIRE_HOURS: int = 8
    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    
    # CORS Origins can be a JSON string like '["http://localhost:3000"]' or a comma-separated list
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    # Optional regular expression for trusted dynamic origins, such as Vercel previews.
    CORS_ORIGIN_REGEX: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
