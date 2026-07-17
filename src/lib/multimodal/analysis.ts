import type { AutomatedTrend } from "./contracts";

export type Point3 = { x: number; y: number; z: number; visibility?: number };
export type PoseFrame = { atMs: number; landmarks: Point3[] };
export type EventSegment = { label: string; startMs: number; endMs: number; confidence: number };

export function normalizedDtw(
  a: number[][],
  b: number[][],
): { distance: number; similarity: number } {
  if (!a.length || !b.length) return { distance: Number.POSITIVE_INFINITY, similarity: 0 };
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(Number.POSITIVE_INFINITY));
  dp[0][0] = 0;
  const euclidean = (x: number[], y: number[]) =>
    Math.sqrt(x.reduce((sum, value, index) => sum + (value - (y[index] ?? 0)) ** 2, 0));
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      dp[i][j] =
        euclidean(a[i - 1], b[j - 1]) + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const distance = dp[a.length][b.length] / (a.length + b.length);
  return { distance, similarity: 1 / (1 + distance) };
}

export function poseGraphFeatures(frames: PoseFrame[]) {
  if (frames.length < 2)
    return { motionEnergy: 0, smoothness: 1, activeJoints: 0, vector: [] as number[] };
  const velocities: number[][] = [];
  for (let i = 1; i < frames.length; i += 1) {
    const dt = Math.max(1, frames[i].atMs - frames[i - 1].atMs) / 1000;
    velocities.push(
      frames[i].landmarks.map((p, joint) => {
        const previous = frames[i - 1].landmarks[joint] ?? p;
        return Math.hypot(p.x - previous.x, p.y - previous.y, p.z - previous.z) / dt;
      }),
    );
  }
  const perJoint = frames[0].landmarks.map(
    (_, joint) =>
      velocities.reduce((sum, velocity) => sum + (velocity[joint] ?? 0), 0) / velocities.length,
  );
  const motionEnergy =
    perJoint.reduce((sum, value) => sum + value * value, 0) / Math.max(1, perJoint.length);
  const activeJoints = perJoint.filter((value) => value > 0.08).length;
  const acceleration = velocities
    .slice(1)
    .flatMap((velocity, i) =>
      velocity.map((value, joint) => Math.abs(value - (velocities[i][joint] ?? value))),
    );
  const jerk =
    acceleration.reduce((sum, value) => sum + value, 0) / Math.max(1, acceleration.length);
  return {
    motionEnergy,
    smoothness: 1 / (1 + jerk),
    activeJoints,
    vector: [
      motionEnergy,
      activeJoints / Math.max(1, perJoint.length),
      1 / (1 + jerk),
      ...perJoint.slice(0, 12),
    ],
  };
}

export function segmentMovement(
  samples: Array<{ atMs: number; energy: number }>,
  taskCode: "bilateral_arm_raise" | "clap_hands" | "touch_head" | "sit_to_stand",
  threshold = 0.12,
): EventSegment[] {
  const segments: EventSegment[] = [];
  let start = -1;
  samples.forEach((sample, index) => {
    const active = sample.energy >= threshold;
    if (active && start < 0) start = index;
    const ends = start >= 0 && (!active || index === samples.length - 1);
    if (ends) {
      const endIndex = active ? index : Math.max(start, index - 1);
      const window = samples.slice(start, endIndex + 1);
      const peak = Math.max(...window.map((item) => item.energy));
      segments.push({
        label: taskCode,
        startMs: samples[start].atMs,
        endMs: samples[endIndex].atMs,
        confidence: Math.min(1, peak / Math.max(threshold, 0.01)),
      });
      start = -1;
    }
  });
  return segments.filter((segment) => segment.endMs > segment.startMs);
}

export function classifyTemporalTrend(input: {
  checkpoints: Array<{ capturedAt: string; value: number; quality: number }>;
  lowerIsBetter?: boolean;
}): AutomatedTrend {
  const valid = input.checkpoints.filter((item) => item.quality >= 0.6);
  const dates = new Set(valid.map((item) => item.capturedAt.slice(0, 10)));
  const averageQuality =
    valid.reduce((sum, item) => sum + item.quality, 0) / Math.max(1, valid.length);
  if (valid.length < 5 || dates.size < 3 || averageQuality < 0.6) return "insufficient_data";
  const ordered = [...valid].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const split = Math.max(2, Math.floor(ordered.length / 2));
  const mean = (items: typeof ordered) =>
    items.reduce((sum, item) => sum + item.value, 0) / items.length;
  const delta = mean(ordered.slice(split)) - mean(ordered.slice(0, split));
  const adjusted = input.lowerIsBetter ? -delta : delta;
  if (adjusted > 0.08) return "observed_positive_trend";
  if (adjusted < -0.08) return "needs_professional_review";
  return "stable_observation";
}

export function voiceMetrics(input: {
  transcript: string;
  durationSeconds: number;
  expectedPhrase?: string;
}) {
  const words = input.transcript.trim() ? input.transcript.trim().split(/\s+/) : [];
  const normalize = (value: string) =>
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean),
    );
  const observed = normalize(input.transcript);
  const expected = normalize(input.expectedPhrase ?? "");
  const overlap = expected.size
    ? [...expected].filter((word) => observed.has(word)).length / expected.size
    : null;
  const wordsPerMinute =
    input.durationSeconds > 0 ? (words.length / input.durationSeconds) * 60 : 0;
  const quality = Math.max(
    0,
    Math.min(
      1,
      (input.durationSeconds >= 1 ? 0.4 : 0) +
        (words.length >= 2 ? 0.4 : 0) +
        (input.durationSeconds <= 180 ? 0.2 : 0),
    ),
  );
  return {
    duration: input.durationSeconds,
    transcript: input.transcript,
    wordCount: words.length,
    wordsPerMinute,
    expectedPhraseSimilarity: overlap,
    qualityScore: quality,
  };
}

export interface MovementEncoder {
  readonly name: string;
  readonly version: string;
  encode(frames: PoseFrame[]): Promise<number[]>;
}

export class DeterministicPoseEncoder implements MovementEncoder {
  readonly name = "deterministic-spatiotemporal-graph";
  readonly version = "1.0.0";
  async encode(frames: PoseFrame[]) {
    return poseGraphFeatures(frames).vector;
  }
}
