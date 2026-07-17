# Model Evaluation

Committed tests use synthetic fixtures and deterministic fake models. Real model smoke tests are opt-in with `RUN_MODEL_SMOKE_TESTS=1` after weights are bootstrapped and credentials are configured.

Evaluation should track transcription quality, face-frame validity, pose visibility, mapping correctness, embedding dimensions, DTW/reference behavior, trend threshold behavior, and report safety validation.
