from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
def get_health_status() -> Dict[str, Any]:
    """
    Check API service health status.
    """
    return {
        "status": "healthy",
        "service": "Rangkul FastAPI Backend",
        "database": "disconnected (not configured)",
        "version": "1.0.0"
    }
