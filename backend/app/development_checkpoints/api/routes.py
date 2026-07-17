from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, File, Header, Query, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import require_trusted_origin
from app.db import get_db
from app.development_checkpoints.api.schemas import (
    AssetCompleteRequest,
    CheckpointCreate,
    CheckpointHistoryItemOut,
    CheckpointOut,
    CheckpointResultOut,
    CheckpointTemplateOut,
    GeneratedReportOut,
    PresignRequest,
    PresignResponse,
    ReviewCreate,
)
from app.development_checkpoints.application.service import checkpoint_service
from app.models import User
from app.modules.identity.service import get_current_user as get_session_user

router = APIRouter()


def current_user(
    session_token: Annotated[str | None, Cookie(alias=settings.SESSION_COOKIE_NAME)] = None,
    db: Session = Depends(get_db),
) -> User:
    return get_session_user(db, session_token)


@router.get("/checkpoint-templates", response_model=list[CheckpointTemplateOut])
def list_checkpoint_templates(db: Session = Depends(get_db)) -> list[CheckpointTemplateOut]:
    return checkpoint_service.list_templates(db)


@router.post("/people/{person_id}/checkpoints", response_model=CheckpointOut, status_code=status.HTTP_201_CREATED)
def create_checkpoint(
    person_id: str,
    payload: CheckpointCreate,
    request: Request,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> CheckpointOut:
    require_trusted_origin(request)
    return checkpoint_service.create_checkpoint(db, person_id, payload, user)


@router.get("/people/{person_id}/checkpoints", response_model=list[CheckpointHistoryItemOut])
def list_checkpoints(
    person_id: str,
    capture_mode: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[CheckpointHistoryItemOut]:
    return checkpoint_service.list_checkpoints(db, person_id, user, capture_mode=capture_mode, limit=limit)


@router.post("/checkpoints/{checkpoint_id}/assets/presign", response_model=PresignResponse)
def presign_asset(
    checkpoint_id: str,
    payload: PresignRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> PresignResponse:
    require_trusted_origin(request)
    return checkpoint_service.presign_asset(db, checkpoint_id, payload, user)


@router.post("/checkpoints/{checkpoint_id}/assets/complete", response_model=CheckpointOut)
def complete_asset(
    checkpoint_id: str,
    payload: AssetCompleteRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> CheckpointOut:
    require_trusted_origin(request)
    return checkpoint_service.complete_asset(db, checkpoint_id, payload, user)


@router.put("/storage/local-upload/{object_key:path}")
def local_upload(object_key: str, file: UploadFile = File(...)) -> dict[str, str]:
    return checkpoint_service.local_upload(object_key, file)


@router.post("/checkpoints/{checkpoint_id}/submit", response_model=CheckpointOut)
def submit_checkpoint(
    checkpoint_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> CheckpointOut:
    require_trusted_origin(request)
    return checkpoint_service.submit(db, checkpoint_id, user)


@router.get("/checkpoints/{checkpoint_id}/status", response_model=CheckpointOut)
@router.get("/checkpoints/{checkpoint_id}", response_model=CheckpointOut)
def get_checkpoint(
    checkpoint_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> CheckpointOut:
    return checkpoint_service.get_checkpoint(db, checkpoint_id, user)


@router.get("/checkpoints/{checkpoint_id}/results", response_model=CheckpointResultOut)
def get_results(
    checkpoint_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> CheckpointResultOut:
    return checkpoint_service.get_results(db, checkpoint_id, user)


@router.get("/checkpoints/{checkpoint_id}/report", response_model=GeneratedReportOut)
def get_report(
    checkpoint_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> GeneratedReportOut:
    return checkpoint_service.get_report(db, checkpoint_id, user)


@router.get("/checkpoints/{checkpoint_id}/assets/{asset_id}/download")
def download_asset(
    checkpoint_id: str,
    asset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, str]:
    return checkpoint_service.download_asset(db, checkpoint_id, asset_id, user)


@router.post("/checkpoints/{checkpoint_id}/reviews", response_model=CheckpointOut)
@router.post("/checkpoints/{checkpoint_id}/approve", response_model=CheckpointOut)
def review_checkpoint(
    checkpoint_id: str,
    request: Request,
    payload: ReviewCreate = ReviewCreate(decision="approved"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> CheckpointOut:
    require_trusted_origin(request)
    return checkpoint_service.review(db, checkpoint_id, payload, user)
