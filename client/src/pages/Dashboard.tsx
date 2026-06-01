import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useLocation } from "wouter";
import { Zap, Lightbulb, MessageSquare, TrendingUp, Calendar, X, Info, CheckCircle, AlertTriangle, AlertOctagon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const ANNOUNCEMENT_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  urgent: AlertOctagon,
};
const ANNOUNCEMENT_COLORS = {
  info: { color: "oklch(65% 0.22 250)", bg: "oklch(65% 0.22 250 / 0.08)", border: "oklch(65% 0.22 250 / 0.3)" },
  success: { color: "oklch(72% 0.18 162)", bg: "oklch(72% 0.18 162 / 0.08)", border: "oklch(72% 0.18 162 / 0.3)" },
  warning: { color: "oklch(78% 0.14 75)", bg: "oklch(78% 0.14 75 / 0.08)", border: "oklch(78% 0.14 75 / 0.3)" },
  urgent: { color: "oklch(70% 0.22 25)", bg: "oklch(70% 0.22 25 / 0.1)", border: "oklch(70% 0.22 25 / 0.4)" },
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  const usageQuery = trpc.ai.messageUsage.useQuery(undefined, { enabled: !!user });
  const bizConvsQuery = trpc.ai.conversations.list.useQuery({ modelSlug: "bizpilot" }, { enabled: !!user });
  const founderConvsQuery = trpc.ai.conversations.list.useQuery({ modelSlug: "founderpilot" }, { enabled: !!user });
  const announcementsQuery = trpc.announcements.list.useQuery();

  const totalConversations = (bizConvsQuery.data?.conversations?.length ?? 0) + (founderConvsQuery.data?.conversations?.length ?? 0);
  const currentPlan = user?.plan ?? "free";
  const memberSince = user ? new Date().toLocaleDateString() : "—";
  // Real per-advisor usage. Free-trial caps: BizPilot = 2, FounderPilot = 0 (no free trial).
  const bizUsage = usageQuery.data?.biz;
  const founderUsage = usageQuery.data?.founder;
  const bizLimit = bizUsage?.limit ?? 2;
  const founderLimit = founderUsage?.limit ?? 0;
  const freeBizLeft = Math.max(0, bizLimit - (bizUsage?.used ?? 0));
  const freeFounderLeft = Math.max(0, founderLimit - (founderUsage?.used ?? 0));
  const isFree = !user?.plan || user.plan === "free";

  const activeAnnouncements = (announcementsQuery.data?.announcements ?? []).filter(
    (a: any) => !dismissedIds.includes(a.id)
  );

  // Determine plan order: purchased plan goes first
  const hasBizPlan = currentPlan === "bizpilot";
  const hasFounderPlan = currentPlan === "founderpilot";

  const BizPilotCard = (
    <div key="bizpilot" className="p-5 sm:p-6 rounded-2xl cursor-pointer transition group relative"
      style={{
        background: hasBizPlan ? "oklch(16% 0.06 220)" : "oklch(16% 0.05 220)",
        border: hasBizPlan ? "1px solid oklch(60% 0.2 220 / 0.5)" : "1px solid oklch(25% 0.04 220)",
        boxShadow: hasBizPlan ? "0 0 24px oklch(60% 0.2 220 / 0.12)" : "none",
      }}
      onClick={() => setLocation("/app/bizpilot")}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "oklch(60% 0.2 220 / 0.5)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = hasBizPlan ? "oklch(60% 0.2 220 / 0.5)" : "oklch(25% 0.04 220)")}>
      {hasBizPlan && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "oklch(60% 0.2 220 / 0.15)", color: "oklch(75% 0.2 220)", border: "1px solid oklch(60% 0.2 220 / 0.35)" }}>
          ✓ ACTIVE PLAN
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(60% 0.2 220 / 0.15)", boxShadow: "0 0 16px oklch(60% 0.2 220 / 0.3)", border: "1px solid oklch(60% 0.2 220 / 0.3)" }}>
          <Zap className="w-6 h-6" style={{ color: "oklch(75% 0.2 220)" }} />
        </div>
        {!hasBizPlan && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "oklch(60% 0.2 220 / 0.12)", color: "oklch(75% 0.2 220)", border: "1px solid oklch(60% 0.2 220 / 0.25)" }}>
            BUSINESS
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BizPilot</h3>
      <p className="text-sm mb-4" style={{ color: "oklch(65% 0.03 220)" }}>
        Your business strategy expert. Get actionable advice on operations, growth, and optimization.
      </p>
      <ul className="space-y-1.5 text-sm mb-5" style={{ color: "oklch(65% 0.03 220)" }}>
        {["Business strategy and planning", "Operations optimization", "Growth tactics and scaling"].map(item => (
          <li key={item} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "oklch(60% 0.2 220)" }} />
            {item}
          </li>
        ))}
      </ul>
      {isFree && (
        <p className="text-xs mb-3" style={{ color: freeBizLeft <= 3 ? "oklch(75% 0.2 30)" : "oklch(60% 0.2 220)" }}>
          {freeBizLeft} free messages remaining
        </p>
      )}
      <button className="w-full py-2.5 rounded-xl text-sm font-semibold transition"
        style={{ background: "oklch(60% 0.2 220)", color: "white" }}>
        {hasBizPlan ? "Continue with BizPilot →" : "Start Chatting with BizPilot"}
      </button>
    </div>
  );

  const FounderPilotCard = (
    <div key="founderpilot" className="p-5 sm:p-6 rounded-2xl cursor-pointer transition relative"
      style={{
        background: hasFounderPlan ? "oklch(16% 0.06 220)" : "oklch(16% 0.05 220)",
        border: hasFounderPlan ? "1px solid oklch(75% 0.18 55 / 0.5)" : "1px solid oklch(25% 0.04 220)",
        boxShadow: hasFounderPlan ? "0 0 24px oklch(75% 0.18 55 / 0.12)" : "none",
      }}
      onClick={() => setLocation("/app/founderpilot")}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "oklch(75% 0.18 55 / 0.5)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = hasFounderPlan ? "oklch(75% 0.18 55 / 0.5)" : "oklch(25% 0.04 220)")}>
      {hasFounderPlan && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "oklch(75% 0.18 55 / 0.15)", color: "oklch(80% 0.18 55)", border: "1px solid oklch(75% 0.18 55 / 0.35)" }}>
          ✓ ACTIVE PLAN
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(75% 0.18 55 / 0.15)", boxShadow: "0 0 16px oklch(75% 0.18 55 / 0.3)", border: "1px solid oklch(75% 0.18 55 / 0.3)" }}>
          <Lightbulb className="w-6 h-6" style={{ color: "oklch(80% 0.18 55)" }} />
        </div>
        {!hasFounderPlan && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "oklch(75% 0.18 55 / 0.12)", color: "oklch(80% 0.18 55)", border: "1px solid oklch(75% 0.18 55 / 0.25)" }}>
            FOUNDER
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FounderPilot</h3>
      <p className="text-sm mb-4" style={{ color: "oklch(65% 0.03 220)" }}>
        Your founder's companion. Get strategic guidance on vision, team building, and fundraising.
      </p>
      <ul className="space-y-1.5 text-sm mb-5" style={{ color: "oklch(65% 0.03 220)" }}>
        {["Founder strategy and vision", "Team building and culture", "Fundraising and investor relations"].map(item => (
          <li key={item} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "oklch(75% 0.18 55)" }} />
            {item}
          </li>
        ))}
      </ul>
      {isFree && (
        <p className="text-xs mb-3" style={{ color: "oklch(75% 0.2 30)" }}>
          {founderLimit === 0 ? "Paid plan required — no free trial" : `${freeFounderLeft} free messages remaining`}
        </p>
      )}
      <button className="w-full py-2.5 rounded-xl text-sm font-semibold transition"
        style={{ background: "oklch(75% 0.18 55)", color: "oklch(12% 0.03 220)" }}>
        {hasFounderPlan ? "Continue with FounderPilot →" : "Start Chatting with FounderPilot"}
      </button>
    </div>
  );

  // Purchased plan goes first
  const advisorCards = hasFounderPlan
    ? [FounderPilotCard, BizPilotCard]
    : [BizPilotCard, FounderPilotCard];

  return (
    <DashboardShell title="Dashboard" activeTab="dashboard">
      <div className="space-y-6">
        {/* Announcements banners */}
        {activeAnnouncements.map((ann: any) => {
          const cfg = ANNOUNCEMENT_COLORS[ann.type as keyof typeof ANNOUNCEMENT_COLORS] || ANNOUNCEMENT_COLORS.info;
          const Icon = ANNOUNCEMENT_ICONS[ann.type as keyof typeof ANNOUNCEMENT_ICONS] || Info;
          return (
            <div key={ann.id} className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: cfg.color }}>{ann.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(75% 0.02 220)" }}>{ann.content}</p>
              </div>
              <button onClick={() => setDismissedIds(prev => [...prev, ann.id])}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition"
                style={{ color: "oklch(50% 0.03 220)" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Welcome banner */}
        <div className="rounded-2xl p-6"
          style={{ background: "linear-gradient(135deg, oklch(72% 0.18 162 / 0.08) 0%, oklch(60% 0.2 220 / 0.06) 100%)", border: "1px solid oklch(72% 0.18 162 / 0.2)" }}>
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome to PilotHub{user?.name ? `, ${user.name}` : ""}!
          </h2>
          <p style={{ color: "oklch(70% 0.03 220)" }}>
            Your AI-powered business advisors are ready to help. Choose an advisor below to get started.
          </p>
          {isFree && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
              <span style={{ color: "oklch(65% 0.2 220)" }}>BizPilot: {freeBizLeft}/{bizLimit} free messages</span>
              <span style={{ color: "oklch(75% 0.18 55)" }}>
                {founderLimit === 0 ? "FounderPilot: Paid plan required" : `FounderPilot: ${freeFounderLeft}/${founderLimit} free messages`}
              </span>
            </div>
          )}
        </div>

        {/* Advisors Grid — purchased plan first */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {advisorCards}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { label: "Total Conversations", value: totalConversations, icon: <MessageSquare className="w-6 h-6" />, color: "oklch(72% 0.18 162)" },
            { label: "Current Plan", value: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1), icon: <TrendingUp className="w-6 h-6" />, color: "oklch(60% 0.2 220)" },
            { label: "Member Since", value: memberSince, icon: <Calendar className="w-6 h-6" />, color: "oklch(75% 0.18 55)" },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl"
              style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(22% 0.04 220)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>{stat.label}</p>
                <span style={{ color: `${stat.color} / 0.4` }}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
