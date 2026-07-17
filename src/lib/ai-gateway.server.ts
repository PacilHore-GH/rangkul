import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type AiGatewayConfig = {
  apiKey: string;
  baseURL: string;
  model: string;
};

export function getAiGatewayConfig(): AiGatewayConfig {
  const apiKey = process.env.AI_API_KEY;
  const baseURL = process.env.AI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai";
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash";
  if (!apiKey) throw new Error("AI_API_KEY is not configured");
  return { apiKey, baseURL, model };
}

export function createAiGatewayProvider(config: AiGatewayConfig) {
  return createOpenAICompatible({
    name: "rangkul-ai",
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}
