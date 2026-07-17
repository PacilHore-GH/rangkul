import { describe, expect, test } from "bun:test";
import {
  classifyTemporalTrend,
  normalizedDtw,
  poseGraphFeatures,
  segmentMovement,
  voiceMetrics,
} from "./analysis";
import { structuredCheckpointSummarySchema } from "./contracts";

describe("multimodal deterministic analysis", () => {
  test("DTW returns perfect similarity for matching sequences", () => {
    expect(normalizedDtw([[0], [1], [2]], [[0], [1], [2]])).toEqual({ distance: 0, similarity: 1 });
  });

  test("segments active movement windows", () => {
    const result = segmentMovement(
      [
        { atMs: 0, energy: 0 },
        { atMs: 100, energy: 0.4 },
        { atMs: 200, energy: 0.5 },
        { atMs: 300, energy: 0 },
      ],
      "clap_hands",
    );
    expect(result).toHaveLength(1);
    expect(result[0].startMs).toBe(100);
  });

  test("extracts graph motion features", () => {
    const result = poseGraphFeatures([
      { atMs: 0, landmarks: [{ x: 0, y: 0, z: 0 }] },
      { atMs: 1000, landmarks: [{ x: 1, y: 0, z: 0 }] },
    ]);
    expect(result.motionEnergy).toBe(1);
    expect(result.activeJoints).toBe(1);
  });

  test("requires five checkpoints across three dates", () => {
    expect(
      classifyTemporalTrend({
        checkpoints: Array.from({ length: 4 }, (_, i) => ({
          capturedAt: `2026-07-0${i + 1}T00:00:00Z`,
          value: i,
          quality: 0.9,
        })),
      }),
    ).toBe("insufficient_data");
  });

  test("classifies a positive observed trend", () => {
    expect(
      classifyTemporalTrend({
        checkpoints: [1, 1.1, 1.3, 1.5, 1.8].map((value, i) => ({
          capturedAt: `2026-07-0${i + 1}T00:00:00Z`,
          value,
          quality: 0.9,
        })),
      }),
    ).toBe("observed_positive_trend");
  });

  test("computes speech metrics without identity inference", () => {
    expect(
      voiceMetrics({
        transcript: "selamat pagi",
        durationSeconds: 2,
        expectedPhrase: "selamat pagi",
      }).expectedPhraseSimilarity,
    ).toBe(1);
  });

  test("validates structured summaries", () => {
    expect(
      structuredCheckpointSummarySchema.parse({
        headline: "Observasi selesai",
        observationSummary: [],
        positiveObservations: [],
        professionalReviewItems: [],
        comparisonWithPrevious: "Belum ada pembanding.",
        dataQualitySummary: "Baik",
        limitations: ["Bukan diagnosis."],
        suggestedQuestions: [],
        trend: "insufficient_data",
      }).trend,
    ).toBe("insufficient_data");
  });
});
