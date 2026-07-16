from fastapi import APIRouter
from app.api.endpoints import facilities, facility_admin, health, items

api_router = APIRouter()

# Include endpoint routes
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(facilities.router, prefix="/facilities", tags=["facilities"])
api_router.include_router(
    facility_admin.router,
    prefix="/admin/facilities",
    tags=["facility-admin"],
)
