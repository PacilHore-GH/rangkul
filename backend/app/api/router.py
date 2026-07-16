from fastapi import APIRouter
from app.api.endpoints import health, items

api_router = APIRouter()

# Include endpoint routes
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
