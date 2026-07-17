import numpy as np

from app.ai_runtime.audio.fake import FakeSpeechAnalyzer
from app.ai_runtime.face.fake import FakeFaceBehaviorAnalyzer
from app.ai_runtime.motion.fake import FakeMotionEncoder
from app.ai_runtime.pose.mapping import MEDIAPIPE_33_TO_H36M_17, normalize_pose_sequence
from app.ai_runtime.reporting.groq import SafeDraftReportGenerator
from app.ai_runtime.segmentation.dtw import normalized_dtw_distance


def test_embedding_dimensions() -> None:
    assert FakeSpeechAnalyzer().analyze_fixture().embedding_dimension == 1280
    assert FakeFaceBehaviorAnalyzer().analyze_fixture().embedding_dimension == 112
    pose, mask = normalize_pose_sequence(np.ones((8, 33, 3), dtype=np.float32))
    assert FakeMotionEncoder().encode(pose, mask).embedding.shape == (512,)


def test_pose_mapping_documents_17_joints() -> None:
    assert len(MEDIAPIPE_33_TO_H36M_17) == 17
    pose, mask = normalize_pose_sequence(np.ones((2, 33, 3), dtype=np.float32))
    assert pose.shape == (2, 17, 3)
    assert mask.shape == (2, 17)


def test_dtw_identity_is_zero() -> None:
    assert normalized_dtw_distance([0, 1, 2], [0, 1, 2]) == 0


def test_report_validator_rejects_clinical_language() -> None:
    report = SafeDraftReportGenerator().generate_sync({"checkpoint_template": "repeat_phrase"})
    assert report.automated_trend_language == "insufficient_data"
