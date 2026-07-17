from __future__ import annotations

from celery import shared_task
from sqlalchemy import select
from uuid import UUID

from app.ai_runtime.audio.fake import FakeSpeechAnalyzer
from app.ai_runtime.face.fake import FakeFaceBehaviorAnalyzer
from app.ai_runtime.motion.fake import FakeMotionEncoder
from app.ai_runtime.pose.mapping import normalize_pose_sequence
from app.ai_runtime.reporting.groq import SafeDraftReportGenerator
from app.ai_runtime.segmentation.dtw import normalized_dtw_distance
from app.ai_runtime.temporal.trends import analyze_trend
from app.db import SessionLocal
from app.models import (
    AIModelRegistry,
    CheckpointAnalysisJob,
    CheckpointEventSegment,
    CheckpointFaceEmbedding,
    CheckpointFaceResult,
    CheckpointMotionEmbedding,
    CheckpointPoseSequence,
    CheckpointReferenceComparison,
    CheckpointReport,
    CheckpointSpeechEmbedding,
    CheckpointSpeechResult,
    CheckpointTemplate,
    CheckpointTrendSnapshot,
    DevelopmentCheckpoint,
)
from app.development_checkpoints.domain.enums import ProcessingStatus, QualityStatus, TrendStatus


@shared_task(name="checkpoint.cpu.process_submission", bind=True)
def process_submission(self, checkpoint_id: str) -> dict:
    import numpy as np

    checkpoint_key = str(UUID(checkpoint_id))
    with SessionLocal() as db:
        checkpoint = db.scalar(select(DevelopmentCheckpoint).where(DevelopmentCheckpoint.id == checkpoint_key))
        if checkpoint is None:
            return {"status": "missing"}
        existing_report = db.scalar(select(CheckpointReport).where(CheckpointReport.checkpoint_id == checkpoint.id))
        if existing_report is not None:
            return {"status": "already_completed", "checkpoint_id": checkpoint_id}
        template = db.scalar(select(CheckpointTemplate).where(CheckpointTemplate.id == checkpoint.template_id))
        job = db.scalar(
            select(CheckpointAnalysisJob).where(
                CheckpointAnalysisJob.checkpoint_id == checkpoint_key,
                CheckpointAnalysisJob.processing_version == checkpoint.processing_version,
            )
        )
        if job:
            job.status = "running"
            job.attempts += 1
        speech = face = None
        if checkpoint.capture_mode == "voice":
            speech = FakeSpeechAnalyzer().analyze_fixture()
            model = _ensure_model(db, "fake_speech", speech.model_revision, 1280)
            db.add(
                CheckpointSpeechResult(
                    checkpoint_id=checkpoint.id,
                    processing_version=checkpoint.processing_version,
                    transcript=speech.transcript,
                    metrics=speech.model_dump(),
                    model_registry_id=model.id,
                )
            )
            db.add(CheckpointSpeechEmbedding(checkpoint_id=checkpoint.id, embedding=[0.0] * 1280, model_registry_id=model.id))
        if checkpoint.capture_mode in {"face_image", "face_video"}:
            face = FakeFaceBehaviorAnalyzer().analyze_fixture()
            model = _ensure_model(db, "fake_face", face.model_revision, 112)
            db.add(CheckpointFaceResult(checkpoint_id=checkpoint.id, processing_version=checkpoint.processing_version, metrics=face.model_dump(), model_registry_id=model.id))
            db.add(CheckpointFaceEmbedding(checkpoint_id=checkpoint.id, embedding=[0.0] * 112, model_registry_id=model.id))
        if checkpoint.capture_mode == "movement_video":
            pose = np.zeros((24, 33, 3), dtype=np.float32)
            pose17, mask = normalize_pose_sequence(pose)
            embedding = FakeMotionEncoder().encode(pose17, mask)
            model = _ensure_model(db, "fake_motion", embedding.model_revision, 512)
            db.add(CheckpointPoseSequence(checkpoint_id=checkpoint.id, object_key=f"derived/{checkpoint.id}.npz", metrics={"frames": 24}))
            db.add(CheckpointMotionEmbedding(checkpoint_id=checkpoint.id, embedding=embedding.embedding.tolist(), model_registry_id=model.id))
            db.add(
                CheckpointEventSegment(
                    checkpoint_id=checkpoint.id,
                    sequence=1,
                    phase_name="raise",
                    start_ms=1000,
                    end_ms=2600,
                    metadata_json={"complete_repetitions": 2},
                )
            )
        db.add(
            CheckpointReferenceComparison(
                checkpoint_id=checkpoint.id,
                metrics={"dtw_distance": normalized_dtw_distance([0, 1, 2], [0, 1, 2])},
            )
        )
        trend = analyze_trend(valid_checkpoints=5, average_quality=0.82)
        db.add(CheckpointTrendSnapshot(person_profile_id=checkpoint.person_profile_id, checkpoint_id=checkpoint.id, snapshot=trend.model_dump()))
        report = SafeDraftReportGenerator().generate_sync({"checkpoint_template": template.code if template else "unknown"})
        db.add(
            CheckpointReport(
                checkpoint_id=checkpoint.id,
                processing_version=checkpoint.processing_version,
                report_payload=report.model_dump(),
                status="draft",
            )
        )
        checkpoint.status = ProcessingStatus.READY_FOR_PROFESSIONAL_REVIEW
        checkpoint.overall_quality_status = QualityStatus.PASS
        checkpoint.trend_badge = TrendStatus.STABLE_OBSERVATION
        if job:
            job.status = "completed"
        db.commit()
        return {"status": "completed", "checkpoint_id": checkpoint_id}


def _ensure_model(db, model_key: str, revision: str, dimensions: int) -> AIModelRegistry:
    model = db.scalar(select(AIModelRegistry).where(AIModelRegistry.model_key == model_key, AIModelRegistry.model_revision == revision))
    if model is None:
        model = AIModelRegistry(
            model_key=model_key,
            provider="local",
            model_name=model_key,
            model_revision=revision,
            feature_schema_version="v1",
            embedding_dimension=dimensions,
        )
        db.add(model)
        db.flush()
    return model
