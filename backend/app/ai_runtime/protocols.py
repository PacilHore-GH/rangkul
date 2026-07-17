from pathlib import Path
from typing import Protocol

import numpy as np
from pydantic import BaseModel


class SpeechAnalysisRequest(BaseModel):
    language_hint: str = "id"
    expected_phrase: str | None = None
    instruction_timestamp_ms: int | None = None


class SpeechAnalysisResult(BaseModel):
    transcript: str
    language: str
    duration_seconds: float
    segments: list[dict]
    embedding_dimension: int
    voice_activity_ratio: float
    silence_ratio: float
    snr_db: float
    clipping_ratio: float
    data_quality_status: str
    model_revision: str


class FaceAnalysisRequest(BaseModel):
    target_actions: list[dict] = []


class FaceAnalysisResult(BaseModel):
    embedding_dimension: int
    valid_face_frame_ratio: float
    multiple_face_ratio: float
    head_pose_mean: dict[str, float]
    head_pose_std: dict[str, float]
    requested_action_completion: list[dict]
    tracking_stability: float
    capture_quality_status: str
    model_revision: str


class PoseAnalysisRequest(BaseModel):
    analysis_fps: int = 15


class PoseSequenceResult(BaseModel):
    frames: int
    valid_pose_ratio: float
    quality_status: str
    model_revision: str


class MotionEmbeddingResult(BaseModel):
    embedding: np.ndarray
    model_revision: str

    model_config = {"arbitrary_types_allowed": True}


class GraphSequence(BaseModel):
    nodes: list[str]
    edges: list[tuple[str, str]]
    frames: list[dict]


class InstructionTemplate(BaseModel):
    code: str
    expected_phases: list[dict]


class SegmentationResult(BaseModel):
    phases: list[dict]
    complete_repetitions: int


class MotionSequence(BaseModel):
    values: list[float]


class ReferenceComparison(BaseModel):
    dtw_distance: float
    compatible: bool


class CheckpointSeries(BaseModel):
    values: list[float]
    quality: list[float]


class ProfessionalRecommendation(BaseModel):
    target_direction: str = "increase"


class TrendResult(BaseModel):
    status: str
    valid_checkpoints: int
    average_quality: float
    limitations: list[str]


class ReportPayload(BaseModel):
    checkpoint_template: str
    data_quality: dict
    observed_metrics: dict


class GeneratedReport(BaseModel):
    headline: str
    observation_summary: list[str]
    positive_observations: list[str]
    items_for_professional_review: list[str]
    adherence_summary: str
    data_quality_summary: str
    limitations: list[str]
    suggested_review_questions: list[str]
    automated_trend_language: str


class SpeechAnalyzer(Protocol):
    def analyze(self, audio_path: Path, request: SpeechAnalysisRequest) -> SpeechAnalysisResult: ...


class FaceBehaviorAnalyzer(Protocol):
    def analyze_image(self, image_path: Path, request: FaceAnalysisRequest) -> FaceAnalysisResult: ...
    def analyze_video(self, video_path: Path, request: FaceAnalysisRequest) -> FaceAnalysisResult: ...


class PoseAnalyzer(Protocol):
    def analyze_video(self, video_path: Path, request: PoseAnalysisRequest) -> PoseSequenceResult: ...


class MotionEncoder(Protocol):
    def encode(self, normalized_pose: np.ndarray, mask: np.ndarray) -> MotionEmbeddingResult: ...
