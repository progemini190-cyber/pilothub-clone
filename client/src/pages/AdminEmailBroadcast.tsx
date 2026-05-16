import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { DashboardShell } from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Mail, Send, Users, User } from "lucide-react";

type RecipientMode = "all_approved" | "single";

export default function AdminEmailBroadcast() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<RecipientMode>("all_approved");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: usersData, isLoading: usersLoading } = trpc.admin.users.list.useQuery(undefined, {
    retry: false,
    onError: () => setLocation("/admin/login"),
  } as never);

  const sendMutation = trpc.admin.sendBroadcastEmail.useMutation({
    onSuccess: (result) => {
      if (result.failed === 0) {
        toast.success(`Email sent to ${result.sent} recipient(s)`);
      } else {
        toast.warning(`Sent ${result.sent} of ${result.total} (${result.failed} failed)`);
      }
      setSubject("");
      setMessage("");
    },
    onError: (err) => toast.error(err.message || "Failed to send email"),
  });

  const approvedUsers = useMemo(() => {
    const users = usersData?.users ?? [];
    return users.filter((u) => {
      const s = (u.status ?? "").toLowerCase();
      return (s === "approved" || s === "active") && Boolean(u.email?.trim());
    });
  }, [usersData]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return approvedUsers;
    return approvedUsers.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        String(u.id).includes(q),
    );
  }, [approvedUsers, userSearch]);

  const selectedUser = approvedUsers.find((u) => u.id === selectedUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    if (mode === "single" && !selectedUserId) {
      toast.error("Select a user to email");
      return;
    }
    sendMutation.mutate({
      mode,
      userId: mode === "single" ? selectedUserId! : undefined,
      subject: subject.trim(),
      message: message.trim(),
    });
  };

  const inputStyle: React.CSSProperties = {
    background: "oklch(20% 0.04 220)",
    border: "1px solid oklch(28% 0.04 220)",
    color: "oklch(90% 0.02 220)",
  };

  return (
    <DashboardShell title="Email Broadcast" activeTab="email-broadcast" isAdminShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(72% 0.18 162 / 0.12)",
              border: "1px solid oklch(72% 0.18 162 / 0.3)",
            }}
          >
            <Mail className="w-5 h-5" style={{ color: "oklch(72% 0.18 162)" }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Email Broadcast
            </h1>
            <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
              Send HTML emails from PilotHub Team to approved users
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl space-y-5"
          style={{ background: "oklch(17% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "oklch(75% 0.03 220)" }}>
              Recipients
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("all_approved");
                  setSelectedUserId(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
                style={{
                  background:
                    mode === "all_approved"
                      ? "oklch(72% 0.18 162 / 0.15)"
                      : "oklch(22% 0.05 220)",
                  color:
                    mode === "all_approved" ? "oklch(72% 0.18 162)" : "oklch(60% 0.03 220)",
                  border: `1px solid ${mode === "all_approved" ? "oklch(72% 0.18 162 / 0.4)" : "oklch(28% 0.04 220)"}`,
                }}
              >
                <Users className="w-4 h-4" />
                All Approved Users
                <span className="text-xs opacity-80">({approvedUsers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("single")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
                style={{
                  background:
                    mode === "single"
                      ? "oklch(65% 0.22 250 / 0.15)"
                      : "oklch(22% 0.05 220)",
                  color: mode === "single" ? "oklch(65% 0.22 250)" : "oklch(60% 0.03 220)",
                  border: `1px solid ${mode === "single" ? "oklch(65% 0.22 250 / 0.4)" : "oklch(28% 0.04 220)"}`,
                }}
              >
                <User className="w-4 h-4" />
                Single User
              </button>
            </div>
          </div>

          {mode === "single" && (
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "oklch(75% 0.03 220)" }}>
                Select user
              </label>
              <input
                type="search"
                placeholder="Search by email or name…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
              <select
                value={selectedUserId ?? ""}
                onChange={(e) =>
                  setSelectedUserId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
                disabled={usersLoading}
              >
                <option value="">Choose a user…</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} {u.name ? `(${u.name})` : ""}
                  </option>
                ))}
              </select>
              {selectedUser && (
                <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
                  Sending to: <strong>{selectedUser.email}</strong>
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "oklch(75% 0.03 220)" }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "oklch(75% 0.03 220)" }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
              rows={8}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-y"
              style={inputStyle}
              maxLength={20000}
              required
            />
          </div>

          <button
            type="submit"
            disabled={sendMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60"
            style={{
              background: "oklch(72% 0.18 162)",
              color: "oklch(12% 0.03 220)",
            }}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
