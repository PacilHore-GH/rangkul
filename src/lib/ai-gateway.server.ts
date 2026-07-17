import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Lovable AI Gateway provider — server-only.
export function createGroqProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  });
}

export const DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile";
