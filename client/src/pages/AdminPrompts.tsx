import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Save, RotateCcw, Zap, Lightbulb, CheckCircle, Clock, History } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_PROMPTS = {
  bizpilot: `You are BizPilot, an elite AI business advisor created by ChatPilot for Myanmar business operators and entrepreneurs.

## Your Role & Persona
You are a seasoned business operations expert with deep knowledge of Myanmar's business landscape, regulations, and market dynamics. You speak with authority, clarity, and practical wisdom.

## Core Expertise
- Business operations, process optimization, and execution
- Myanmar market analysis, competitive landscape, and industry trends
- Financial planning, cash flow management, and profitability analysis
- Team management, HR practices, and organizational structure
- Sales strategies, customer acquisition, and revenue growth
- Supply chain, inventory management, and vendor relations
- Digital transformation and technology adoption for Myanmar businesses
- Legal compliance, tax obligations, and regulatory requirements in Myanmar

## Communication Style
- Respond in the same language the user writes in (Myanmar/Burmese or English)
- Be direct, practical, and action-oriented
- Provide step-by-step guidance when explaining processes
- Use real Myanmar business examples and context when relevant

## Key Principles
- Prioritize execution over theory
- Consider Myanmar's unique business environment (banking, payments, logistics)
- Acknowledge resource constraints typical of Myanmar SMEs
- Provide both short-term quick wins and long-term strategic advice`,

  founderpilot: `You are FounderPilot, an elite AI strategic advisor for founders and CEOs, created by ChatPilot for Myanmar's entrepreneurial ecosystem.

## Your Role & Persona
You are a world-class strategic advisor who combines Silicon Valley startup wisdom with deep understanding of Myanmar's emerging market. You advise founders and executive teams on high-level strategic decisions.

## Core Expertise
- Startup strategy, vision setting, and company building
- Fundraising, investor relations, and pitch preparation
- Product-market fit, pivoting, and growth strategies
- Leadership development, co-founder dynamics, and team culture
- Board management and corporate governance
- M&A, partnerships, and strategic alliances
- International expansion and cross-border business in Southeast Asia
- Venture capital ecosystem in Myanmar and Southeast Asia

## Communication Style
- Respond in the same language the user writes in (Myanmar/Burmese or English)
- Think strategically and challenge assumptions
- Ask clarifying questions to understand the full context before advising
- Share mental models, frameworks, and strategic tools

## Key Principles
- Think 3-5 years ahead while addressing immediate challenges
- Balance ambition with realistic execution capacity
- Consider Myanmar's unique startup ecosystem constraints and opportunities
- Help founders make decisions with incomplete information`,
};

export default function AdminPrompts() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<"bizpilot" | "founderpilot">("bizpilot");
  const [editContent, setEditContent] = useState(DEFAULT_PROMPTS.bizpilot);
  const [promptName, setPromptName] = useState("BizPilot System Prompt");
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading, refetch } = trpc.admin.prompts.list.useQuery(undefined, {
    retry: false,
    onError: () => setLocation("/admin/login"),
  } as any);

  const savePrompt = trpc.admin.prompts.save.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Prompt saved and activated successfully!");
    },
    onError: (e) => toast.error(e.message),
  });

  const activatePrompt = trpc.admin.prompts.activate.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Prompt activated!");
    },
  });

  useEffect(() => {
    if (data?.prompts) {
      const activePrompt = (data.prompts as any[]).find(
        (p: any) => p.modelSlug === selected && p.isActive === "true"
      );
      if (activePrompt) {
        setEditContent(activePrompt.content);
        setPromptName(activePrompt.name);
      } else {
        setEditContent(DEFAULT_PROMPTS[selected]);
        setPromptName(selected === "bizpilot" ? "BizPilot System Prompt" : "FounderPilot System Prompt");
      }
    }
  }, [data, selected]);

  const advisors = [
    {
      slug: "bizpilot" as const, name: "BizPilot", icon: Zap,
      glowColor: "oklch(65% 0.22 250)", glowBg: "oklch(65% 0.22 250 / 0.12)", glowBorder: "oklch(65% 0.22 250 / 0.3)"
    },
    {
      slug: "founderpilot" as const, name: "FounderPilot", icon: Lightbulb,
      glowColor: "oklch(78% 0.12 75)", glowBg: "oklch(78% 0.12 75 / 0.12)", glowBorder: "oklch(78% 0.12 75 / 0.3)"
    },
  ];

  const current = advisors.find(a => a.slug === selected)!;
  const allPrompts = (data?.prompts as any[]) ?? [];
  const selectedPrompts = allPrompts.filter((p: any) => p.modelSlug === selected)
    .sort((a: any, b: any) => b.version - a.version);

  return (
    <DashboardShell title="System Prompt Editor" activeTab="prompts" isAdminShell>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-6 h-auto md:h-[calc(100vh-180px)]">
        {/* Left sidebar */}
        <div className="col-span-1 flex flex-col gap-3 md:max-h-[calc(100vh-200px)] md:overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: "oklch(50% 0.03 220)" }}>Advisors</p>
          {advisors.map((a) => {
            const Icon = a.icon;
            const isActive = selected === a.slug;
            const activePrompt = allPrompts.find((p: any) => p.modelSlug === a.slug && p.isActive === "true");
            return (
              <button key={a.slug} onClick={() => { setSelected(a.slug); setShowHistory(false); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition"
                style={isActive ? {
                  background: a.glowBg, border: `1px solid ${a.glowBorder}`,
                } : { background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? a.glowBg : "oklch(22% 0.05 220)", border: `1px solid ${isActive ? a.glowBorder : "oklch(28% 0.04 220)"}` }}>
                  <Icon className="w-4 h-4" style={{ color: isActive ? a.glowColor : "oklch(55% 0.03 220)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: isActive ? a.glowColor : "white" }}>{a.name}</p>
                  <p className="text-xs truncate" style={{ color: "oklch(50% 0.03 220)" }}>
                    {activePrompt ? `v${activePrompt.version} active` : "No active prompt"}
                  </p>
                </div>
              </button>
            );
          })}

          {/* History toggle */}
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition"
            style={showHistory ? {
              background: "oklch(72% 0.18 162 / 0.12)", border: "1px solid oklch(72% 0.18 162 / 0.3)", color: "oklch(72% 0.18 162)"
            } : { background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)", color: "oklch(60% 0.03 220)" }}>
            <History className="w-4 h-4" />
            Version History ({selectedPrompts.length})
          </button>

          <div className="mt-auto p-4 rounded-xl" style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(22% 0.04 220)" }}>
            <p className="text-xs font-semibold text-white mb-1">How it works</p>
            <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
              Each save creates a new version. Activate any version to make it live. New conversations use the active prompt immediately.
            </p>
          </div>
        </div>

        {/* Main editor or history */}
        <div className="col-span-1 md:col-span-3 flex flex-col rounded-2xl overflow-hidden max-h-[calc(100vh-200px)]"
          style={{ background: "oklch(16% 0.05 220)", border: `1px solid ${current.glowBorder}` }}>

          {showHistory ? (
            /* Version History */
            <>
              <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid oklch(22% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
                <p className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {current.name} — Version History
                </p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.03 220)" }}>{selectedPrompts.length} versions saved</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedPrompts.length === 0 ? (
                  <div className="text-center py-12" style={{ color: "oklch(50% 0.03 220)" }}>No versions saved yet</div>
                ) : selectedPrompts.map((p: any) => (
                  <div key={p.id} className="p-4 rounded-xl"
                    style={{ background: "oklch(18% 0.05 220)", border: `1px solid ${p.isActive === "true" ? current.glowBorder : "oklch(25% 0.04 220)"}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-white">v{p.version}</span>
                          <span className="text-xs" style={{ color: "oklch(50% 0.03 220)" }}>{p.name}</span>
                          {p.isActive === "true" && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: "oklch(72% 0.18 162 / 0.15)", color: "oklch(72% 0.18 162)" }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs line-clamp-2" style={{ color: "oklch(55% 0.03 220)" }}>{p.content.slice(0, 120)}...</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { setEditContent(p.content); setPromptName(p.name); setShowHistory(false); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                          Edit
                        </button>
                        {p.isActive !== "true" && (
                          <button onClick={() => activatePrompt.mutate({ promptId: p.id, modelSlug: p.modelSlug })}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: current.glowBg, color: current.glowColor, border: `1px solid ${current.glowBorder}` }}>
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Prompt Editor */
            <>
              <div className="px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0" style={{ borderBottom: "1px solid oklch(22% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: current.glowBg, border: `1px solid ${current.glowBorder}` }}>
                      {selected === "bizpilot"
                        ? <Zap className="w-3 sm:w-4 h-3 sm:h-4" style={{ color: current.glowColor }} />
                        : <Lightbulb className="w-3 sm:w-4 h-3 sm:h-4" style={{ color: current.glowColor }} />}
                    </div>
                    <input
                      value={promptName}
                      onChange={(e) => setPromptName(e.target.value)}
                      className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-white outline-none border-b border-transparent focus:border-current min-w-0"
                      style={{ borderColor: "oklch(30% 0.04 220)" }}
                      placeholder="Version name..."
                    />
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto flex-shrink-0">
                    <button onClick={() => setEditContent(DEFAULT_PROMPTS[selected])}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition flex-1 sm:flex-none justify-center sm:justify-start"
                      style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                      onClick={() => savePrompt.mutate({ name: promptName, modelSlug: selected, content: editContent, activate: true })}
                      disabled={savePrompt.isPending}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex-1 sm:flex-none justify-center"
                      style={{ background: current.glowColor, color: "oklch(12% 0.03 220)" }}>
                      <Save className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                      <span className="hidden sm:inline">{savePrompt.isPending ? "Saving..." : "Save & Activate"}</span>
                      <span className="sm:hidden">{savePrompt.isPending ? "..." : "Save"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 p-3 sm:p-6 text-xs sm:text-sm font-mono resize-none outline-none"
                style={{ background: "transparent", color: "oklch(85% 0.02 220)", lineHeight: "1.7" }}
                placeholder="Enter system prompt for this AI advisor..."
              />

              <div className="px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs flex-shrink-0 gap-1 sm:gap-0"
                style={{ borderTop: "1px solid oklch(22% 0.04 220)", color: "oklch(45% 0.03 220)" }}>
                <span className="truncate">{editContent.length.toLocaleString()} characters</span>
                <span className="truncate">~{Math.ceil(editContent.length / 4).toLocaleString()} tokens</span>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
