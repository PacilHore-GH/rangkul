from fastapi import APIRouter
from app.api.endpoints import health
from app.modules.identity import router as identity_router
from app.modules.people import router as people_router

api_router = APIRouter()

# Include endpoint routes
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(identity_router.router, prefix="/auth", tags=["identity"])
api_router.include_router(people_router.router, prefix="/people", tags=["people"])
