import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Search, Users, Plus, Copy, Check, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const PLAN_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  bizpilot:     { text: "oklch(65% 0.22 250)", bg: "oklch(65% 0.22 250 / 0.12)", border: "oklch(65% 0.22 250 / 0.3)" },
  founderpilot: { text: "oklch(78% 0.12 75)",  bg: "oklch(78% 0.12 75 / 0.12)",  border: "oklch(78% 0.12 75 / 0.3)" },
};

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showGenModal, setShowGenModal] = useState(false);
  const [genName, setGenName] = useState("");
  const [genEmail, setGenEmail] = useState("");
  const [genPlan, setGenPlan] = useState<"bizpilot" | "founderpilot" | "">("");
  const [generatedUser, setGeneratedUser] = useState<null | {
    userId: number; openId: string; name: string; email: string;
    plan: string | null; generatedPassword: string;
  }>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, refetch } = trpc.admin.users.list.useQuery(undefined, {
    retry: false,
    onError: () => setLocation("/admin/login"),
  } as any);

  const updateRole = trpc.admin.users.updateRole.useMutation({
    onSuccess: () => { refetch(); toast.success("Role updated"); },
  });

  const updateSub = trpc.admin.users.updateSubscription.useMutation({
    onSuccess: () => { refetch(); toast.success("Subscription updated"); },
  });

  const generateUser = trpc.admin.users.generate.useMutation({
    onSuccess: (result) => {
      setGeneratedUser(result as any);
      refetch();
      toast.success("User generated successfully!");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to generate user"),
  });

  const deleteUser = trpc.admin.users.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("User deleted"); },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to delete user"),
  });

  const users = (data?.users ?? []) as Array<{
    id: number; name?: string | null; email?: string | null; role: string;
    createdAt: Date; plan?: string | null; status?: string | null;
    loginMethod?: string | null;
  }>;
  const filtered = users.filter((u) =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    regular: users.filter(u => u.role === "user").length,
    bizpilot: users.filter(u => u.plan === "bizpilot" && u.status === "active").length,
    founderpilot: users.filter(u => u.plan === "founderpilot" && u.status === "active").length,
  };

  const handleGenerate = () => {
    if (!genName.trim() || !genEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    generateUser.mutate({
      name: genName.trim(),
      email: genEmail.trim(),
      plan: genPlan || undefined,
    });
  };

  const copyCredentials = () => {
    if (!generatedUser) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `PilotHub Account\nName: ${generatedUser.name}\nEmail: ${generatedUser.email}\nPassword: ${generatedUser.generatedPassword}\nPlan: ${generatedUser.plan || "None"}\nLogin: ${origin || "(your site URL)"}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Credentials copied!");
    });
  };

  const inputStyle = {
    background: "oklch(20% 0.04 220)",
    border: "1px solid oklch(30% 0.04 220)",
    color: "white",
    borderRadius: "0.75rem",
    padding: "0.625rem 0.875rem",
    width: "100%",
    outline: "none",
    fontSize: "0.875rem",
  };

  return (
    <DashboardShell title="User Management" activeTab="users" isAdminShell>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
          {[
            { label: "Total Users", value: stats.total, color: "oklch(72% 0.18 162)" },
            { label: "Regular", value: stats.regular, color: "oklch(65% 0.03 220)" },
            { label: "Admins", value: stats.admins, color: "oklch(75% 0.18 25)" },
            { label: "BizPilot Active", value: stats.bizpilot, color: "oklch(65% 0.22 250)" },
            { label: "FounderPilot Active", value: stats.founderpilot, color: "oklch(78% 0.12 75)" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
              <p className="text-xs mb-1" style={{ color: "oklch(55% 0.03 220)" }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Generate button */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(50% 0.03 220)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(28% 0.04 220)", color: "white" }} />
          </div>
          <button onClick={() => { setShowGenModal(true); setGeneratedUser(null); setGenName(""); setGenEmail(""); setGenPlan(""); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition"
            style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
            <UserPlus className="w-4 h-4" />
            Generate User
          </button>
        </div>

        {/* User Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(25% 0.04 220)" }}>
          {isLoading ? (
            <div className="p-12 text-center" style={{ color: "oklch(55% 0.03 220)" }}>Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "oklch(55% 0.03 220)" }}>
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-white mb-1">No users found</p>
              <p className="text-sm">Users will appear here once they sign up or are generated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: "oklch(15% 0.04 220)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
                  <tr>
                    {["ID", "Name", "Email", "Role", "Plan", "Joined", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "oklch(55% 0.03 220)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                        const planColor = u.plan ? PLAN_COLORS[u.plan] : null;
                        return (
                          <tr key={u.id}
                        style={{ borderBottom: "1px solid oklch(22% 0.04 220)", background: i % 2 === 0 ? "oklch(18% 0.05 220)" : "oklch(16% 0.04 220)" }}>
                        <td className="px-4 py-3 text-sm font-mono" style={{ color: "oklch(55% 0.03 220)" }}>#{u.id}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">{u.name || "—"}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "oklch(65% 0.03 220)" }}>{u.email || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={u.role === "admin" ? {
                              background: "oklch(75% 0.18 25 / 0.15)", color: "oklch(75% 0.18 25)", border: "1px solid oklch(75% 0.18 25 / 0.3)"
                            } : {
                              background: "oklch(72% 0.18 162 / 0.12)", color: "oklch(72% 0.18 162)", border: "1px solid oklch(72% 0.18 162 / 0.25)"
                            }}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.plan && planColor ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                              style={{ background: planColor.bg, color: planColor.text, border: `1px solid ${planColor.border}` }}>
                              {u.plan}
                              {u.status === "active" ? " ✓" : " (inactive)"}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "oklch(40% 0.03 220)" }}>No plan</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              onClick={() => updateRole.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                              className="px-2 py-1 rounded-lg text-xs font-semibold transition"
                              style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                              {u.role === "admin" ? "Demote" : "Make Admin"}
                            </button>
                            {/* Plan toggle */}
                            <select
                              value={u.plan || ""}
                              onChange={(e) => {
                                const plan = e.target.value;
                                if (plan) updateSub.mutate({ userId: u.id, plan, status: "active" });
                                else updateSub.mutate({ userId: u.id, plan: "", status: "inactive" });
                              }}
                              className="px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)", outline: "none" }}>
                              <option value="">No Plan</option>
                              <option value="bizpilot">BizPilot</option>
                              <option value="founderpilot">FounderPilot</option>
                            </select>
                            <button
                              onClick={() => {
                                if (confirm(`Delete user ${u.name || u.email}?`))
                                  deleteUser.mutate({ userId: u.id });
                              }}
                              className="px-2 py-1 rounded-lg text-xs font-semibold transition"
                              style={{ background: "oklch(60% 0.22 25 / 0.12)", color: "oklch(75% 0.18 25)", border: "1px solid oklch(60% 0.22 25 / 0.25)" }}>
                              <Trash2 className="w-3 h-3" />
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

      {/* Generate User Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0% 0 0 / 0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGenModal(false); }}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6 space-y-5"
            style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}>

            {!generatedUser ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(72% 0.18 162 / 0.15)" }}>
                    <UserPlus className="w-5 h-5" style={{ color: "oklch(72% 0.18 162)" }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Generate User Account</h2>
                    <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>Auto-generate credentials for a new user</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>Full Name *</label>
                    <input value={genName} onChange={e => setGenName(e.target.value)}
                      placeholder="Ko Aung Kyaw" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>Email Address *</label>
                    <input value={genEmail} onChange={e => setGenEmail(e.target.value)}
                      type="email" placeholder="user@example.com" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>Assign Plan (Optional)</label>
                    <select value={genPlan} onChange={e => setGenPlan(e.target.value as any)}
                      style={inputStyle}>
                      <option value="">No Plan</option>
                      <option value="bizpilot">BizPilot — ၁၀၀,၀၀၀ ကျပ်/လ</option>
                      <option value="founderpilot">FounderPilot — ၃၀၀,၀၀၀ ကျပ်/လ</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowGenModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                    Cancel
                  </button>
                  <button onClick={handleGenerate} disabled={generateUser.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)", opacity: generateUser.isPending ? 0.7 : 1 }}>
                    <Plus className="w-4 h-4" />
                    {generateUser.isPending ? "Generating..." : "Generate Account"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(72% 0.18 162 / 0.15)" }}>
                    <Check className="w-5 h-5" style={{ color: "oklch(72% 0.18 162)" }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Account Generated!</h2>
                    <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>Share these credentials with the user</p>
                  </div>
                </div>

                <div className="rounded-xl p-4 space-y-2"
                  style={{ background: "oklch(14% 0.04 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                  {[
                    { label: "Name", value: generatedUser.name },
                    { label: "Email", value: generatedUser.email },
                    { label: "Password", value: generatedUser.generatedPassword, mono: true },
                    { label: "Plan", value: generatedUser.plan || "None" },
                    { label: "User ID", value: `#${generatedUser.userId}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>{row.label}</span>
                      <span className={`text-sm font-semibold text-white ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl text-xs"
                  style={{ background: "oklch(55% 0.14 75 / 0.1)", border: "1px solid oklch(55% 0.14 75 / 0.25)", color: "oklch(78% 0.12 75)" }}>
                  ⚠ User signs in with Google (Continue with Google). Share the generated password only if you use a separate password flow for them.
                </div>

                <div className="flex gap-3">
                  <button onClick={copyCredentials}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Credentials"}
                  </button>
                  <button onClick={() => { setShowGenModal(false); setGeneratedUser(null); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
