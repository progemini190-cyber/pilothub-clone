/**
 * LLM invoker that uses API keys stored in the database.
 * Falls back to the built-in platform LLM if no custom key is configured.
 *
 * Supports multimodal (vision) user turns via base64 image payloads.
 */
import { assertOpenAiApiKeyConfigured, resolveOpenAiApiKey } from "./_core/aiKeys";
import { getActiveApiKey, getAiModel } from "./db";
import type { InvokeResult } from "./_core/llm";
import { invokeLLM } from "./_core/llm";
import {
  isVisionCapableGeminiModel,
  parseImagePayload,
  type LlmMessage,
} from "@shared/llmChat";

export type AdvisorSlug = "bizpilot" | "founderpilot";

const TEMPERATURE = 0.3;
const MAX_OUTPUT_TOKENS = 4096;
const DEFAULT_VISION_MODEL = "gemini-1.5-flash-latest";

function chatHasImages(msgs: LlmMessage[]): boolean {
  return msgs.some((m) => m.role !== "system" && Boolean(m.imageBase64?.trim()));
}

function resolveGeminiModel(configured: string, hasImages: boolean): string {
  if (hasImages && !isVisionCapableGeminiModel(configured)) {
    return DEFAULT_VISION_MODEL;
  }
  return configured;
}

export async function invokeAdvisorLLM(
  advisorSlug: AdvisorSlug,
  messages: LlmMessage[],
): Promise<string> {
  const envOpenAiKey = resolveOpenAiApiKey();
  const aiModel = await getAiModel(advisorSlug);
  const configuredModel = aiModel?.modelString ?? DEFAULT_VISION_MODEL;
  const hasImages = chatHasImages(messages);
  const modelString = resolveGeminiModel(configuredModel, hasImages);
  const isGeminiModel = modelString.startsWith("gemini");

  const systemMsg = messages.find((m) => m.role === "system");
  const systemPromptText = systemMsg?.content ?? "";

  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      imageBase64: m.imageBase64,
      imageMimeType: m.imageMimeType,
    }));

  if (isGeminiModel) {
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
    const openaiKey = await getActiveApiKey("openai");
    const openAiApiKey = openaiKey?.keyValue?.trim() || envOpenAiKey;
    if (openAiApiKey) {
      try {
        return await invokeWithOpenAI({
          apiKey: openAiApiKey,
          model: modelString,
          systemPrompt: systemPromptText,
          chatMessages,
        });
      } catch (err) {
        console.warn("[LLM] OpenAI key failed, trying Gemini:", err);
      }
    }

    const geminiKey = await getActiveApiKey("gemini");
    if (geminiKey?.keyValue) {
      try {
        return await invokeWithGemini({
          apiKey: geminiKey.keyValue,
          model: resolveGeminiModel(DEFAULT_VISION_MODEL, hasImages),
          systemPrompt: systemPromptText,
          chatMessages,
        });
      } catch (err) {
        console.warn("[LLM] Gemini fallback failed, using built-in:", err);
      }
    }
  }

  if (envOpenAiKey && !isGeminiModel) {
    try {
      return await invokeWithOpenAI({
        apiKey: assertOpenAiApiKeyConfigured(),
        model: modelString,
        systemPrompt: systemPromptText,
        chatMessages,
      });
    } catch (err) {
      console.warn("[LLM] Env OPENAI_API_KEY failed, falling back to built-in:", err);
    }
  }

  const fallbackMessages = messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));
  assertOpenAiApiKeyConfigured();
  const response = await invokeLLM({ messages: fallbackMessages });
  const content = response.choices[0]?.message?.content;
  return typeof content === "string" ? content : "Sorry, I could not generate a response.";
}

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  imageMimeType?: string;
};

async function invokeWithOpenAI(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  chatMessages: ChatTurn[];
}): Promise<string> {
  const messages: Array<Record<string, unknown>> = [];

  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }

  const sanitizedChat = sanitizeChatMessages(params.chatMessages);
  for (const msg of sanitizedChat) {
    const image = parseImagePayload(msg.imageBase64);
    if (image && msg.role === "user") {
      const parts: Array<Record<string, unknown>> = [];
      if (msg.content.trim()) {
        parts.push({ type: "text", text: msg.content });
      }
      parts.push({
        type: "image_url",
        image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
      });
      messages.push({ role: "user", content: parts });
    } else {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

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

  const data = (await response.json()) as InvokeResult;
  const content = data.choices[0]?.message?.content;
  return typeof content === "string" ? content : "No response";
}

function buildGeminiParts(msg: ChatTurn): Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  if (msg.content.trim()) {
    parts.push({ text: msg.content });
  }
  const image = parseImagePayload(msg.imageBase64);
  if (image) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64,
      },
    });
  }
  if (parts.length === 0) {
    parts.push({ text: "(no text)" });
  }
  return parts;
}

async function invokeWithGemini(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  chatMessages: ChatTurn[];
}): Promise<string> {
  const sanitizedChat = sanitizeChatMessages(params.chatMessages);

  const geminiContents = sanitizedChat.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: buildGeminiParts(m),
  }));

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

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
  };

  const candidate = data?.candidates?.[0];
  if (!candidate) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new Error(`Gemini returned no candidates. Block reason: ${blockReason ?? "unknown"}`);
  }

  const text = candidate?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.trim().length > 0 ? text : "No response generated.";
}

function sanitizeChatMessages(messages: ChatTurn[]): ChatTurn[] {
  if (messages.length === 0) return messages;

  const result: ChatTurn[] = [];

  for (const msg of messages) {
    const last = result[result.length - 1];
    if (last && last.role === msg.role) {
      last.content = `${last.content}\n\n${msg.content}`;
      if (msg.imageBase64 && !last.imageBase64) {
        last.imageBase64 = msg.imageBase64;
        last.imageMimeType = msg.imageMimeType;
      }
    } else {
      result.push({ ...msg });
    }
  }

  return result;
}
