from app.ai_runtime.protocols import FaceAnalysisResult


class FakeFaceBehaviorAnalyzer:
    def analyze_fixture(self) -> FaceAnalysisResult:
        return FaceAnalysisResult(
            embedding_dimension=112,
            valid_face_frame_ratio=0.92,
            multiple_face_ratio=0.0,
            head_pose_mean={"yaw": 2.1, "pitch": -1.4, "roll": 0.6},
            head_pose_std={"yaw": 3.5, "pitch": 2.8, "roll": 1.1},
            requested_action_completion=[{"action": "jawOpen", "completed": True, "peak": 0.61}],
            tracking_stability=0.89,
            capture_quality_status="pass",
            model_revision="fake-mediapipe-face-landmarker-test-revision",
        )
