import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  imageData?: string | null;
};

function mapMessages(
  msgs: Array<{ role: string; content: string; imageData?: string | null }>,
): ChatMessage[] {
  return msgs.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
    imageData: m.imageData ?? null,
  }));
}

function isMessageLimitError(message: string): boolean {
  if (message === "MESSAGE_LIMIT_REACHED") return true;
  try {
    const parsed = JSON.parse(message) as { code?: string };
    return parsed.code === "MESSAGE_LIMIT_REACHED";
  } catch {
    return message.includes("MESSAGE_LIMIT_REACHED");
  }
}

export function useAdvisorChat(modelSlug: "bizpilot" | "founderpilot", userId: number | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [sending, setSending] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const historyHydratedRef = useRef(false);
  const loadingConversationIdRef = useRef<number | null>(null);

  const conversationsQuery = trpc.ai.conversations.list.useQuery(
    { modelSlug },
    { enabled: !!userId },
  );

  const historyQuery = trpc.ai.getHistory.useQuery(
    { modelSlug },
    { enabled: !!userId, staleTime: 30_000 },
  );

  const usageQuery = trpc.ai.messageUsage.useQuery(undefined, { enabled: !!userId });
  const usage = modelSlug === "bizpilot" ? usageQuery.data?.biz : usageQuery.data?.founder;
  const messagesUsed = usage?.used ?? 0;
  const messagesLimit = usage?.limit ?? 5;
  const messagesLeft = Math.max(0, messagesLimit - messagesUsed);
  const isUnlimited = messagesLimit >= 99999;
  const isLimitReached = !isUnlimited && messagesLeft <= 0;
  const planType = usage?.planType ?? "free";
  const hasPaidPlan = usage?.hasPaidPlan ?? false;

  const sendMutation = (
    modelSlug === "bizpilot" ? trpc.ai.bizpilot : trpc.ai.founderpilot
  ).useMutation({
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      setSending(false);
      usageQuery.refetch();
      conversationsQuery.refetch();
      historyQuery.refetch();
    },
    onError: (err) => {
      setSending(false);
      if (isMessageLimitError(err.message)) {
        setShowLimitModal(true);
      } else {
        toast.error(err.message || "Something went wrong");
      }
    },
  });

  const conversationDetailQuery = trpc.ai.conversations.get.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId, staleTime: 5000 },
  );

  useEffect(() => {
    if (historyHydratedRef.current || !historyQuery.data) return;
    const { conversationId: cid, messages: msgs } = historyQuery.data;
    if (cid && msgs.length > 0 && conversationId === undefined && messages.length === 0) {
      historyHydratedRef.current = true;
      setConversationId(cid);
      setMessages(mapMessages(msgs));
    }
  }, [historyQuery.data, conversationId, messages.length]);

  useEffect(() => {
    const data = conversationDetailQuery.data;
    if (!data?.messages || conversationId == null) return;
    if (data.conversation?.id !== conversationId) return;
    if (loadingConversationIdRef.current === conversationId) {
      setMessages(mapMessages(data.messages));
      loadingConversationIdRef.current = null;
    }
  }, [conversationDetailQuery.data, conversationId]);

  const handleSend = (text: string, imageDataUrl?: string) => {
    const msg = text.trim();
    if ((!msg && !imageDataUrl) || sending) return;
    if (isLimitReached) {
      setShowLimitModal(true);
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: msg || "[Image attached]",
        imageData: imageDataUrl ?? null,
      },
    ]);
    setSending(true);
    sendMutation.mutate({
      message: msg,
      conversationId,
      imageBase64: imageDataUrl,
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    loadingConversationIdRef.current = null;
    historyHydratedRef.current = false;
  };

  const loadConversation = (convId: number) => {
    loadingConversationIdRef.current = convId;
    setConversationId(convId);
  };

  return {
    messages,
    conversationId,
    sending,
    showLimitModal,
    setShowLimitModal,
    conversationsQuery,
    usageQuery,
    messagesUsed,
    messagesLimit,
    messagesLeft,
    isUnlimited,
    isLimitReached,
    planType,
    hasPaidPlan,
    historyQuery,
    handleSend,
    handleNewChat,
    loadConversation,
  };
}
