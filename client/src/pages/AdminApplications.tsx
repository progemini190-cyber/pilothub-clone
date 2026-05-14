import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, Users } from "lucide-react";

const ADMIN_SHELL_STYLE = {
  background: "oklch(12% 0.03 220)",
  minHeight: "100vh",
  color: "white",
};

const NAV_LINKS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/models", label: "AI Models" },
  { href: "/admin/keys", label: "API Keys" },
  { href: "/admin/prompts", label: "Prompts" },
];

type Application = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  useCase?: string | null;
  plan: string | null;
  status: string;
  source?: string | null;
  createdAt: Date | string | number;
};

export default function AdminApplications() {
  const [, setLocation] = useLocation();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const appsQuery = trpc.admin.applications.list.useQuery();
  const approveMutation = trpc.admin.applications.approve.useMutation({
    onSuccess: () => {
      toast.success("Application approved! User account created.");
      appsQuery.refetch();
      setSelectedApp(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const rejectMutation = trpc.admin.applications.reject.useMutation({
    onSuccess: () => {
      toast.success("Application rejected.");
      appsQuery.refetch();
      setSelectedApp(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const apps: Application[] = appsQuery.data?.applications ?? [];
  const filtered = filterStatus === "all" ? apps : apps.filter(a => a.status === filterStatus);

  const statusColor = (status: string) => {
    if (status === "approved") return "oklch(72% 0.18 162)";
    if (status === "rejected") return "oklch(65% 0.2 30)";
    return "oklch(75% 0.18 55)";
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="w-4 h-4" />;
    if (status === "rejected") return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div style={ADMIN_SHELL_STYLE}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "1px solid oklch(20% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/admin/users")}>
          <span className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PilotHub Admin</span>
        </div>
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <button key={l.href} onClick={() => setLocation(l.href)}
              className="px-3 py-1.5 rounded-lg text-xs transition"
              style={{ color: l.href === "/admin/applications" ? "oklch(72% 0.18 162)" : "oklch(60% 0.03 220)", background: l.href === "/admin/applications" ? "oklch(72% 0.18 162 / 0.1)" : "transparent" }}>
              {l.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Applications</h1>
            <p className="text-sm mt-0.5" style={{ color: "oklch(55% 0.03 220)" }}>
              {apps.length} total · {apps.filter(a => a.status === "pending").length} pending review
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter */}
            {["all", "pending", "approved", "rejected"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-lg text-xs capitalize transition"
                style={{
                  background: filterStatus === s ? "oklch(72% 0.18 162 / 0.15)" : "oklch(18% 0.05 220)",
                  color: filterStatus === s ? "oklch(72% 0.18 162)" : "oklch(60% 0.03 220)",
                  border: `1px solid ${filterStatus === s ? "oklch(72% 0.18 162 / 0.3)" : "oklch(25% 0.04 220)"}`,
                }}>
                {s}
              </button>
            ))}
            <button onClick={() => appsQuery.refetch()}
              className="p-2 rounded-lg transition"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)", color: "oklch(60% 0.03 220)" }}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {appsQuery.isLoading ? (
          <div className="text-center py-16" style={{ color: "oklch(55% 0.03 220)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(22% 0.04 220)" }}>
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(35% 0.04 220)" }} />
            <p className="text-white font-semibold">No applications</p>
            <p className="text-sm mt-1" style={{ color: "oklch(50% 0.03 220)" }}>Applications will appear here once submitted</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(22% 0.04 220)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "oklch(16% 0.05 220)", borderBottom: "1px solid oklch(22% 0.04 220)" }}>
                  {["Name", "Email", "Plan", "Business", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(55% 0.03 220)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr key={app.id}
                    style={{ background: i % 2 === 0 ? "oklch(14% 0.04 220)" : "oklch(15% 0.04 220)", borderBottom: "1px solid oklch(20% 0.04 220)" }}>
                    <td className="px-4 py-3 text-sm text-white font-medium">{app.fullName}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "oklch(65% 0.03 220)" }}>{app.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium capitalize"
                        style={{ background: app.plan === "founderpilot" ? "oklch(75% 0.18 55 / 0.12)" : "oklch(60% 0.2 220 / 0.12)", color: app.plan === "founderpilot" ? "oklch(80% 0.18 55)" : "oklch(75% 0.2 220)" }}>
                        {app.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "oklch(65% 0.03 220)" }}>{app.businessName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-medium capitalize"
                        style={{ color: statusColor(app.status) }}>
                        {statusIcon(app.status)} {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "oklch(50% 0.03 220)" }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedApp(app)}
                          className="p-1.5 rounded-lg transition"
                          style={{ background: "oklch(20% 0.05 220)", color: "oklch(65% 0.03 220)" }}>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {app.status === "pending" && (
                          <>
                            <button onClick={() => approveMutation.mutate({ applicationId: app.id })}
                              disabled={approveMutation.isPending}
                              className="p-1.5 rounded-lg transition"
                              style={{ background: "oklch(72% 0.18 162 / 0.12)", color: "oklch(72% 0.18 162)" }}>
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => rejectMutation.mutate({ applicationId: app.id })}
                              disabled={rejectMutation.isPending}
                              className="p-1.5 rounded-lg transition"
                              style={{ background: "oklch(65% 0.2 30 / 0.12)", color: "oklch(65% 0.2 30)" }}>
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0% 0 0 / 0.7)" }}
          onClick={() => setSelectedApp(null)}>
          <div className="max-w-lg w-full p-6 rounded-2xl"
            style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Application #{selectedApp.id}
              </h3>
              <span className="flex items-center gap-1 text-xs font-medium capitalize px-2 py-1 rounded-full"
                style={{ background: `${statusColor(selectedApp.status)} / 0.12`, color: statusColor(selectedApp.status), border: `1px solid ${statusColor(selectedApp.status)} / 0.3` }}>
                {statusIcon(selectedApp.status)} {selectedApp.status}
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: "Full Name", value: selectedApp.fullName },
                { label: "Email", value: selectedApp.email },
                { label: "Phone", value: selectedApp.phone ?? "—" },
                { label: "Business Name", value: selectedApp.businessName ?? "—" },
                { label: "Business Type", value: selectedApp.businessType ?? "—" },
                { label: "Plan", value: selectedApp.plan },
                { label: "Source", value: selectedApp.source ?? "website" },
                { label: "Submitted", value: new Date(selectedApp.createdAt).toLocaleString() },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3">
                  <span className="text-xs w-28 flex-shrink-0 pt-0.5" style={{ color: "oklch(55% 0.03 220)" }}>{f.label}</span>
                  <span className="text-sm text-white flex-1">{f.value}</span>
                </div>
              ))}
              {selectedApp.useCase && (
                <div className="flex items-start gap-3">
                  <span className="text-xs w-28 flex-shrink-0 pt-0.5" style={{ color: "oklch(55% 0.03 220)" }}>Use Case</span>
                  <span className="text-sm text-white flex-1">{selectedApp.useCase}</span>
                </div>
              )}
            </div>
            {selectedApp.status === "pending" && (
              <div className="flex gap-3 mt-6">
                <button onClick={() => approveMutation.mutate({ applicationId: selectedApp.id })}
                  disabled={approveMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </button>
                <button onClick={() => rejectMutation.mutate({ applicationId: selectedApp.id })}
                  disabled={rejectMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "oklch(65% 0.2 30 / 0.15)", color: "oklch(75% 0.2 30)", border: "1px solid oklch(65% 0.2 30 / 0.3)" }}>
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </button>
              </div>
            )}
            <button onClick={() => setSelectedApp(null)}
              className="w-full mt-2 py-2 rounded-xl text-sm"
              style={{ color: "oklch(50% 0.03 220)" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
