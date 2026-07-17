from app.ai_runtime.protocols import SpeechAnalysisResult


class FakeSpeechAnalyzer:
    def analyze_fixture(self) -> SpeechAnalysisResult:
        return SpeechAnalysisResult(
            transcript="Saya mencoba mengikuti instruksi.",
            language="id",
            duration_seconds=7.2,
            segments=[{"start": 0.4, "end": 3.8, "text": "Saya mencoba mengikuti instruksi."}],
            embedding_dimension=1280,
            voice_activity_ratio=0.64,
            silence_ratio=0.36,
            snr_db=24.0,
            clipping_ratio=0.0,
            data_quality_status="pass",
            model_revision="fake-whisper-large-v3-turbo-test-revision",
        )
