import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Search, Bot, Copy, Check, Link2, Settings2, Webhook, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  buildActivationLink,
  getTelegramBizBotUsername,
  getTelegramFounderBotUsername,
  isTelegramBotUsernameConfigured,
} from "@/lib/telegramConfig";

type TelegramUser = {
  id: number;
  email: string | null;
  name: string | null;
  telegramChatId: string | null;
  bizMessageLimit: number;
  founderMessageLimit: number;
  planTypeBiz: string;
  planTypeFounder: string;
  planExpiryDate: Date | string | null;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isExpired(value: Date | string | null | undefined) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Pick bot for activation link from user plan columns and message limits. */
function inferActivationPlanType(u: TelegramUser): "bizpilot" | "founderpilot" {
  const founderActive =
    u.planTypeFounder !== "free" || u.founderMessageLimit > 0;
  const bizActive = u.planTypeBiz !== "free" || u.bizMessageLimit > 0;
  if (founderActive && !bizActive) return "founderpilot";
  if (bizActive && !founderActive) return "bizpilot";
  if (u.founderMessageLimit > u.bizMessageLimit) return "founderpilot";
  return "bizpilot";
}

export default function AdminTelegramBots() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [manageUser, setManageUser] = useState<TelegramUser | null>(null);
  const [bizLimit, setBizLimit] = useState("");
  const [founderLimit, setFounderLimit] = useState("");
  const [addBiz, setAddBiz] = useState(false);
  const [addFounder, setAddFounder] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [linkModal, setLinkModal] = useState<{ user: TelegramUser; link: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickPlanType, setQuickPlanType] = useState<"bizpilot" | "founderpilot">("bizpilot");
  const [quickBizLimit, setQuickBizLimit] = useState("20");
  const [quickFounderLimit, setQuickFounderLimit] = useState("0");
  const [quickExpiry, setQuickExpiry] = useState(toDateInputValue(addMonths(new Date(), 1)));

  const { data: telegramSettings } = trpc.admin.telegram.getSettings.useQuery(undefined, {
    retry: 1,
  });

  const bizBotUsername =
    telegramSettings?.bizBotUsernameConfigured
      ? telegramSettings.bizBotUsername
      : getTelegramBizBotUsername();

  const founderBotUsername =
    telegramSettings?.founderBotUsername ??
    getTelegramFounderBotUsername() ??
    null;

  const botUsernameReady = isTelegramBotUsernameConfigured(bizBotUsername);
  const founderBotUsernameReady =
    telegramSettings?.founderBotUsernameConfigured ??
    (founderBotUsername ? isTelegramBotUsernameConfigured(founderBotUsername) : false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.admin.telegram.list.useQuery(undefined, {
    retry: 1,
  });

  const updatePlan = trpc.admin.telegram.updatePlan.useMutation({
    onSuccess: () => {
      refetch();
      setManageUser(null);
      toast.success("Telegram plan updated");
    },
    onError: (err) => toast.error(err.message || "Update failed"),
  });

  const syncSchema = trpc.admin.telegram.syncSchema.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Database schema synced");
    },
    onError: (err) => toast.error(err.message || "Schema sync failed"),
  });

  const setupWebhook = trpc.admin.telegram.setupWebhook.useMutation({
    onSuccess: (result) => {
      toast.success(`Webhook registered: ${result.webhookUrl}`);
    },
    onError: (err) => toast.error(err.message || "Webhook setup failed"),
  });

  const quickAddUser = trpc.admin.telegram.quickAddUser.useMutation({
    onSuccess: (result) => {
      refetch();
      setShowQuickAdd(false);
      setQuickName("");
      setQuickEmail("");
      setQuickPlanType("bizpilot");
      setQuickBizLimit("20");
      setQuickFounderLimit("0");
      setQuickExpiry(toDateInputValue(addMonths(new Date(), 1)));
      setLinkModal({
        user: {
          id: result.userId,
          email: result.email,
          name: result.name,
          telegramChatId: null,
          bizMessageLimit: parseInt(quickBizLimit, 10) || 20,
          founderMessageLimit: parseInt(quickFounderLimit, 10) || 0,
          planTypeBiz: quickPlanType === "bizpilot" ? "starter" : "free",
          planTypeFounder: quickPlanType === "founderpilot" ? "starter" : "free",
          planExpiryDate: quickExpiry,
        },
        link: result.activationLink,
        token: result.token,
      });
      toast.success(result.created ? "User created" : "Existing user updated");
    },
    onError: (err) => toast.error(err.message || "Failed to create user"),
  });

  const createToken = trpc.admin.telegram.createActivationToken.useMutation({
    onSuccess: (result, variables) => {
      const user = users.find((u) => u.id === variables.userId);
      if (!user) return;
      const planType = inferActivationPlanType(user);
      const link =
        result.activationLink || buildActivationLink(result.token, undefined, planType);
      setLinkModal({ user, link, token: result.token });
      toast.success("Activation token created");
    },
    onError: (err) => toast.error(err.message || "Failed to create token"),
  });

  const users = (data?.users ?? []) as TelegramUser[];

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          u.email?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q) ||
          String(u.id).includes(q) ||
          u.telegramChatId?.includes(q)
        );
      }),
    [users, search],
  );

  const stats = {
    total: users.length,
    linked: users.filter((u) => u.telegramChatId).length,
    active: users.filter((u) => u.telegramChatId && !isExpired(u.planExpiryDate)).length,
    expired: users.filter((u) => u.planExpiryDate && isExpired(u.planExpiryDate)).length,
  };

  const inputStyle: React.CSSProperties = {
    background: "oklch(20% 0.04 220)",
    border: "1px solid oklch(30% 0.04 220)",
    color: "white",
    borderRadius: "0.75rem",
    padding: "0.625rem 0.875rem",
    width: "100%",
    outline: "none",
    fontSize: "0.875rem",
  };

  const openManageModal = (user: TelegramUser) => {
    setManageUser(user);
    setBizLimit(String(user.bizMessageLimit ?? 0));
    setFounderLimit(String(user.founderMessageLimit ?? 0));
    setAddBiz(false);
    setAddFounder(false);
    setExpiryDate(toDateInputValue(user.planExpiryDate) || toDateInputValue(addMonths(new Date(), 1)));
  };

  const handleSavePlan = () => {
    if (!manageUser) return;
    const biz = parseInt(bizLimit, 10);
    const founder = parseInt(founderLimit, 10);
    if (Number.isNaN(biz) || biz < 0 || Number.isNaN(founder) || founder < 0) {
      toast.error("Enter valid message limits");
      return;
    }

    const payload: Parameters<typeof updatePlan.mutate>[0] = {
      userId: manageUser.id,
      planExpiryDate: expiryDate || null,
    };

    if (addBiz) payload.addBizMessages = biz;
    else payload.bizMessageLimit = biz;

    if (addFounder) payload.addFounderMessages = founder;
    else payload.founderMessageLimit = founder;

    updatePlan.mutate(payload);
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied");
    });
  };

  const openQuickAddModal = () => {
    setQuickName("");
    setQuickEmail("");
    setQuickPlanType("bizpilot");
    setQuickBizLimit("20");
    setQuickFounderLimit("0");
    setQuickExpiry(toDateInputValue(addMonths(new Date(), 1)));
    setShowQuickAdd(true);
  };

  const handleQuickAddSave = () => {
    if (!quickName.trim() || !quickEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const biz = parseInt(quickBizLimit, 10);
    const founder = parseInt(quickFounderLimit, 10);
    if (Number.isNaN(biz) || biz < 0 || Number.isNaN(founder) || founder < 0) {
      toast.error("Enter valid limits");
      return;
    }
    quickAddUser.mutate({
      name: quickName.trim(),
      email: quickEmail.trim(),
      planType: quickPlanType,
      bizMessageLimit: biz,
      founderMessageLimit: founder,
      planExpiryDate: quickExpiry || undefined,
    });
  };

  if (isError) {
    const message = error?.message ?? "Unknown error";
    const isAuth = message.toLowerCase().includes("admin") || message.toLowerCase().includes("unauthorized");
    return (
      <DashboardShell title="Telegram Bots" activeTab="telegram-bots" isAdminShell>
        <div className="p-8 rounded-2xl text-center space-y-4"
          style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
          <p className="text-white font-semibold">Could not load Telegram users</p>
          <p className="text-sm" style={{ color: "oklch(55% 0.03 220)" }}>{message}</p>
          <div className="flex gap-3 justify-center">
            {isAuth ? (
              <button
                type="button"
                onClick={() => setLocation("/admin/login")}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}
              >
                Admin Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Telegram Bots" activeTab="telegram-bots" isAdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <p className="text-sm flex-1" style={{ color: "oklch(55% 0.03 220)" }}>
            Manage Telegram users, limits, and expiry. BizPilot:{" "}
            <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "oklch(22% 0.05 220)", color: botUsernameReady ? "oklch(72% 0.18 162)" : "oklch(75% 0.18 25)" }}>
              @{bizBotUsername}
            </code>
            {botUsernameReady ? (
              <> (<code className="text-xs">NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code>)</>
            ) : (
              <> — set <code className="text-xs">NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code></>
            )}
            . FounderPilot:{" "}
            <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "oklch(22% 0.05 220)", color: founderBotUsernameReady ? "oklch(78% 0.12 75)" : "oklch(75% 0.18 25)" }}>
              @{founderBotUsername ?? "—"}
            </code>
            {founderBotUsernameReady ? (
              <> (<code className="text-xs">NEXT_PUBLIC_TELEGRAM_FOUNDERPILOT_USERNAME</code>)</>
            ) : (
              <> — set <code className="text-xs">NEXT_PUBLIC_TELEGRAM_FOUNDERPILOT_USERNAME</code></>
            )}
            . Tokens: <code>TELEGRAM_BIZPILOT_TOKEN</code>, <code>TELEGRAM_FOUNDERPILOT_TOKEN</code>, <code>PUBLIC_APP_URL</code>.
          </p>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={openQuickAddModal}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: "oklch(72% 0.18 162)",
                color: "oklch(12% 0.03 220)",
              }}
            >
              <UserPlus className="w-4 h-4" />
              Quick Add User
            </button>
            <button
              type="button"
              onClick={() => syncSchema.mutate()}
              disabled={syncSchema.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: "oklch(22% 0.05 220)",
                color: "oklch(65% 0.03 220)",
                border: "1px solid oklch(28% 0.04 220)",
              }}
            >
              {syncSchema.isPending ? "Syncing…" : "Sync Schema"}
            </button>
            <button
              type="button"
              onClick={() => setupWebhook.mutate({ advisor: "bizpilot" })}
              disabled={setupWebhook.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: "oklch(65% 0.22 250 / 0.12)",
                color: "oklch(65% 0.22 250)",
                border: "1px solid oklch(65% 0.22 250 / 0.3)",
              }}
            >
              <Webhook className="w-4 h-4" />
              {setupWebhook.isPending ? "Setting up…" : "Setup BizPilot"}
            </button>
            <button
              type="button"
              onClick={() => setupWebhook.mutate({ advisor: "founderpilot" })}
              disabled={setupWebhook.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: "oklch(78% 0.12 75 / 0.12)",
                color: "oklch(78% 0.12 75)",
                border: "1px solid oklch(78% 0.12 75 / 0.3)",
              }}
            >
              <Webhook className="w-4 h-4" />
              {setupWebhook.isPending ? "Setting up…" : "Setup FounderPilot"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: "Total Users", value: stats.total, color: "oklch(72% 0.18 162)" },
            { label: "Telegram Linked", value: stats.linked, color: "oklch(65% 0.22 250)" },
            { label: "Active Plans", value: stats.active, color: "oklch(78% 0.12 75)" },
            { label: "Expired", value: stats.expired, color: "oklch(75% 0.18 25)" },
          ].map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-2xl"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}
            >
              <p className="text-xs mb-1" style={{ color: "oklch(55% 0.03 220)" }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(50% 0.03 220)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, or Telegram chat ID..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(28% 0.04 220)", color: "white" }}
          />
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(25% 0.04 220)" }}>
          {isLoading ? (
            <div className="p-12 text-center" style={{ color: "oklch(55% 0.03 220)" }}>
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "oklch(55% 0.03 220)" }}>
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-white mb-1">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: "oklch(15% 0.04 220)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
                  <tr>
                    {["Email", "Telegram", "Biz Limit", "Founder Limit", "Expiry", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "oklch(55% 0.03 220)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const linked = Boolean(u.telegramChatId);
                    const expired = isExpired(u.planExpiryDate);
                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: "1px solid oklch(22% 0.04 220)",
                          background: i % 2 === 0 ? "oklch(18% 0.05 220)" : "oklch(16% 0.04 220)",
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{u.email || "—"}</p>
                          {u.name && (
                            <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>{u.name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {linked ? (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                background: "oklch(72% 0.18 162 / 0.12)",
                                color: "oklch(72% 0.18 162)",
                                border: "1px solid oklch(72% 0.18 162 / 0.25)",
                              }}
                            >
                              Linked
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                background: "oklch(55% 0.03 220 / 0.12)",
                                color: "oklch(55% 0.03 220)",
                                border: "1px solid oklch(30% 0.04 220)",
                              }}
                            >
                              Not linked
                            </span>
                          )}
                          {linked && u.telegramChatId && (
                            <p className="text-xs mt-1 font-mono" style={{ color: "oklch(50% 0.03 220)" }}>
                              {u.telegramChatId}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: "oklch(65% 0.22 250)" }}>
                          {u.bizMessageLimit}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: "oklch(78% 0.12 75)" }}>
                          {u.founderMessageLimit}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-sm"
                            style={{ color: expired ? "oklch(75% 0.18 25)" : "oklch(65% 0.03 220)" }}
                          >
                            {formatDate(u.planExpiryDate)}
                          </span>
                          {expired && (
                            <span className="block text-xs" style={{ color: "oklch(75% 0.18 25)" }}>
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => openManageModal(u)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                              style={{
                                background: "oklch(65% 0.22 250 / 0.12)",
                                color: "oklch(65% 0.22 250)",
                                border: "1px solid oklch(65% 0.22 250 / 0.3)",
                              }}
                            >
                              <Settings2 className="w-3 h-3" />
                              Manage Plan
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                createToken.mutate({
                                  userId: u.id,
                                  planType: inferActivationPlanType(u),
                                })
                              }
                              disabled={createToken.isPending}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                              style={{
                                background: "oklch(72% 0.18 162 / 0.12)",
                                color: "oklch(72% 0.18 162)",
                                border: "1px solid oklch(72% 0.18 162 / 0.25)",
                              }}
                            >
                              <Link2 className="w-3 h-3" />
                              Create Activation Token
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showQuickAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0% 0 0 / 0.7)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickAdd(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-5"
            style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
          >
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Quick Add User
              </h2>
              <p className="text-xs mt-1" style={{ color: "oklch(55% 0.03 220)" }}>
                Creates a shadow account (no Google login) and generates a Telegram activation link.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>Name *</label>
                <input value={quickName} onChange={(e) => setQuickName(e.target.value)} placeholder="Customer name" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>Email *</label>
                <input type="email" value={quickEmail} onChange={(e) => setQuickEmail(e.target.value)} placeholder="user@example.com" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>Primary plan</label>
                <select
                  value={quickPlanType}
                  onChange={(e) => {
                    const p = e.target.value as "bizpilot" | "founderpilot";
                    setQuickPlanType(p);
                    if (p === "bizpilot") {
                      setQuickBizLimit("20");
                      setQuickFounderLimit("0");
                    } else {
                      setQuickBizLimit("0");
                      setQuickFounderLimit("20");
                    }
                  }}
                  style={inputStyle}
                >
                  <option value="bizpilot">BizPilot</option>
                  <option value="founderpilot">FounderPilot</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(65% 0.22 250)" }}>Biz limit</label>
                  <input type="number" min={0} value={quickBizLimit} onChange={(e) => setQuickBizLimit(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(78% 0.12 75)" }}>Founder limit</label>
                  <input type="number" min={0} value={quickFounderLimit} onChange={(e) => setQuickFounderLimit(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: "oklch(65% 0.03 220)" }}>Expiry</label>
                  <button type="button" onClick={() => setQuickExpiry(toDateInputValue(addMonths(new Date(), 1)))} className="text-xs underline" style={{ color: "oklch(72% 0.18 162)" }}>+1 month</button>
                </div>
                <input type="date" value={quickExpiry} onChange={(e) => setQuickExpiry(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowQuickAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>Cancel</button>
              <button type="button" onClick={handleQuickAddSave} disabled={quickAddUser.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)", opacity: quickAddUser.isPending ? 0.7 : 1 }}>
                {quickAddUser.isPending ? "Saving…" : "Save & Get Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {manageUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0% 0 0 / 0.7)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setManageUser(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-5"
            style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
          >
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Manage Telegram Plan
              </h2>
              <p className="text-xs mt-1" style={{ color: "oklch(55% 0.03 220)" }}>
                {manageUser.email || `User #${manageUser.id}`}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: "oklch(65% 0.22 250)" }}>
                    BizPilot messages
                  </label>
                  <label className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
                    <input type="checkbox" checked={addBiz} onChange={(e) => setAddBiz(e.target.checked)} />
                    Add to current
                  </label>
                </div>
                <input
                  type="number"
                  min={0}
                  value={bizLimit}
                  onChange={(e) => setBizLimit(e.target.value)}
                  placeholder="e.g. 20"
                  style={inputStyle}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: "oklch(78% 0.12 75)" }}>
                    FounderPilot messages
                  </label>
                  <label className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
                    <input type="checkbox" checked={addFounder} onChange={(e) => setAddFounder(e.target.checked)} />
                    Add to current
                  </label>
                </div>
                <input
                  type="number"
                  min={0}
                  value={founderLimit}
                  onChange={(e) => setFounderLimit(e.target.value)}
                  placeholder="e.g. 20"
                  style={inputStyle}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: "oklch(65% 0.03 220)" }}>
                    Plan expiry date
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpiryDate(toDateInputValue(addMonths(new Date(), 1)))}
                    className="text-xs font-semibold underline"
                    style={{ color: "oklch(72% 0.18 162)" }}
                  >
                    +1 month
                  </button>
                </div>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setManageUser(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "oklch(22% 0.05 220)",
                  color: "oklch(65% 0.03 220)",
                  border: "1px solid oklch(28% 0.04 220)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={updatePlan.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "oklch(72% 0.18 162)",
                  color: "oklch(12% 0.03 220)",
                  opacity: updatePlan.isPending ? 0.7 : 1,
                }}
              >
                {updatePlan.isPending ? "Saving..." : "Save Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {linkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0% 0 0 / 0.7)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLinkModal(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
          >
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Activation Link
              </h2>
              <p className="text-xs mt-1" style={{ color: "oklch(55% 0.03 220)" }}>
                {linkModal.user.email || `User #${linkModal.user.id}`}
              </p>
            </div>

            <div
              className="p-3 rounded-xl text-xs font-mono break-all"
              style={{ background: "oklch(14% 0.04 220)", border: "1px solid oklch(25% 0.04 220)", color: "oklch(72% 0.18 162)" }}
            >
              {linkModal.link}
            </div>

            <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
              Token: <code>{linkModal.token}</code>
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => copyLink(linkModal.link)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  background: "oklch(72% 0.18 162)",
                  color: "oklch(12% 0.03 220)",
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                type="button"
                onClick={() => setLinkModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "oklch(22% 0.05 220)",
                  color: "oklch(65% 0.03 220)",
                  border: "1px solid oklch(28% 0.04 220)",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
