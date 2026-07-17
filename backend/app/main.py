import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.router import api_router
from app.core.config import settings
from app.db import Base, SessionLocal, engine
from app.development_checkpoints.application.service import seed_checkpoint_templates

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API services for Rangkul workspace application.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup() -> None:
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_checkpoint_templates(session)


@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/docs")


logger.info("Initialized application %s in debug=%s mode.", settings.APP_NAME, settings.DEBUG)
