/**
 * LLM invoker that uses API keys stored in the database.
 * Falls back to the built-in platform LLM if no custom key is configured.
 *
 * FIXES APPLIED:
 * 1. Temperature hardcoded to 0.3 to prevent hallucinations
 * 2. System prompt passed via systemInstruction (Gemini) or system role (OpenAI)
 * 3. Message role mapping: assistant→model for Gemini, consecutive same-role deduplication
 */
import { getActiveApiKey, getAiModel } from "./db";
import type { InvokeResult } from "./_core/llm";
import { invokeLLM } from "./_core/llm";

export type AdvisorSlug = "bizpilot" | "founderpilot";

// Strict temperature to prevent hallucinations and keep grounded business advice
const TEMPERATURE = 0.3;
const MAX_OUTPUT_TOKENS = 4096;

/**
 * Invoke LLM for a specific advisor, using:
 * 1. Gemini API key from DB (preferred if model is gemini-*)
 * 2. OpenAI API key from DB (preferred if model is gpt-*)
 * 3. Built-in platform LLM (fallback)
 */
export async function invokeAdvisorLLM(
  advisorSlug: AdvisorSlug,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  // Get the configured model for this advisor
  const aiModel = await getAiModel(advisorSlug);
  const modelString = aiModel?.modelString ?? "gemini-2.5-pro-preview-05-06";

  const isGeminiModel = modelString.startsWith("gemini");

  // Extract system message — must be passed separately, NOT as a chat turn
  const systemMsg = messages.find(m => m.role === "system");
  const systemPromptText = systemMsg?.content ?? "";

  // Build chat messages (exclude system message from the chat turns)
  const chatMessages = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

  if (isGeminiModel) {
    // Prefer Gemini key for Gemini models
    const geminiKey = await getActiveApiKey("gemini");
    if (geminiKey?.keyValue) {
      try {
        return await invokeWithGemini({
          apiKey: geminiKey.keyValue,
          model: modelString,
          systemPrompt: systemPromptText,
          chatMessages,
        });
      } catch (err) {
        console.warn("[LLM] Gemini key failed, falling back to built-in:", err);
      }
    }
  } else {
    // Prefer OpenAI key for GPT models
    const openaiKey = await getActiveApiKey("openai");
    if (openaiKey?.keyValue) {
      try {
        return await invokeWithOpenAI({
          apiKey: openaiKey.keyValue,
          model: modelString,
          systemPrompt: systemPromptText,
          chatMessages,
        });
      } catch (err) {
        console.warn("[LLM] OpenAI key failed, trying Gemini:", err);
      }
    }

    // Try Gemini as fallback for OpenAI models
    const geminiKey = await getActiveApiKey("gemini");
    if (geminiKey?.keyValue) {
      try {
        return await invokeWithGemini({
          apiKey: geminiKey.keyValue,
          model: "gemini-2.5-pro-preview-05-06",
          systemPrompt: systemPromptText,
          chatMessages,
        });
      } catch (err) {
        console.warn("[LLM] Gemini fallback failed, using built-in:", err);
      }
    }
  }

  // Final fallback: built-in platform LLM (passes full messages including system)
  const fallbackMessages = messages.map(m => ({ role: m.role as "system" | "user" | "assistant", content: m.content }));
  const response = await invokeLLM({ messages: fallbackMessages });
  const content = response.choices[0]?.message?.content;
  return typeof content === "string" ? content : "Sorry, I could not generate a response.";
}

/**
 * Invoke OpenAI-compatible API.
 * System prompt is passed as the first message with role="system".
 */
async function invokeWithOpenAI(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  chatMessages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
  // Build messages: system first, then chat history
  const messages: Array<{ role: string; content: string }> = [];

  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }

  // Add chat messages, ensuring no consecutive same-role messages
  const sanitizedChat = sanitizeChatMessages(params.chatMessages);
  messages.push(...sanitizedChat);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} – ${errorText}`);
  }

  const data = await response.json() as InvokeResult;
  const content = data.choices[0]?.message?.content;
  return typeof content === "string" ? content : "No response";
}

/**
 * Invoke Google Gemini API.
 *
 * CRITICAL: System prompt MUST be passed via systemInstruction, NOT as a chat turn.
 * Temperature is hardcoded to 0.3 to prevent hallucinations.
 * Message roles: "user" and "model" only (no "assistant" or "system" in contents).
 */
async function invokeWithGemini(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  chatMessages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
  // Sanitize: remove consecutive same-role messages (Gemini requires strict alternation)
  const sanitizedChat = sanitizeChatMessages(params.chatMessages);

  // Map roles: "assistant" → "model" (Gemini uses "model" not "assistant")
  const geminiContents = sanitizedChat.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Ensure the last message is from "user" (Gemini requires ending with user turn)
  if (geminiContents.length === 0 || geminiContents[geminiContents.length - 1].role !== "user") {
    throw new Error("Gemini requires the last message to be from the user");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`;

  const body: Record<string, unknown> = {
    contents: geminiContents,
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      topP: 0.8,
      topK: 40,
    },
  };

  // CRITICAL FIX: System prompt via systemInstruction (separate from chat turns)
  if (params.systemPrompt && params.systemPrompt.trim().length > 0) {
    body.systemInstruction = {
      role: "user",
      parts: [{ text: params.systemPrompt }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} – ${errorText}`);
  }

  const data = await response.json() as any;

  // Check for safety blocks or empty responses
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new Error(`Gemini returned no candidates. Block reason: ${blockReason ?? "unknown"}`);
  }

  const text = candidate?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.trim().length > 0
    ? text
    : "No response generated.";
}

/**
 * Sanitize chat messages to ensure strict user/assistant alternation.
 * Gemini requires: user, model, user, model, ... (no consecutive same roles)
 * If consecutive same-role messages exist, merge them with a newline separator.
 */
function sanitizeChatMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Array<{ role: "user" | "assistant"; content: string }> {
  if (messages.length === 0) return messages;

  const result: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const msg of messages) {
    const last = result[result.length - 1];
    if (last && last.role === msg.role) {
      // Merge consecutive same-role messages
      last.content = `${last.content}\n\n${msg.content}`;
    } else {
      result.push({ role: msg.role, content: msg.content });
    }
  }

  return result;
}
