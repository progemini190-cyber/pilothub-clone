import { z } from "zod";
import * as db from "./db";
import { invokeAdvisorLLM, type AdvisorSlug } from "./llmWithApiKey";
import { appendAdvisorSafetyPrompt } from "@shared/chatSafety";
import type { LlmMessage } from "@shared/llmChat";
import { parseImagePayload } from "@shared/llmChat";

export const advisorChatInputSchema = z
  .object({
    message: z.string().max(10000),
    conversationId: z.number().optional(),
    imageBase64: z.string().max(6_000_000).optional(),
  })
  .refine((d) => d.message.trim().length > 0 || Boolean(d.imageBase64?.trim()), {
    message: "Message or image is required",
  });

const FALLBACK_PROMPTS: Record<AdvisorSlug, string> = {
  bizpilot: "You are BizPilot, an expert business advisor for Myanmar businesses.",
  founderpilot: "You are FounderPilot, a strategic advisor for founders and CEOs.",
};

function toDataUrl(imageBase64?: string | null): string | null {
  if (!imageBase64?.trim()) return null;
  const parsed = parseImagePayload(imageBase64);
  if (!parsed) return null;
  return `data:${parsed.mimeType};base64,${parsed.base64}`;
}

export async function runAdvisorChatMutation(
  advisor: AdvisorSlug,
  user: { id: number; name?: string | null },
  input: z.infer<typeof advisorChatInputSchema>,
) {
  const usage = await db.getMessageUsage(user.id, advisor);
  const text = input.message.trim();
  const imageDataUrl = toDataUrl(input.imageBase64);
  const userContent = text || (imageDataUrl ? "[Image attached]" : "");

  const conv = await db.getOrCreateConversation({
    userId: user.id,
    modelSlug: advisor,
    conversationId: input.conversationId,
  });

  await db.createMessage({
    conversationId: conv.id,
    role: "user",
    content: userContent,
    imageData: imageDataUrl,
  });

  const history = await db.listConversationMessages(conv.id);
  const recentHistory = history.slice(-20);

  const systemPrompt = await db.getActiveSystemPrompt(advisor);
  const fullUser = await db.getUserById(user.id);
  const userProfileLines = [
    `\n\n[User Profile]`,
    `- Name: ${fullUser?.name ?? user.name ?? "Unknown"}`,
    fullUser?.businessName ? `- Business Name: ${fullUser.businessName}` : null,
    (fullUser as { businessType?: string })?.businessType
      ? `- Business Type: ${(fullUser as { businessType?: string }).businessType}`
      : null,
    (fullUser as { useCase?: string })?.useCase
      ? `- How they use PilotHub: ${(fullUser as { useCase?: string }).useCase}`
      : null,
    `- Plan: ${usage.planType}`,
  ].filter(Boolean);
  const userProfileCtx = userProfileLines.join("\n");
  const olderHistory = history.slice(0, Math.max(0, history.length - 21));
  const memoryNote =
    olderHistory.length > 0
      ? `\n\n[Conversation Memory: ${history.length} total messages. Earlier: ${olderHistory
          .slice(-5)
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "AI"}: ${m.content.slice(0, 120)}`)
          .join(" | ")}]`
      : "";

  const baseSystem =
    (systemPrompt || FALLBACK_PROMPTS[advisor]) + userProfileCtx + memoryNote;
  const safeSystem = appendAdvisorSafetyPrompt(baseSystem, advisor);

  const llmMessages: LlmMessage[] = [
    { role: "system", content: safeSystem },
    ...recentHistory.slice(0, -1).map((m: { role: string; content: string; imageData?: string | null }) => {
      const row = m as { imageData?: string | null };
      return {
        role: m.role as "user" | "assistant",
        content: m.content,
        imageBase64: row.imageData ?? undefined,
      };
    }),
    {
      role: "user",
      content: userContent,
      imageBase64: imageDataUrl ?? undefined,
    },
  ];

  let assistantMessage: string;
  try {
    assistantMessage = await invokeAdvisorLLM(advisor, llmMessages);
  } catch (err) {
    console.error(`[AdvisorChat] LLM Generation Error Details for advisor=${advisor} userId=${user.id}:`, err);
    throw err;
  }

  await db.createMessage({ conversationId: conv.id, role: "assistant", content: assistantMessage });
  await db.touchConversation(conv.id);
  if (history.length <= 1) {
    await db.updateConversationTitle(conv.id, (text || "Image message").slice(0, 80));
  }
  await db.incrementMessageUsed(user.id, advisor);
  const newUsage = await db.getMessageUsage(user.id, advisor);
  return { conversationId: conv.id, message: assistantMessage, usage: newUsage };
}
