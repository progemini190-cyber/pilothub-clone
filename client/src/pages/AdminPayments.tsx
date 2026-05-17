import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Search, RefreshCw, Eye, Pencil, Trash2, Loader2, Settings, Upload } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:   { bg: "oklch(55% 0.14 75 / 0.15)",  text: "oklch(78% 0.12 75)",  border: "oklch(55% 0.14 75 / 0.3)" },
  confirmed: { bg: "oklch(72% 0.18 162 / 0.15)", text: "oklch(72% 0.18 162)", border: "oklch(72% 0.18 162 / 0.3)" },
  rejected:  { bg: "oklch(60% 0.22 25 / 0.15)",  text: "oklch(75% 0.18 25)",  border: "oklch(60% 0.22 25 / 0.3)" },
};

function formatMMK(amount: number) {
  return new Intl.NumberFormat("my-MM").format(amount) + " ကျပ်";
}

/** Only render QR images stored as base64 data URLs (legacy /manus-storage/ URLs are broken). */
function displayableQrUrl(url: string | null | undefined): string | null {
  if (!url || url.startsWith("/manus-storage/")) return null;
  if (url.startsWith("data:image/")) return url;
  return null;
}

type Payment = {
  id: number;
  userId: number;
  userName?: string | null;
  userEmail?: string | null;
  plan: string;
  amount: number;
  status: string;
  paymentMethod?: string | null;
  transactionRef?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: Date | string;
};

type EditForm = {
  plan: string;
  amount: string;
  status: "pending" | "confirmed" | "rejected";
  paymentMethod: string;
  transactionRef: string;
  notes: string;
};

export default function AdminPayments() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMethodTab, setActiveMethodTab] = useState<"kbzpay" | "wavepay" | "ayapay">("kbzpay");
  // Per-method state
  const [methodState, setMethodState] = useState<Record<string, { phone: string; name: string; qrPreview: string | null }>>(
    { kbzpay: { phone: "", name: "", qrPreview: null }, wavepay: { phone: "", name: "", qrPreview: null }, ayapay: { phone: "", name: "", qrPreview: null } }
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const kbzQrRef = useRef<HTMLInputElement>(null);
  const waveQrRef = useRef<HTMLInputElement>(null);
  const ayaQrRef = useRef<HTMLInputElement>(null);
  const qrRefs: Record<string, React.RefObject<HTMLInputElement | null>> = { kbzpay: kbzQrRef, wavepay: waveQrRef, ayapay: ayaQrRef };

  const { data: settingsData, refetch: refetchSettings } = trpc.payments.settings.useQuery();
  const setSystemSetting = trpc.admin.settings.set.useMutation();
  const handleQrFileChange = (method: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === "string") {
        setMethodState(prev => ({ ...prev, [method]: { ...prev[method], qrPreview: dataUrl } }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleSaveMethodSettings = async (method: "kbzpay" | "wavepay" | "ayapay") => {
    const ms = methodState[method];
    setSavingSettings(true);
    try {
      await setSystemSetting.mutateAsync({
        method,
        phone: ms.phone.trim(),
        name: ms.name.trim(),
        ...(ms.qrPreview?.startsWith("data:image/")
          ? { qrDataUrl: ms.qrPreview }
          : {}),
      });
      const updated = await refetchSettings();
      initMethodState(updated.data);
      toast.success("Settings saved");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save settings";
      toast.error(message);
    } finally {
      setSavingSettings(false);
    }
  };
  const initMethodState = (sd: typeof settingsData) => {
    if (!sd) return;
    setMethodState({
      kbzpay: {
        phone: sd.kbzpay?.phone ?? "",
        name: sd.kbzpay?.name ?? "",
        qrPreview: displayableQrUrl(sd.kbzpay?.qrUrl),
      },
      wavepay: {
        phone: sd.wavepay?.phone ?? "",
        name: sd.wavepay?.name ?? "",
        qrPreview: displayableQrUrl(sd.wavepay?.qrUrl),
      },
      ayapay: {
        phone: sd.ayapay?.phone ?? "",
        name: sd.ayapay?.name ?? "",
        qrPreview: displayableQrUrl(sd.ayapay?.qrUrl),
      },
    });
  };

  const { data, isLoading, refetch } = trpc.admin.payments.list.useQuery(undefined, {
    retry: false,
    onError: () => setLocation("/admin/login"),
  } as any);

  const updateStatus = trpc.admin.payments.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Payment status updated"); },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to update"),
  });

  const updatePayment = trpc.admin.payments.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditPayment(null);
      setEditForm(null);
      toast.success("Payment updated successfully");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to update"),
  });

  const deletePayment = trpc.admin.payments.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteConfirm(null);
      toast.success("Payment deleted");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to delete"),
  });

  const openEdit = (p: Payment) => {
    setEditPayment(p);
    setEditForm({
      plan: p.plan,
      amount: String(p.amount),
      status: p.status as "pending" | "confirmed" | "rejected",
      paymentMethod: p.paymentMethod ?? "",
      transactionRef: p.transactionRef ?? "",
      notes: p.notes ?? "",
    });
  };

  const handleEditSave = () => {
    if (!editPayment || !editForm) return;
    const amountNum = parseInt(editForm.amount, 10);
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error("Invalid amount");
      return;
    }
    updatePayment.mutate({
      paymentId: editPayment.id,
      plan: editForm.plan,
      amount: amountNum,
      status: editForm.status,
      paymentMethod: editForm.paymentMethod || undefined,
      transactionRef: editForm.transactionRef || undefined,
      notes: editForm.notes || undefined,
    });
  };

  const payments = data?.payments ?? [];
  const filtered = payments.filter((p: any) => {
    const matchStatus = filter === "all" || p.status === filter;
    const matchSearch = !search ||
      p.userName?.toLowerCase().includes(search.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionRef?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: payments.length,
    pending: payments.filter((p: any) => p.status === "pending").length,
    confirmed: payments.filter((p: any) => p.status === "confirmed").length,
    rejected: payments.filter((p: any) => p.status === "rejected").length,
    totalMMK: payments.filter((p: any) => p.status === "confirmed").reduce((s: number, p: any) => s + (p.amount || 0), 0),
  };

  const inputStyle = {
    background: "oklch(20% 0.05 220)",
    border: "1px solid oklch(30% 0.04 220)",
    color: "white",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: "0.25rem",
    color: "oklch(60% 0.03 220)",
  } as React.CSSProperties;

  return (
    <DashboardShell title="Payment Management" activeTab="payments" isAdminShell>
      <div className="space-y-6">
        {/* Settings Toggle */}
        <div className="flex justify-end">
          <button onClick={() => {
            setShowSettings(s => !s);
            if (!showSettings) initMethodState(settingsData);
          }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
            style={{
              background: showSettings ? "oklch(72% 0.18 162 / 0.15)" : "oklch(18% 0.05 220)",
              color: showSettings ? "oklch(72% 0.18 162)" : "oklch(65% 0.03 220)",
              border: `1px solid ${showSettings ? "oklch(72% 0.18 162 / 0.3)" : "oklch(28% 0.04 220)"}`
            }}>
            <Settings className="w-4 h-4" />
            Payment Settings
          </button>
        </div>

        {showSettings && (() => {
          const METHODS: { id: "kbzpay" | "wavepay" | "ayapay"; label: string; color: string }[] = [
            { id: "kbzpay", label: "KBZPay", color: "oklch(72% 0.18 162)" },
            { id: "wavepay", label: "WavePay", color: "oklch(65% 0.22 250)" },
            { id: "ayapay", label: "AYAPay", color: "oklch(78% 0.14 85)" },
          ];
          const cur = settingsData?.[activeMethodTab];
          const ms = methodState[activeMethodTab];
          const displayQr = displayableQrUrl(ms?.qrPreview) ?? displayableQrUrl(cur?.qrUrl);
          const savedDisplayQr = displayableQrUrl(cur?.qrUrl);
          return (
            <div className="rounded-2xl p-6 space-y-5" style={{ background: "oklch(15% 0.04 220)", border: "1px solid oklch(72% 0.18 162 / 0.2)" }}>
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>💳 Payment Settings</h3>
              <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>ဤ settings မှာ user Billing page တွင် ပြသပါမည်</p>
              {/* Method Tabs */}
              <div className="flex gap-2">
                {METHODS.map(m => (
                  <button key={m.id} onClick={() => setActiveMethodTab(m.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition"
                    style={activeMethodTab === m.id
                      ? { background: `${m.color}25`, color: m.color, border: `1px solid ${m.color}` }
                      : { background: "oklch(18% 0.04 220)", color: "oklch(55% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                    {m.label}
                  </button>
                ))}
              </div>
              {/* Current saved values */}
              {cur && (cur.phone || cur.qrUrl) && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: "oklch(18% 0.04 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                  <p className="text-xs font-semibold" style={{ color: "oklch(72% 0.18 162)" }}>Saved Settings</p>
                  {cur.phone && <p className="text-sm text-white">Phone: {cur.phone}</p>}
                  {cur.name && <p className="text-sm text-white">Name: {cur.name}</p>}
                  {savedDisplayQr ? (
                    <div>
                      <p className="text-xs mb-2" style={{ color: "oklch(55% 0.03 220)" }}>Current QR:</p>
                      <img src={savedDisplayQr} alt="QR" className="w-24 h-24 rounded-lg object-contain" style={{ background: "white", padding: "4px" }} />
                    </div>
                  ) : cur?.qrUrl?.startsWith("/manus-storage/") ? (
                    <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
                      Previous QR was stored externally — upload a new image below.
                    </p>
                  ) : null}
                </div>
              )}
              {/* Edit fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(60% 0.03 220)" }}>ဖုန်းနံပါတ်</label>
                  <input value={ms?.phone ?? ""} onChange={e => setMethodState(prev => ({ ...prev, [activeMethodTab]: { ...prev[activeMethodTab], phone: e.target.value } }))}
                    placeholder="09xxxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "oklch(20% 0.05 220)", border: "1px solid oklch(30% 0.04 220)", color: "white" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(60% 0.03 220)" }}>အကောင့်ပိုင်ရှင် အမည်</label>
                  <input value={ms?.name ?? ""} onChange={e => setMethodState(prev => ({ ...prev, [activeMethodTab]: { ...prev[activeMethodTab], name: e.target.value } }))}
                    placeholder="Ko Aung"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "oklch(20% 0.05 220)", border: "1px solid oklch(30% 0.04 220)", color: "white" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "oklch(60% 0.03 220)" }}>QR Code Image</label>
                <div onClick={() => qrRefs[activeMethodTab]?.current?.click()}
                  className="rounded-xl p-4 text-center cursor-pointer transition"
                  style={{ background: "oklch(18% 0.04 220)", border: `2px dashed ${displayQr ? "oklch(72% 0.18 162)" : "oklch(30% 0.04 220)"}` }}>
                  {displayQr ? (
                    <img src={displayQr} alt="QR Preview" className="w-32 h-32 mx-auto rounded-lg object-contain" style={{ background: "white", padding: "4px" }} />
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 mx-auto mb-1" style={{ color: "oklch(45% 0.03 220)" }} />
                      <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>QR code image upload လုပ်ပါ</p>
                    </div>
                  )}
                  <input ref={qrRefs[activeMethodTab] as React.RefObject<HTMLInputElement>} type="file" accept="image/*" className="hidden" onChange={handleQrFileChange(activeMethodTab)} />
                </div>
              </div>
              <button onClick={() => handleSaveMethodSettings(activeMethodTab)}
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)", opacity: savingSettings ? 0.7 : 1 }}>
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save {METHODS.find(m => m.id === activeMethodTab)?.label} Settings
              </button>
            </div>
          );
        })()}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Payments", value: stats.total, color: "oklch(72% 0.18 162)" },
            { label: "Pending", value: stats.pending, color: "oklch(78% 0.12 75)" },
            { label: "Confirmed", value: stats.confirmed, color: "oklch(72% 0.18 162)" },
            { label: "Revenue (MMK)", value: formatMMK(stats.totalMMK), color: "oklch(65% 0.22 250)" },
          ].map((s) => (
            <div key={s.label} className="p-5 rounded-2xl"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
              <p className="text-xs mb-2" style={{ color: "oklch(55% 0.03 220)" }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(50% 0.03 220)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or ref..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(28% 0.04 220)", color: "white" }} />
          </div>
          <div className="flex gap-2">
            {(["all", "pending", "confirmed", "rejected"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-xl text-xs font-semibold capitalize transition"
                style={filter === f
                  ? { background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }
                  : { background: "oklch(18% 0.05 220)", color: "oklch(60% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                {f} {f !== "all" && `(${stats[f as keyof typeof stats] || 0})`}
              </button>
            ))}
          </div>
          <button onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ background: "oklch(18% 0.05 220)", color: "oklch(60% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(25% 0.04 220)" }}>
          {isLoading ? (
            <div className="p-12 text-center" style={{ color: "oklch(55% 0.03 220)" }}>
              Loading payments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "oklch(55% 0.03 220)" }}>
              <p className="text-4xl mb-3">💳</p>
              <p className="font-semibold text-white mb-1">No payments found</p>
              <p className="text-sm">Payment records will appear here once users subscribe.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: "oklch(15% 0.04 220)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
                  <tr>
                    {["ID", "User", "Plan", "Amount (MMK)", "Method", "Ref/Receipt", "Status", "Date", "Actions"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "oklch(55% 0.03 220)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any, i: number) => {
                    const sc = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid oklch(22% 0.04 220)", background: i % 2 === 0 ? "oklch(18% 0.05 220)" : "oklch(16% 0.04 220)" }}>
                        <td className="px-5 py-4 text-sm font-mono" style={{ color: "oklch(55% 0.03 220)" }}>#{p.id}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-white">{p.userName || "—"}</p>
                          <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>{p.userEmail || "—"}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold capitalize" style={{ color: "oklch(72% 0.18 162)" }}>{p.plan}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-white">{formatMMK(p.amount)}</td>
                        <td className="px-5 py-4 text-sm capitalize" style={{ color: "oklch(65% 0.03 220)" }}>{p.paymentMethod || "—"}</td>
                        <td className="px-5 py-4">
                          {p.transactionRef && <p className="text-xs font-mono" style={{ color: "oklch(65% 0.03 220)" }}>{p.transactionRef}</p>}
                          {p.receiptUrl && (
                            <button onClick={() => setViewReceipt(p.receiptUrl)}
                              className="flex items-center gap-1 text-xs mt-1" style={{ color: "oklch(72% 0.18 162)" }}>
                              <Eye className="w-3 h-3" /> View Receipt
                            </button>
                          )}
                          {!p.transactionRef && !p.receiptUrl && <span className="text-xs" style={{ color: "oklch(40% 0.03 220)" }}>—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
                          {new Date(p.createdAt).toLocaleDateString("my-MM")}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {p.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateStatus.mutate({ paymentId: p.id, status: "confirmed" })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                  style={{ background: "oklch(72% 0.18 162 / 0.15)", color: "oklch(72% 0.18 162)", border: "1px solid oklch(72% 0.18 162 / 0.3)" }}>
                                  ✓ Confirm
                                </button>
                                <button
                                  onClick={() => updateStatus.mutate({ paymentId: p.id, status: "rejected" })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                  style={{ background: "oklch(60% 0.22 25 / 0.15)", color: "oklch(75% 0.18 25)", border: "1px solid oklch(60% 0.22 25 / 0.3)" }}>
                                  ✗ Reject
                                </button>
                              </>
                            )}
                            {p.status !== "pending" && (
                              <button
                                onClick={() => updateStatus.mutate({ paymentId: p.id, status: "pending" })}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                                Reset
                              </button>
                            )}
                            {/* Edit button */}
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg transition"
                              title="Edit payment"
                              style={{ background: "oklch(65% 0.22 250 / 0.12)", color: "oklch(65% 0.22 250)", border: "1px solid oklch(65% 0.22 250 / 0.25)" }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => setDeleteConfirm(p.id)}
                              className="p-1.5 rounded-lg transition"
                              title="Delete payment"
                              style={{ background: "oklch(60% 0.22 25 / 0.12)", color: "oklch(75% 0.18 25)", border: "1px solid oklch(60% 0.22 25 / 0.25)" }}>
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Receipt Viewer Modal */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0% 0 0 / 0.8)" }}
          onClick={() => setViewReceipt(null)}>
          <div className="max-w-lg w-full mx-4 rounded-2xl overflow-hidden"
            style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid oklch(25% 0.04 220)" }}>
              <h3 className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Payment Receipt</h3>
              <button onClick={() => setViewReceipt(null)}
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)" }}>Close</button>
            </div>
            <div className="p-4">
              <img src={viewReceipt} alt="Receipt" className="w-full rounded-xl object-contain max-h-96" />
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editPayment && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0% 0 0 / 0.75)" }}
          onClick={() => { setEditPayment(null); setEditForm(null); }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
            style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid oklch(25% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
              <div>
                <h3 className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Edit Payment #{editPayment.id}</h3>
                <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.03 220)" }}>{editPayment.userName} — {editPayment.userEmail}</p>
              </div>
              <button onClick={() => { setEditPayment(null); setEditForm(null); }}
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)" }}>✕</button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Plan</label>
                  <select
                    value={editForm.plan}
                    onChange={e => setEditForm(f => f ? { ...f, plan: e.target.value } : f)}
                    style={inputStyle}>
                    <option value="bizpilot">BizPilot</option>
                    <option value="founderpilot">FounderPilot</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Amount (MMK)</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={e => setEditForm(f => f ? { ...f, amount: e.target.value } : f)}
                    style={inputStyle}
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(f => f ? { ...f, status: e.target.value as "pending" | "confirmed" | "rejected" } : f)}
                    style={inputStyle}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={e => setEditForm(f => f ? { ...f, paymentMethod: e.target.value } : f)}
                    style={inputStyle}>
                    <option value="">— Select —</option>
                    <option value="kbzpay">KBZPay</option>
                    <option value="wavepay">WavePay</option>
                    <option value="ayapay">AYAPay</option>
                    <option value="cbpay">CB Pay</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Transaction Reference</label>
                <input
                  type="text"
                  value={editForm.transactionRef}
                  onChange={e => setEditForm(f => f ? { ...f, transactionRef: e.target.value } : f)}
                  placeholder="Transaction ID or reference number"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => f ? { ...f, notes: e.target.value } : f)}
                  placeholder="Admin notes..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4"
              style={{ borderTop: "1px solid oklch(25% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
              <button
                onClick={() => { setEditPayment(null); setEditForm(null); }}
                className="px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={updatePayment.isPending}
                className="px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)", opacity: updatePayment.isPending ? 0.7 : 1 }}>
                {updatePayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0% 0 0 / 0.75)" }}
          onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
            style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(60% 0.22 25 / 0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "oklch(60% 0.22 25 / 0.15)" }}>
                <Trash2 className="w-7 h-7" style={{ color: "oklch(75% 0.18 25)" }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Delete Payment #{deleteConfirm}?
              </h3>
              <p className="text-sm mb-6" style={{ color: "oklch(60% 0.03 220)" }}>
                This action cannot be undone. The payment record will be permanently removed.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                  Cancel
                </button>
                <button
                  onClick={() => deletePayment.mutate({ paymentId: deleteConfirm })}
                  disabled={deletePayment.isPending}
                  className="px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                  style={{ background: "oklch(60% 0.22 25)", color: "white", opacity: deletePayment.isPending ? 0.7 : 1 }}>
                  {deletePayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
