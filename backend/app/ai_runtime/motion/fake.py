import numpy as np

from app.ai_runtime.protocols import MotionEmbeddingResult


class FakeMotionEncoder:
    def encode(self, normalized_pose: np.ndarray, mask: np.ndarray) -> MotionEmbeddingResult:
        vector = np.linspace(0.0, 1.0, 512, dtype=np.float32)
        vector = vector / np.linalg.norm(vector)
        return MotionEmbeddingResult(embedding=vector, model_revision="fake-motionbert-lite-test-revision")
