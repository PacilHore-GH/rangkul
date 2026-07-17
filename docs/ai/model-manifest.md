# Model Manifest

The manifest lives at `backend/model_manifest.yaml`. It lists Whisper Large V3 Turbo, MotionBERT-Lite, MediaPipe Face Landmarker, and MediaPipe Pose Landmarker Full.

Use:

```bash
cd backend
python -m app.ai_runtime.bootstrap --print-manifest
python -m app.ai_runtime.bootstrap --verify-only
```

Production images should mount a persistent read-only model cache after bootstrap. Model files are never committed to Git.
