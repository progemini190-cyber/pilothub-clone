/**
 * Resolve OpenAI-compatible API keys at call time (Node serverless).
 * Do not rely on SDK auto-detection of OPENAI_API_KEY.
 */
export function resolveOpenAiApiKey(): string {
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.BUILT_IN_FORGE_API_KEY?.trim() ||
    ""
  );
}

/** Pre-flight check immediately before an LLM request. */
export function assertOpenAiApiKeyConfigured(): string {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    console.error("CRITICAL: OPENAI_API_KEY is undefined at runtime!");
    throw new Error("Server configuration error: Missing AI Key.");
  }
  return apiKey;
}
