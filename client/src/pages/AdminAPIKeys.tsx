import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Key, Plus, Eye, EyeOff, CheckCircle, Trash2, Loader2, AlertCircle, Zap, Star } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  {
    id: "openai" as const,
    name: "OpenAI",
    description: "GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo",
    placeholder: "sk-proj-...",
    color: "oklch(72% 0.18 162)",
    bg: "oklch(72% 0.18 162 / 0.1)",
    border: "oklch(72% 0.18 162 / 0.3)",
    icon: Zap,
    models: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  },
  {
    id: "gemini" as const,
    name: "Google Gemini",
    description: "Gemini 2.5 Pro, Gemini 2.0 Flash, Gemini 2.5 Flash",
    placeholder: "AIzaSy...",
    color: "oklch(65% 0.22 250)",
    bg: "oklch(65% 0.22 250 / 0.1)",
    border: "oklch(65% 0.22 250 / 0.3)",
    icon: Star,
    models: ["gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.5-flash"],
  },
];

export default function AdminAPIKeys() {
  const [, setLocation] = useLocation();
  const [showKeyInput, setShowKeyInput] = useState<Record<string, boolean>>({});
  const [newKeys, setNewKeys] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.admin.apiKeys.list.useQuery(undefined, {
    retry: false,
    onError: () => setLocation("/admin/login"),
  } as any);

  const upsertKey = trpc.admin.apiKeys.upsert.useMutation({
    onSuccess: () => {
      refetch();
      setAdding(null);
      setNewKeys({});
      toast.success("API key saved and activated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteKey = trpc.admin.apiKeys.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("API key removed"); },
    onError: (e) => toast.error(e.message),
  });

  const keys = (data?.keys as any[]) ?? [];

  return (
    <DashboardShell title="API Key Management" activeTab="apikeys" isAdminShell>
      <div className="max-w-4xl space-y-6">
        {/* Info banner */}
        <div className="p-5 rounded-2xl flex items-start gap-4"
          style={{ background: "oklch(18% 0.06 220)", border: "1px solid oklch(72% 0.18 162 / 0.2)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(72% 0.18 162 / 0.15)", border: "1px solid oklch(72% 0.18 162 / 0.3)" }}>
            <Key className="w-5 h-5" style={{ color: "oklch(72% 0.18 162)" }} />
          </div>
          <div>
            <p className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>API Key Management</p>
            <p className="text-sm mt-0.5" style={{ color: "oklch(60% 0.03 220)" }}>
              Manage API keys for AI providers. The active key is used for all BizPilot and FounderPilot conversations.
              Keys are stored securely and only the last 4 characters are displayed.
            </p>
          </div>
        </div>

        {/* Provider sections */}
        {PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          const providerKeys = keys.filter((k: any) => k.provider === provider.id);
          const activeKey = providerKeys.find((k: any) => k.isActive === "true");
          const isAdding = adding === provider.id;

          return (
            <div key={provider.id} className="rounded-2xl overflow-hidden"
              style={{ background: "oklch(16% 0.05 220)", border: `1px solid ${isAdding || activeKey ? provider.border : "oklch(22% 0.04 220)"}` }}>
              {/* Provider header */}
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid oklch(22% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: provider.bg, border: `1px solid ${provider.border}` }}>
                    <Icon className="w-4 h-4" style={{ color: provider.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {provider.name}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>{provider.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activeKey ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "oklch(72% 0.18 162 / 0.12)", color: "oklch(72% 0.18 162)", border: "1px solid oklch(72% 0.18 162 / 0.25)" }}>
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                      style={{ background: "oklch(22% 0.05 220)", color: "oklch(55% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                      <AlertCircle className="w-3 h-3" /> No key set
                    </span>
                  )}
                  <button
                    onClick={() => setAdding(isAdding ? null : provider.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    style={isAdding ? {
                      background: "oklch(22% 0.05 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)"
                    } : {
                      background: provider.bg, color: provider.color, border: `1px solid ${provider.border}`
                    }}>
                    <Plus className="w-4 h-4" />
                    {isAdding ? "Cancel" : activeKey ? "Update Key" : "Add Key"}
                  </button>
                </div>
              </div>

              {/* Add key form */}
              {isAdding && (
                <div className="px-6 py-5" style={{ borderBottom: "1px solid oklch(22% 0.04 220)", background: "oklch(15% 0.05 220)" }}>
                  <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: provider.color }}>
                    {activeKey ? "Replace Active Key" : "Add New Key"}
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type={showKeyInput[`new-${provider.id}`] ? "text" : "password"}
                        value={newKeys[provider.id] ?? ""}
                        onChange={(e) => setNewKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                        placeholder={provider.placeholder}
                        className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none pr-12"
                        style={{ background: "oklch(20% 0.05 220)", color: "white", border: `1px solid ${provider.border}` }}
                      />
                      <button
                        onClick={() => setShowKeyInput(prev => ({ ...prev, [`new-${provider.id}`]: !prev[`new-${provider.id}`] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "oklch(55% 0.03 220)" }}>
                        {showKeyInput[`new-${provider.id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const val = newKeys[provider.id]?.trim();
                        if (!val) return toast.error("Please enter an API key");
                        upsertKey.mutate({ provider: provider.id, keyValue: val });
                      }}
                      disabled={upsertKey.isPending || !newKeys[provider.id]}
                      className="px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                      style={{ background: provider.color, color: "oklch(12% 0.03 220)", opacity: !newKeys[provider.id] ? 0.5 : 1 }}>
                      {upsertKey.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                      Save & Activate
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "oklch(50% 0.03 220)" }}>
                    The key will be stored securely. Only the last 4 characters will be visible after saving.
                  </p>
                </div>
              )}

              {/* Existing keys */}
              <div>
                {isLoading ? (
                  <div className="px-6 py-8 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: provider.color }} />
                  </div>
                ) : providerKeys.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Key className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(35% 0.03 220)" }} />
                    <p className="text-sm" style={{ color: "oklch(50% 0.03 220)" }}>No API keys configured for {provider.name}</p>
                    <p className="text-xs mt-1" style={{ color: "oklch(40% 0.03 220)" }}>Add a key above to enable AI features with this provider</p>
                  </div>
                ) : providerKeys.map((key: any, i: number) => (
                  <div key={key.id} className="px-6 py-4 flex items-center justify-between gap-4"
                    style={{ borderTop: i > 0 ? "1px solid oklch(20% 0.04 220)" : undefined }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: key.isActive === "true" ? provider.bg : "oklch(20% 0.04 220)", border: `1px solid ${key.isActive === "true" ? provider.border : "oklch(26% 0.04 220)"}` }}>
                        <Key className="w-3.5 h-3.5" style={{ color: key.isActive === "true" ? provider.color : "oklch(45% 0.03 220)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-white">{key.keyValue}</code>
                          {key.isActive === "true" && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: "oklch(72% 0.18 162 / 0.12)", color: "oklch(72% 0.18 162)" }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.03 220)" }}>
                          Added {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Remove this API key?")) deleteKey.mutate({ keyId: key.id });
                      }}
                      className="p-2 rounded-lg transition"
                      style={{ color: "oklch(55% 0.03 220)" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Supported models footer */}
              <div className="px-6 py-3 flex items-center gap-2 flex-wrap"
                style={{ borderTop: "1px solid oklch(20% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
                <span className="text-xs" style={{ color: "oklch(45% 0.03 220)" }}>Supported models:</span>
                {provider.models.map(m => (
                  <span key={m} className="px-2 py-0.5 rounded text-xs font-mono"
                    style={{ background: "oklch(20% 0.04 220)", color: "oklch(60% 0.03 220)", border: "1px solid oklch(26% 0.04 220)" }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
