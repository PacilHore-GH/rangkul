from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
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
from app.development_checkpoints.domain.enums import ProcessingStatus
from app.development_checkpoints.infrastructure.queue.tasks import process_submission
from app.development_checkpoints.infrastructure.storage import object_storage
from app.models import (
    CheckpointAnalysisJob,
    CheckpointAsset,
    CheckpointEventSegment,
    CheckpointFaceResult,
    CheckpointMotionEmbedding,
    CheckpointPoseSequence,
    CheckpointReferenceComparison,
    CheckpointReport,
    CheckpointSpeechResult,
    CheckpointTemplate,
    CheckpointTrendSnapshot,
    ConsentSnapshot,
    DevelopmentCheckpoint,
    OutboxEvent,
    PersonProfile,
    PersonRelationship,
    User,
)

DEFAULT_TEMPLATES = [
    ("repeat_phrase", "Repeat Phrase", "voice", "Ulangi frasa yang diberikan oleh profesional."),
    ("open_mouth_then_smile", "Open Mouth Then Smile", "face", "Buka mulut lalu tersenyum sesuai instruksi."),
    ("bilateral_arm_raise", "Bilateral Arm Raise", "movement", "Angkat kedua lengan sesuai contoh."),
    ("sit_to_stand", "Sit To Stand", "movement", "Berdiri dari posisi duduk dengan aman."),
]


def seed_checkpoint_templates(db: Session) -> None:
    existing_codes = set(db.scalars(select(CheckpointTemplate.code)).all())
    for code, name, modality, instruction in DEFAULT_TEMPLATES:
        if code in existing_codes:
            continue
        db.add(
            CheckpointTemplate(
                code=code,
                name=name,
                modality=modality,
                instruction_text=instruction,
                expected_phases={},
                metric_schema={"version": 1, "transparent_metrics_only": True},
                quality_requirements={"min_quality": 0.6},
                active=True,
            )
        )
    db.commit()


class CheckpointService:
    def list_templates(self, db: Session) -> list[CheckpointTemplateOut]:
        seed_checkpoint_templates(db)
        templates = db.scalars(select(CheckpointTemplate).where(CheckpointTemplate.active.is_(True)).order_by(CheckpointTemplate.name)).all()
        return [CheckpointTemplateOut.model_validate(template, from_attributes=True) for template in templates]

    def create_checkpoint(self, db: Session, person_id: str, payload: CheckpointCreate, user: User) -> CheckpointOut:
        self._require_person_access(db, person_id, user)
        existing = db.scalar(
            select(DevelopmentCheckpoint).where(
                DevelopmentCheckpoint.person_profile_id == person_id,
                DevelopmentCheckpoint.client_request_id == str(payload.client_request_id),
            )
        )
        if existing is not None:
            return self._checkpoint_out(existing)

        template = db.scalar(select(CheckpointTemplate).where(CheckpointTemplate.id == str(payload.template_id), CheckpointTemplate.active.is_(True)))
        if template is None:
            raise HTTPException(status_code=404, detail="Template checkpoint tidak ditemukan.")
        if not all([payload.consent.capture, payload.consent.analysis, payload.consent.professional_sharing]):
            raise HTTPException(status_code=400, detail="Persetujuan capture, analysis, dan professional sharing wajib diberikan.")

        consent = ConsentSnapshot(
            person_profile_id=person_id,
            captured_by_user_id=user.id,
            capture=payload.consent.capture,
            analysis=payload.consent.analysis,
            professional_sharing=payload.consent.professional_sharing,
            raw_retention_mode=payload.raw_retention_mode,
        )
        db.add(consent)
        db.flush()

        checkpoint = DevelopmentCheckpoint(
            person_profile_id=person_id,
            template_id=template.id,
            captured_by_user_id=user.id,
            recommendation_target_id=str(payload.recommendation_target_id) if payload.recommendation_target_id else None,
            capture_mode=payload.capture_mode.value,
            modality=template.modality,
            capture_timestamp=datetime.now(timezone.utc),
            status=ProcessingStatus.DRAFT,
            processing_version=1,
            raw_retention_mode=payload.raw_retention_mode,
            client_request_id=str(payload.client_request_id),
            consent_snapshot_id=consent.id,
        )
        db.add(checkpoint)
        db.add(OutboxEvent(topic="checkpoint.created", payload={"checkpoint_id": checkpoint.id}))
        db.commit()
        db.refresh(checkpoint)
        return self._checkpoint_out(checkpoint)

    def list_checkpoints(self, db: Session, person_id: str, user: User, capture_mode: str | None = None, limit: int = 20) -> list[CheckpointHistoryItemOut]:
        self._require_person_access(db, person_id, user)
        query = (
            select(DevelopmentCheckpoint, CheckpointTemplate)
            .join(CheckpointTemplate, CheckpointTemplate.id == DevelopmentCheckpoint.template_id)
            .where(DevelopmentCheckpoint.person_profile_id == person_id)
            .order_by(DevelopmentCheckpoint.capture_timestamp.desc())
            .limit(limit)
        )
        if capture_mode:
            query = query.where(DevelopmentCheckpoint.capture_mode == capture_mode)

        rows = db.execute(query).all()
        items: list[CheckpointHistoryItemOut] = []
        for checkpoint, template in rows:
            has_uploaded_asset = db.scalar(
                select(CheckpointAsset.id).where(CheckpointAsset.checkpoint_id == checkpoint.id, CheckpointAsset.upload_status == "uploaded")
            ) is not None
            has_results = any(
                db.scalar(select(model.id).where(model.checkpoint_id == checkpoint.id)) is not None
                for model in (CheckpointSpeechResult, CheckpointFaceResult, CheckpointPoseSequence, CheckpointMotionEmbedding)
            )
            has_report = db.scalar(select(CheckpointReport.id).where(CheckpointReport.checkpoint_id == checkpoint.id)) is not None
            items.append(
                CheckpointHistoryItemOut(
                    **self._checkpoint_out(checkpoint).model_dump(),
                    template_code=template.code,
                    template_name=template.name,
                    has_uploaded_asset=has_uploaded_asset,
                    has_results=has_results,
                    has_report=has_report,
                )
            )
        return items

    def presign_asset(self, db: Session, checkpoint_id: str, payload: PresignRequest, user: User) -> PresignResponse:
        checkpoint = self._require_checkpoint(db, checkpoint_id, user)
        object_key = f"checkpoints/{checkpoint.person_profile_id}/{checkpoint.id}/{uuid4()}-{payload.filename}"
        upload_url = object_storage.local_upload_url(object_key)
        asset = CheckpointAsset(
            checkpoint_id=checkpoint.id,
            object_key=object_key,
            content_type=payload.content_type,
            size_bytes=payload.size_bytes,
            upload_status="presigned",
            retention_deadline=datetime.now(timezone.utc) + timedelta(days=settings.CHECKPOINT_RAW_RETENTION_DAYS),
        )
        db.add(asset)
        db.commit()
        return PresignResponse(
            upload_url=upload_url,
            object_key=object_key,
            expires_in_seconds=settings.S3_PRESIGN_EXPIRY_SECONDS,
            required_headers={"Content-Type": payload.content_type},
        )

    def local_upload(self, object_key: str, upload_file: UploadFile) -> dict[str, str]:
        target = Path(object_storage.local_root / object_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(upload_file.file.read())
        return {"status": "uploaded", "object_key": object_key}

    def complete_asset(self, db: Session, checkpoint_id: str, payload: AssetCompleteRequest, user: User) -> CheckpointOut:
        checkpoint = self._require_checkpoint(db, checkpoint_id, user)
        asset = db.scalar(select(CheckpointAsset).where(CheckpointAsset.checkpoint_id == checkpoint.id, CheckpointAsset.object_key == payload.object_key))
        if asset is None:
            raise HTTPException(status_code=404, detail="Asset checkpoint tidak ditemukan.")
        head = object_storage.head_object(payload.object_key)
        if int(head["ContentLength"]) != payload.size_bytes:
            raise HTTPException(status_code=400, detail="Ukuran media tidak cocok dengan metadata presign.")
        if not object_storage.verify_sha256(payload.object_key, payload.sha256):
            raise HTTPException(status_code=400, detail="Verifikasi SHA256 gagal.")
        asset.sha256 = payload.sha256
        asset.size_bytes = payload.size_bytes
        asset.content_type = payload.content_type
        asset.upload_status = "uploaded"
        checkpoint.status = ProcessingStatus.ASSET_UPLOADED
        db.add(OutboxEvent(topic="checkpoint.asset_uploaded", payload={"checkpoint_id": checkpoint.id, "asset_id": asset.id}))
        db.commit()
        db.refresh(checkpoint)
        return self._checkpoint_out(checkpoint)

    def submit(self, db: Session, checkpoint_id: str, user: User) -> CheckpointOut:
        checkpoint = self._require_checkpoint(db, checkpoint_id, user)
        asset = db.scalar(select(CheckpointAsset).where(CheckpointAsset.checkpoint_id == checkpoint.id, CheckpointAsset.upload_status == "uploaded"))
        if asset is None:
            raise HTTPException(status_code=400, detail="Media checkpoint belum diunggah.")
        idempotency_key = f"{checkpoint.id}:v{checkpoint.processing_version}"
        job = db.scalar(select(CheckpointAnalysisJob).where(CheckpointAnalysisJob.idempotency_key == idempotency_key))
        if job is None:
            job = CheckpointAnalysisJob(
                checkpoint_id=checkpoint.id,
                processing_version=checkpoint.processing_version,
                queue_name="checkpoint.cpu",
                step="asset_uploaded",
                status="queued",
                idempotency_key=idempotency_key,
            )
            db.add(job)
        elif job.status in {"queued", "running", "completed"}:
            db.commit()
            db.refresh(checkpoint)
            return self._checkpoint_out(checkpoint)

        checkpoint.status = ProcessingStatus.PROCESSING
        db.commit()
        if settings.CELERY_TASK_ALWAYS_EAGER:
            process_submission.run(str(checkpoint.id))
        else:
            process_submission.apply_async(args=[str(checkpoint.id)], queue="checkpoint.cpu")
        db.refresh(checkpoint)
        return self._checkpoint_out(checkpoint)

    def get_checkpoint(self, db: Session, checkpoint_id: str, user: User) -> CheckpointOut:
        checkpoint = self._require_checkpoint(db, checkpoint_id, user)
        return self._checkpoint_out(checkpoint)

    def get_results(self, db: Session, checkpoint_id: str, user: User) -> CheckpointResultOut:
        checkpoint = self._require_checkpoint(db, checkpoint_id, user)
        speech = db.scalar(select(CheckpointSpeechResult).where(CheckpointSpeechResult.checkpoint_id == checkpoint.id))
        face = db.scalar(select(CheckpointFaceResult).where(CheckpointFaceResult.checkpoint_id == checkpoint.id))
        motion_embedding = db.scalar(select(CheckpointMotionEmbedding).where(CheckpointMotionEmbedding.checkpoint_id == checkpoint.id))
        pose_sequence = db.scalar(select(CheckpointPoseSequence).where(CheckpointPoseSequence.checkpoint_id == checkpoint.id))
        reference = db.scalar(select(CheckpointReferenceComparison).where(CheckpointReferenceComparison.checkpoint_id == checkpoint.id))
        trend = db.scalar(select(CheckpointTrendSnapshot).where(CheckpointTrendSnapshot.checkpoint_id == checkpoint.id))
        return CheckpointResultOut(
            checkpoint_id=UUID(checkpoint.id),
            processing_version=checkpoint.processing_version,
            speech=speech.metrics if speech else None,
            face=face.metrics if face else None,
            motion={"embedding_dimension": len(motion_embedding.embedding or []), **(pose_sequence.metrics if pose_sequence else {})} if motion_embedding else None,
            reference_comparison=reference.metrics if reference else None,
            trend=trend.snapshot if trend else None,
            limitations=["Deterministic analyzer remains fake in this phase, but results are persisted through the real database and queue pipeline."],
        )

    def get_report(self, db: Session, checkpoint_id: str, user: User) -> GeneratedReportOut:
        checkpoint = self._require_checkpoint(db, checkpoint_id, user)
        report = db.scalar(select(CheckpointReport).where(CheckpointReport.checkpoint_id == checkpoint.id))
        if report is None:
            raise HTTPException(status_code=404, detail="Report checkpoint belum tersedia.")
        return GeneratedReportOut(**report.report_payload)

    def review(self, db: Session, checkpoint_id: str, payload: ReviewCreate, user: User) -> CheckpointOut:
        checkpoint = self._require_checkpoint(db, checkpoint_id, user)
        if user.role not in {"professional", "admin"}:
            raise HTTPException(status_code=403, detail="Akses review checkpoint tidak diizinkan.")
        checkpoint.status = ProcessingStatus.APPROVED if payload.decision == "approved" else ProcessingStatus.RECAPTURE_REQUIRED
        db.commit()
        return self._checkpoint_out(checkpoint)

    def download_asset(self, db: Session, checkpoint_id: str, asset_id: str, user: User) -> dict[str, str]:
        checkpoint = self._require_checkpoint(db, checkpoint_id, user)
        asset = db.scalar(select(CheckpointAsset).where(CheckpointAsset.id == asset_id, CheckpointAsset.checkpoint_id == checkpoint.id))
        if asset is None:
            raise HTTPException(status_code=404, detail="Asset checkpoint tidak ditemukan.")
        return {"download_url": object_storage.presign_download(asset.object_key)}

    def _require_checkpoint(self, db: Session, checkpoint_id: str, user: User) -> DevelopmentCheckpoint:
        checkpoint = db.scalar(select(DevelopmentCheckpoint).where(DevelopmentCheckpoint.id == checkpoint_id))
        if checkpoint is None:
            raise HTTPException(status_code=404, detail="Checkpoint tidak ditemukan.")
        self._require_person_access(db, checkpoint.person_profile_id, user)
        return checkpoint

    def _require_person_access(self, db: Session, person_id: str, user: User) -> PersonProfile:
        person = db.scalar(select(PersonProfile).where(PersonProfile.id == person_id))
        if person is None:
            raise HTTPException(status_code=404, detail="Profil orang tidak ditemukan.")
        if user.role == "admin":
            return person
        if person.owner_user_id == user.id:
            return person
        relationship = db.scalar(
            select(PersonRelationship).where(
                PersonRelationship.person_id == person_id,
                PersonRelationship.user_id == user.id,
                PersonRelationship.status == "active",
            )
        )
        if relationship is None:
            raise HTTPException(status_code=404, detail="Akses profil tidak ditemukan.")
        return person

    def _checkpoint_out(self, checkpoint: DevelopmentCheckpoint) -> CheckpointOut:
        return CheckpointOut(
            id=UUID(checkpoint.id),
            person_profile_id=UUID(checkpoint.person_profile_id),
            template_id=UUID(checkpoint.template_id),
            recommendation_target_id=UUID(checkpoint.recommendation_target_id) if checkpoint.recommendation_target_id else None,
            capture_mode=checkpoint.capture_mode,
            status=checkpoint.status,
            overall_quality_status=checkpoint.overall_quality_status,
            capture_timestamp=checkpoint.capture_timestamp,
            processing_version=checkpoint.processing_version,
            raw_retention_mode=checkpoint.raw_retention_mode,
            trend_badge=checkpoint.trend_badge,
        )


checkpoint_service = CheckpointService()
