import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Eye, EyeOff, Loader2, Info, CheckCircle, AlertTriangle, AlertOctagon } from "lucide-react";

const TYPE_CONFIG = {
  info: { label: "Info", icon: Info, color: "oklch(65% 0.22 250)", bg: "oklch(65% 0.22 250 / 0.1)", border: "oklch(65% 0.22 250 / 0.3)" },
  success: { label: "Success", icon: CheckCircle, color: "oklch(72% 0.18 162)", bg: "oklch(72% 0.18 162 / 0.1)", border: "oklch(72% 0.18 162 / 0.3)" },
  warning: { label: "Warning", icon: AlertTriangle, color: "oklch(78% 0.14 75)", bg: "oklch(78% 0.14 75 / 0.1)", border: "oklch(78% 0.14 75 / 0.3)" },
  urgent: { label: "Urgent", icon: AlertOctagon, color: "oklch(70% 0.22 25)", bg: "oklch(70% 0.22 25 / 0.1)", border: "oklch(70% 0.22 25 / 0.3)" },
};

export default function AdminAnnouncements() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "urgent">("info");

  const { data, isLoading, refetch } = trpc.admin.announcements.list.useQuery();

  const createMutation = trpc.admin.announcements.create.useMutation({
    onSuccess: () => {
      toast.success("Announcement created!");
      setTitle(""); setContent(""); setType("info"); setShowForm(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.admin.announcements.toggle.useMutation({
    onSuccess: () => { toast.success("Updated!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.announcements.delete.useMutation({
    onSuccess: () => { toast.success("Deleted!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate({ title, content, type });
  };

  return (
    <DashboardShell activeTab="announcements" isAdminShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(65% 0.22 250 / 0.12)", border: "1px solid oklch(65% 0.22 250 / 0.3)" }}>
              <Megaphone className="w-5 h-5" style={{ color: "oklch(65% 0.22 250)" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Broadcast Announcements</h1>
              <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>User dashboard တွင် ပြသမည့် ကြေငြာချက်များ</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
            style={{ background: "oklch(65% 0.22 250 / 0.12)", color: "oklch(65% 0.22 250)", border: "1px solid oklch(65% 0.22 250 / 0.3)" }}>
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="p-5 rounded-2xl space-y-4"
            style={{ background: "oklch(17% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}>
            <h2 className="text-sm font-semibold text-white">Create Announcement</h2>

            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(TYPE_CONFIG) as [string, typeof TYPE_CONFIG["info"]][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={key} type="button"
                    onClick={() => setType(key as any)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    style={type === key ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` } : { background: "oklch(22% 0.05 220)", color: "oklch(55% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Title (e.g. System Maintenance Notice)"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white"
              style={{ background: "oklch(22% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
              required />

            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Announcement content..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white resize-none"
              style={{ background: "oklch(22% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
              required />

            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create & Broadcast
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm transition"
                style={{ color: "oklch(55% 0.03 220)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Announcements List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(65% 0.22 250)" }} />
          </div>
        ) : !data?.announcements?.length ? (
          <div className="text-center py-16"
            style={{ background: "oklch(17% 0.05 220)", border: "1px solid oklch(28% 0.04 220)", borderRadius: "16px" }}>
            <Megaphone className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(35% 0.03 220)" }} />
            <p className="text-sm font-medium text-white mb-1">No announcements yet</p>
            <p className="text-xs" style={{ color: "oklch(45% 0.03 220)" }}>Create one to broadcast to all users</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.announcements.map((ann: any) => {
              const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
              const Icon = cfg.icon;
              const isActive = ann.isActive === "true";
              return (
                <div key={ann.id} className="p-4 rounded-2xl transition"
                  style={{
                    background: isActive ? "oklch(17% 0.05 220)" : "oklch(14% 0.03 220)",
                    border: `1px solid ${isActive ? cfg.border : "oklch(22% 0.04 220)"}`,
                    opacity: isActive ? 1 : 0.6,
                  }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-white truncate">{ann.title}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {cfg.label}
                          </span>
                          {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "oklch(72% 0.18 162 / 0.12)", color: "oklch(72% 0.18 162)", border: "1px solid oklch(72% 0.18 162 / 0.3)" }}>
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "oklch(65% 0.03 220)" }}>{ann.content}</p>
                        <p className="text-xs mt-2" style={{ color: "oklch(40% 0.03 220)" }}>
                          {new Date(ann.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleMutation.mutate({ id: ann.id, isActive: isActive ? "false" : "true" })}
                        disabled={toggleMutation.isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                        title={isActive ? "Hide" : "Show"}
                        style={{ background: "oklch(22% 0.05 220)", border: "1px solid oklch(28% 0.04 220)", color: isActive ? "oklch(72% 0.18 162)" : "oklch(45% 0.03 220)" }}>
                        {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this announcement?")) deleteMutation.mutate({ id: ann.id }); }}
                        disabled={deleteMutation.isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                        title="Delete"
                        style={{ background: "oklch(22% 0.05 220)", border: "1px solid oklch(28% 0.04 220)", color: "oklch(65% 0.22 25)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
