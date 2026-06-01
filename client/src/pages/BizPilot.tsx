import { useState, useRef, useEffect } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Plus, MessageSquare, Lock, Brain, User } from "lucide-react";
import { useAdvisorChat } from "@/hooks/useAdvisorChat";
import { AdvisorChatComposer } from "@/components/AdvisorChatComposer";
import { AdvisorChatMessage } from "@/components/AdvisorChatMessage";

import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

const QUICK_PROMPTS = [
  "ကျွန်တော်တို့ business ရဲ့ revenue ကို တိုးချဲ့ဖို့ ဘာလုပ်ရမလဲ?",
  "Myanmar market မှာ competition ကို ဘယ်လို handle လုပ်ရမလဲ?",
  "Team management နဲ့ productivity တိုးဖို့ tips ပေးပါ",
  "Cash flow management ကို ဘယ်လို ကောင်းကောင်း လုပ်ရမလဲ?",
];

export default function BizPilot() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    conversationId,
    sending,
    showLimitModal,
    setShowLimitModal,
    conversationsQuery,
    messagesLeft,
    messagesLimit,
    isUnlimited,
    isLimitReached,
    planType,
    hasPaidPlan,
    handleSend,
    handleNewChat,
    loadConversation,
  } = useAdvisorChat("bizpilot", user?.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/sign-in");
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  return (
    <DashboardShell activeTab="bizpilot">
      <div className="flex h-full w-full overflow-hidden">
        {/* Conversation sidebar */}
        <div className="hidden md:flex w-56 flex-col flex-shrink-0"
          style={{ borderRight: "1px solid oklch(22% 0.04 220)", background: "oklch(13% 0.03 220)" }}>
          <div className="p-3" style={{ borderBottom: "1px solid oklch(22% 0.04 220)" }}>
            <button onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition"
              style={{ background: "oklch(60% 0.2 220 / 0.12)", color: "oklch(75% 0.2 220)", border: "1px solid oklch(60% 0.2 220 / 0.25)" }}>
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>
          {!isUnlimited && (
            <div className="px-3 py-2" style={{ borderBottom: "1px solid oklch(22% 0.04 220)" }}>
              <div className="px-3 py-2 rounded-lg text-center"
                style={{ background: messagesLeft <= 3 ? "oklch(60% 0.2 30 / 0.12)" : "oklch(60% 0.2 220 / 0.08)", border: `1px solid ${messagesLeft <= 3 ? "oklch(60% 0.2 30 / 0.3)" : "oklch(60% 0.2 220 / 0.2)"}` }}>
                <p className="text-xs font-semibold" style={{ color: messagesLeft <= 3 ? "oklch(75% 0.2 30)" : "oklch(75% 0.2 220)" }}>
                  {messagesLeft} / {messagesLimit} left
                </p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.03 220)" }}>
                  {hasPaidPlan
                    ? planType === "starter"
                      ? "Starter Pack"
                      : "Paid plan"
                    : planType === "free"
                      ? "Free messages"
                      : planType === "starter"
                        ? "Starter Pack"
                        : "messages"}
                </p>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversationsQuery.data?.conversations?.map((conv: { id: number; title?: string | null }) => (
              <button key={conv.id} onClick={() => loadConversation(conv.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center gap-2"
                style={conversationId === conv.id ? {
                  background: "oklch(60% 0.2 220 / 0.12)", color: "oklch(75% 0.2 220)", border: "1px solid oklch(60% 0.2 220 / 0.2)"
                } : { color: "oklch(60% 0.03 220)" }}>
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{conv.title || "New chat"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main chat */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 px-3 sm:px-5 py-3 flex-shrink-0 min-w-0"
            style={{ borderBottom: "1px solid oklch(22% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div
                className="ph-logo-frame ph-logo-frame--nav w-9 h-9 rounded-xl flex-shrink-0"
                style={{ background: "oklch(20% 0.05 220)", boxShadow: "0 0 14px oklch(60% 0.2 220 / 0.4)", border: "1px solid oklch(60% 0.2 220 / 0.3)" }}
              >
                <img src={LOGO_URL} alt="BizPilot" className="ph-logo-frame__img rounded-lg" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BizPilot</p>
                <p className="text-xs truncate" style={{ color: "oklch(55% 0.03 220)" }}>Business Advisor · AI-Powered</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:justify-end sm:flex-shrink-0">
              {messages.length >= 10 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs"
                  style={{ background: "oklch(55% 0.2 160 / 0.12)", border: "1px solid oklch(55% 0.2 160 / 0.3)", color: "oklch(70% 0.2 160)" }}>
                  <Brain className="w-3 h-3" />
                  <span className="hidden md:inline">Memory Active</span>
                </div>
              )}
              {(user as { businessName?: string })?.businessName && (
                <div className="hidden md:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs"
                  style={{ background: "oklch(60% 0.2 220 / 0.08)", border: "1px solid oklch(60% 0.2 220 / 0.2)", color: "oklch(65% 0.03 220)" }}>
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[80px] sm:max-w-[100px]">{(user as { businessName?: string }).businessName}</span>
                </div>
              )}
              {isUnlimited ? (
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "oklch(55% 0.2 160 / 0.12)", border: "1px solid oklch(55% 0.2 160 / 0.3)", color: "oklch(72% 0.18 162)" }}>
                  <span className="hidden sm:inline">Unlimited ✓</span>
                  <span className="sm:hidden">∞</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                  style={{ background: messagesLeft <= 1 && !hasPaidPlan ? "oklch(60% 0.2 30 / 0.08)" : "oklch(60% 0.2 220 / 0.08)", border: `1px solid ${messagesLeft <= 1 && !hasPaidPlan ? "oklch(60% 0.2 30 / 0.2)" : "oklch(60% 0.2 220 / 0.2)"}`, color: messagesLeft <= 1 && !hasPaidPlan ? "oklch(75% 0.2 30)" : "oklch(75% 0.2 220)" }}>
                  {messagesLeft}/{messagesLimit}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5 min-w-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div
                  className="ph-logo-frame ph-logo-frame--tile w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-3xl mb-5"
                  style={{
                    background: "oklch(18% 0.05 220)",
                    boxShadow: "0 0 30px oklch(60% 0.2 220 / 0.3), 0 0 60px oklch(60% 0.2 220 / 0.1)",
                    border: "1px solid oklch(60% 0.2 220 / 0.3)",
                  }}
                >
                  <img src={LOGO_URL} alt="BizPilot" className="ph-logo-frame__img rounded-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BizPilot</h3>
                <p className="text-sm mb-6 max-w-sm" style={{ color: "oklch(65% 0.03 220)" }}>Business strategy နဲ့ operations အတွက် AI advisor ။ မေးချင်တာ မေးလိုက်ပါ။</p>
                {isLimitReached && !hasPaidPlan ? (
                  <div className="p-4 rounded-xl text-center max-w-sm"
                    style={{ background: "oklch(60% 0.2 30 / 0.1)", border: "1px solid oklch(60% 0.2 30 / 0.3)" }}>
                    <Lock className="w-6 h-6 mx-auto mb-2" style={{ color: "oklch(75% 0.2 30)" }} />
                    <p className="text-sm font-semibold text-white mb-1">Free Trial ကုန်ပါပြီ</p>
                    <p className="text-xs mb-3" style={{ color: "oklch(65% 0.03 220)" }}>BizPilot plan ဝယ်ယူပြီး ဆက်မေးနိုင်ပါသည်</p>
                    <button onClick={() => setLocation("/app/billing")}
                      className="px-4 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                      Upgrade Plan
                    </button>
                  </div>
                ) : isLimitReached ? (
                  <div className="p-4 rounded-xl text-center max-w-sm"
                    style={{ background: "oklch(60% 0.2 30 / 0.1)", border: "1px solid oklch(60% 0.2 30 / 0.3)" }}>
                    <Lock className="w-6 h-6 mx-auto mb-2" style={{ color: "oklch(75% 0.2 30)" }} />
                    <p className="text-sm font-semibold text-white mb-1">Message limit reached</p>
                    <button onClick={() => setLocation("/app/billing")}
                      className="px-4 py-2 rounded-lg text-xs font-semibold mt-2"
                      style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                      Upgrade Plan
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                    {QUICK_PROMPTS.map((p) => (
                      <button key={p} onClick={() => { setInput(""); handleSend(p); }}
                        className="text-left px-4 py-2.5 rounded-xl text-xs transition"
                        style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(60% 0.2 220 / 0.2)", color: "oklch(70% 0.03 220)" }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg, i) => (
                <AdvisorChatMessage
                  key={i}
                  msg={msg}
                  logoUrl={LOGO_URL}
                  logoFrameStyle={{
                    background: "oklch(20% 0.05 220)",
                    boxShadow: "0 0 8px oklch(60% 0.2 220 / 0.4)",
                    border: "1px solid oklch(60% 0.2 220 / 0.25)",
                  }}
                  userBubbleStyle={{
                    background: "oklch(60% 0.2 220 / 0.15)",
                    border: "1px solid oklch(60% 0.2 220 / 0.25)",
                    color: "white",
                    borderBottomRightRadius: "4px",
                  }}
                  assistantBubbleStyle={{
                    background: "oklch(18% 0.05 220)",
                    border: "1px solid oklch(25% 0.04 220)",
                    color: "oklch(88% 0.02 220)",
                    borderBottomLeftRadius: "4px",
                  }}
                />
              ))
            )}
            {sending && (
              <div className="flex gap-3">
                <div
                  className="ph-logo-frame ph-logo-frame--nav w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: "oklch(20% 0.05 220)", boxShadow: "0 0 8px oklch(60% 0.2 220 / 0.4)", border: "1px solid oklch(60% 0.2 220 / 0.25)" }}
                >
                  <img src={LOGO_URL} alt="" className="ph-logo-frame__img rounded-md" />
                </div>
                <div className="px-4 py-3 rounded-2xl" style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((n) => (
                      <div key={n} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "oklch(60% 0.2 220)", animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 sm:px-5 py-3 sm:py-4 flex-shrink-0" style={{ borderTop: "1px solid oklch(22% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
            {isLimitReached ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl"
                style={{ background: "oklch(60% 0.2 30 / 0.08)", border: "1px solid oklch(60% 0.2 30 / 0.25)" }}>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(75% 0.2 30)" }} />
                  <span className="text-xs sm:text-sm text-white">
                    {hasPaidPlan ? "Message limit reached" : "Free trial ကုန်ပါပြီ"}
                  </span>
                </div>
                <button onClick={() => setLocation("/app/billing")}
                  className="w-full sm:w-auto px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                  Upgrade
                </button>
              </div>
            ) : (
              <AdvisorChatComposer
                value={input}
                onChange={setInput}
                onSend={(text, image) => handleSend(text, image)}
                sending={sending}
                placeholder="BizPilot ကို မေးချင်တာ ရိုက်ထည့်ပါ... (ပုံ paste လုပ်နိုင်ပါသည်)"
                accentColor="oklch(60% 0.2 220)"
                accentGlow="0 0 14px oklch(60% 0.2 220 / 0.4)"
                borderColor="oklch(60% 0.2 220 / 0.2)"
              />
            )}
          </div>
        </div>
      </div>

      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ background: "oklch(0% 0 0 / 0.7)" }}
          onClick={() => setShowLimitModal(false)}>
          <div className="w-full max-w-[calc(100vw-24px)] sm:max-w-sm p-4 sm:p-6 rounded-2xl text-center max-h-[calc(100vh-32px)] overflow-y-auto"
            style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
              style={{ background: "oklch(60% 0.2 30 / 0.12)", border: "1px solid oklch(60% 0.2 30 / 0.3)" }}>
              <Lock className="w-6 sm:w-7 h-6 sm:h-7" style={{ color: "oklch(75% 0.2 30)" }} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {hasPaidPlan ? "Message Limit Reached" : "Free Trial ကုန်ပါပြီ"}
            </h3>
            <p className="text-xs sm:text-sm mb-4 sm:mb-5" style={{ color: "oklch(65% 0.03 220)" }}>
              {hasPaidPlan
                ? "Your plan message limit has been reached. Upgrade for more messages."
                : "BizPilot free trial (2 messages) ကုန်ပါပြီ။ ဆက်မေးနိုင်ရန် BizPilot plan ဝယ်ယူပါ။"}
            </p>
            <button onClick={() => { setShowLimitModal(false); setLocation("/app/billing"); }}
              className="w-full py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm mb-2"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
              BizPilot Plan ဝယ်ယူပါ
            </button>
            <button onClick={() => setShowLimitModal(false)}
              className="w-full py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm"
              style={{ color: "oklch(55% 0.03 220)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
