from enum import StrEnum


class AccountRole(StrEnum):
    FAMILY_MEMBER_CAREGIVER = "family_member_caregiver"
    PROFESSIONAL = "professional"
    ADMIN = "admin"


class CheckpointModality(StrEnum):
    VOICE = "voice"
    FACE = "face"
    MOVEMENT = "movement"
    MULTIMODAL = "multimodal"


class CaptureMode(StrEnum):
    VOICE = "voice"
    FACE_IMAGE = "face_image"
    FACE_VIDEO = "face_video"
    MOVEMENT_VIDEO = "movement_video"
    MULTIMODAL = "multimodal"


class ProcessingStatus(StrEnum):
    DRAFT = "draft"
    ASSET_UPLOADED = "asset_uploaded"
    PROCESSING = "processing"
    READY_FOR_PROFESSIONAL_REVIEW = "ready_for_professional_review"
    APPROVED = "approved"
    RECAPTURE_REQUIRED = "recapture_required"
    FAILED = "failed"
    CANCELLED = "cancelled"


class QualityStatus(StrEnum):
    PASS = "pass"
    WARNING = "warning"
    REJECTED = "rejected"
    INSUFFICIENT_DATA = "insufficient_data"


class TrendStatus(StrEnum):
    OBSERVED_POSITIVE_TREND = "observed_positive_trend"
    STABLE_OBSERVATION = "stable_observation"
    NEEDS_PROFESSIONAL_REVIEW = "needs_professional_review"
    INSUFFICIENT_DATA = "insufficient_data"
