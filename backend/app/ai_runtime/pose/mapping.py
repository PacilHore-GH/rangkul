import numpy as np

# Human3.6M 17 joint order:
# pelvis, right_hip, right_knee, right_ankle, left_hip, left_knee, left_ankle,
# spine, thorax, neck, head, left_shoulder, left_elbow, left_wrist,
# right_shoulder, right_elbow, right_wrist.
# MediaPipe has no explicit spine/thorax/neck/head top joints; these are
# documented midpoints so downstream consumers never treat them as raw joints.
MEDIAPIPE_33_TO_H36M_17 = {
    0: ("midpoint", [23, 24], "pelvis"),
    1: ("direct", [24], "right_hip"),
    2: ("direct", [26], "right_knee"),
    3: ("direct", [28], "right_ankle"),
    4: ("direct", [23], "left_hip"),
    5: ("direct", [25], "left_knee"),
    6: ("direct", [27], "left_ankle"),
    7: ("midpoint", [11, 12, 23, 24], "spine"),
    8: ("midpoint", [11, 12], "thorax"),
    9: ("midpoint", [0, 11, 12], "neck"),
    10: ("direct", [0], "head"),
    11: ("direct", [11], "left_shoulder"),
    12: ("direct", [13], "left_elbow"),
    13: ("direct", [15], "left_wrist"),
    14: ("direct", [12], "right_shoulder"),
    15: ("direct", [14], "right_elbow"),
    16: ("direct", [16], "right_wrist"),
}


def normalize_pose_sequence(pose33: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    if pose33.ndim != 3 or pose33.shape[1:] != (33, 3):
        raise ValueError("Expected pose sequence shape [frames, 33, 3].")
    frames = pose33.shape[0]
    pose17 = np.zeros((frames, 17, 3), dtype=np.float32)
    mask = np.ones((frames, 17), dtype=bool)
    for target_idx, (_, source_idxs, _) in MEDIAPIPE_33_TO_H36M_17.items():
        pose17[:, target_idx, :] = pose33[:, source_idxs, :].mean(axis=1)
    root = pose17[:, 0:1, :]
    shoulder_width = np.linalg.norm(pose17[:, 11, :] - pose17[:, 14, :], axis=1)
    hip_width = np.linalg.norm(pose17[:, 4, :] - pose17[:, 1, :], axis=1)
    scale = np.maximum((shoulder_width + hip_width) / 2.0, 1e-6).reshape(frames, 1, 1)
    return (pose17 - root) / scale, mask
