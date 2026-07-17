# AI Worker Runbook

CPU workers handle media probing, MediaPipe, quality gates, segmentation, DTW, and trend recomputation. GPU workers handle Whisper and MotionBERT. Keep GPU concurrency low and retry CUDA OOM once with a smaller batch before failing explicitly.
