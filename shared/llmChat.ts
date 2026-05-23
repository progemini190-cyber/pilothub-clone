/** Shared types for multimodal advisor chat (web + server). */

export type AdvisorSlug = "bizpilot" | "founderpilot";

export type LlmChatTurn = {
  role: "user" | "assistant";
  content: string;
  /** Raw base64 payload (no data: prefix) or full data URL */
  imageBase64?: string;
  imageMimeType?: string;
};

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  imageBase64?: string;
  imageMimeType?: string;
};

/** Vision-capable Gemini models (multimodal). */
export const VISION_GEMINI_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
] as const;

export function isVisionCapableGeminiModel(model: string): boolean {
  const m = model.toLowerCase();
  return VISION_GEMINI_MODELS.some((v) => m.includes(v.replace("-latest", "")) || m === v);
}

export function parseImagePayload(input?: string | null): {
  mimeType: string;
  base64: string;
} | null {
  if (!input?.trim()) return null;
  const trimmed = input.trim();
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
  if (dataUrlMatch) {
    return { mimeType: dataUrlMatch[1]!, base64: dataUrlMatch[2]! };
  }
  return { mimeType: "image/jpeg", base64: trimmed };
}
