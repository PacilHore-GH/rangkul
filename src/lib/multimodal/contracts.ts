import { z } from "zod";

export const automatedTrendSchema = z.enum([
  "observed_positive_trend",
  "stable_observation",
  "needs_professional_review",
  "insufficient_data",
]);

export const structuredCheckpointSummarySchema = z.object({
  headline: z.string().min(1).max(120),
  observationSummary: z.array(z.string()).max(6),
  positiveObservations: z.array(z.string()).max(6),
  professionalReviewItems: z.array(z.string()).max(6),
  comparisonWithPrevious: z.string().max(500),
  dataQualitySummary: z.string().max(500),
  limitations: z.array(z.string()).min(1).max(6),
  suggestedQuestions: z.array(z.string()).max(6),
  trend: automatedTrendSchema,
});

export const checkpointAnalysisSchema = z.object({
  id: z.string().uuid(),
  journalEntryId: z.string().uuid(),
  personId: z.string().uuid(),
  recommendationId: z.string().uuid().optional(),
  modality: z.enum(["voice", "face_behavior", "movement_video"]),
  taskCode: z.string().min(1).max(80),
  capturedAt: z.string().datetime(),
  quality: z.object({
    status: z.enum(["valid", "limited", "recapture_required"]),
    score: z.number().min(0).max(1),
    issues: z.array(z.string()),
  }),
  metrics: z.record(z.union([z.number(), z.string(), z.boolean(), z.null()])),
  featureVector: z.array(z.number().finite()).max(256),
  eventSegments: z
    .array(
      z.object({
        label: z.string(),
        startMs: z.number().nonnegative(),
        endMs: z.number().nonnegative(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .optional(),
  modelInfo: z.record(z.string()),
  automatedTrend: automatedTrendSchema,
  aiSummary: structuredCheckpointSummarySchema.optional(),
});

export type AutomatedTrend = z.infer<typeof automatedTrendSchema>;
export type StructuredCheckpointSummary = z.infer<typeof structuredCheckpointSummarySchema>;
export type CheckpointAnalysis = z.infer<typeof checkpointAnalysisSchema>;
