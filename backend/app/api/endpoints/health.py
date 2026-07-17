from typing import Any, Dict

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db import engine

router = APIRouter()


@router.get("", response_model=Dict[str, Any])
def get_health_status() -> Dict[str, Any]:
    database_status = "unknown"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "unavailable"
    return {
        "status": "healthy",
        "service": "Rangkul FastAPI Backend",
        "database": database_status,
        "queue": "configured",
        "ai_runtime": {
            "fake_models": settings.AI_USE_FAKE_MODELS,
            "whisper": "openai/whisper-large-v3-turbo",
            "motionbert": "walterzhu/MotionBERT",
            "mediapipe_face": "configured model asset path",
            "mediapipe_pose": "configured model asset path",
        },
        "version": "1.0.0",
    }
