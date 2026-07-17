import json
from typing import List, Literal, Optional, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Rangkul Backend API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./rangkul.db"
    JWT_SECRET_KEY: str = "change-me-in-production"
    SESSION_COOKIE_NAME: str = "rangkul_session"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    SESSION_EXPIRE_HOURS: int = 8
    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    FRONTEND_URL: str = "http://localhost:3000"
    MAILER_BACKEND: Literal["console", "fake"] = "console"
    TRUSTED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    CSRF_ENABLED: bool = True

    SECRET_KEY: str = "dev-only-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"
    CELERY_TASK_ALWAYS_EAGER: bool = False
    CELERY_TASK_EAGER_PROPAGATES: bool = True
    S3_REGION: str = "ap-southeast-1"
    S3_PRESIGN_EXPIRY_SECONDS: int = 900
    LOCAL_STORAGE_PATH: str = "./storage"
    ENVIRONMENT: str = "development"

    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    CORS_ORIGIN_REGEX: Optional[str] = None
    REDIS_URL: str = "redis://redis:6379/0"
    S3_ENDPOINT_URL: str = "http://minio:9000"
    S3_BUCKET_CHECKPOINTS: str = "rangkul-checkpoints"
    S3_ACCESS_KEY_ID: str = "rangkul"
    S3_SECRET_ACCESS_KEY: str = "rangkul-dev-secret"
    HF_HOME: str = "/models/huggingface"
    HF_TOKEN: str = ""
    WHISPER_MODEL_ID: str = "openai/whisper-large-v3-turbo"
    WHISPER_MODEL_REVISION: str = "pinned-by-model-manifest"
    MOTIONBERT_REPO_ID: str = "walterzhu/MotionBERT"
    MOTIONBERT_REVISION: str = "pinned-by-model-manifest"
    MOTIONBERT_CHECKPOINT: str = "checkpoint/pretrain/MB_lite/latest_epoch.bin"
    MOTIONBERT_CONFIG: str = "configs/pretrain/MB_lite.yaml"
    FACE_LANDMARKER_MODEL_PATH: str = "/models/mediapipe/face_landmarker.task"
    POSE_LANDMARKER_MODEL_PATH: str = "/models/mediapipe/pose_landmarker_full.task"
    AI_DEVICE: str = "cpu"
    AI_EAGER_LOAD: bool = False
    AI_USE_FAKE_MODELS: bool = True
    AI_ANALYSIS_FPS: int = 15
    AI_MAX_AUDIO_SECONDS: int = 120
    AI_MAX_VIDEO_SECONDS: int = 120
    AI_MAX_INTERPOLATION_GAP_FRAMES: int = 5
    AI_MIN_VALID_POSE_RATIO: float = 0.70
    AI_MIN_VALID_FACE_RATIO: float = 0.70
    GROQ_API_KEY: str = ""
    GROQ_REPORT_MODEL: str = "qwen/qwen3.6-27b"
    GROQ_REPORT_FALLBACK_MODEL: str = "openai/gpt-oss-120b"
    GROQ_SAFETY_MODEL: str = "openai/gpt-oss-safeguard-20b"
    GROQ_TIMEOUT_SECONDS: int = 30
    CHECKPOINT_DEFAULT_RETENTION_MODE: str = "privacy_first"
    CHECKPOINT_RAW_RETENTION_DAYS: int = 30
    CHECKPOINT_MAX_PHOTO_MB: int = 10
    CHECKPOINT_MAX_AUDIO_MB: int = 25
    CHECKPOINT_MAX_VIDEO_MB: int = 100

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

    @field_validator("TRUSTED_ORIGINS", mode="before")
    @classmethod
    def assemble_trusted_origins(cls, v: Union[str, List[str]]) -> List[str]:
        return cls.assemble_cors_origins(v)

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v):
        if isinstance(v, str):
            lowered = v.strip().lower()
            if lowered in {"1", "true", "yes", "on", "debug", "development"}:
                return True
            if lowered in {"0", "false", "no", "off", "release", "production"}:
                return False
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
