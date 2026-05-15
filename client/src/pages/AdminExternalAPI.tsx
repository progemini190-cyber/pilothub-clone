import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import {
  Globe, Plus, Trash2, Eye, EyeOff, Copy, CheckCircle,
  Loader2, Key, Code, ChevronDown, ChevronRight, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/public/info",
    auth: "None (public)",
    description: "API info, available plans and endpoints list",
    body: null,
    response: `{
  "name": "PilotHub Public API",
  "version": "2.0.0",
  "plans": [
    { "id": "bizpilot", "name": "BizPilot", "price": 100000, "currency": "MMK" },
    { "id": "founderpilot", "name": "FounderPilot", "price": 300000, "currency": "MMK" }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/public/applications/submit",
    auth: "X-API-Key header",
    description: "Submit an application form from your external website. Admin will review and approve.",
    body: `{
  "fullName": "Ko Aung",
  "email": "koaung@gmail.com",
  "phone": "09123456789",
  "businessName": "ABC Co., Ltd.",
  "businessType": "Trading",
  "useCase": "Business strategy advice",
  "plan": "bizpilot",
  "paymentSlipUrl": "https://..."  // optional: payment screenshot URL
}`,
    response: `{
  "success": true,
  "applicationId": 42,
  "message": "Application submitted. Admin will review within 24 hours."
}`,
  },
  {
    method: "POST",
    path: "/api/public/payments/submit",
    auth: "X-API-Key header",
    description: "Submit a payment record. Admin will verify and activate the account.",
    body: `{
  "userEmail": "koaung@gmail.com",
  "plan": "bizpilot",
  "amount": 100000,
  "paymentMethod": "KBZPay",
  "transactionRef": "TXN123456",
  "screenshotUrl": "https://..."  // optional
}`,
    response: `{
  "success": true,
  "paymentId": 15,
  "message": "Payment submitted. Admin will confirm within 24 hours."
}`,
  },
  {
    method: "GET",
    path: "/api/public/users/list",
    auth: "X-API-Key header (admin token)",
    description: "List all users. Requires an admin-level API token.",
    body: null,
    response: `{
  "success": true,
  "users": [
    { "id": 1, "name": "Ko Aung", "email": "koaung@gmail.com", "plan": "bizpilot", "status": "active" }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/external/create-user",
    auth: "X-API-Key header",
    description:
      "Quick-create a shadow user (no Google login), set Telegram plan limits, and return the activation start link for your AI sales agent.",
    body: `{
  "email": "customer@example.com",
  "name": "Ko Aung",
  "planType": "bizpilot",
  "bizMessageLimit": 20,
  "founderMessageLimit": 0,
  "planExpiryDate": "2026-06-15",
  "botUsername": "(optional — defaults to NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)"
}`,
    response: `{
  "success": true,
  "userId": 42,
  "created": true,
  "token": "abc123...",
  "activationLink": "https://t.me/YourBizPilotBot?start=abc123...",
  "telegramStartLink": "https://t.me/YourBizPilotBot?start=abc123..."
}`,
  },
];

export default function AdminExternalAPI() {
  const [, setLocation] = useLocation();
  const [newTokenName, setNewTokenName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNewToken, setShowNewToken] = useState<{ id: number; token: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<number | null>(0);

  const { data, isLoading, refetch } = trpc.admin.externalTokens.list.useQuery(undefined, {
    retry: false,
    onError: () => setLocation("/admin/login"),
  } as any);

  const createToken = trpc.admin.externalTokens.create.useMutation({
    onSuccess: (result) => {
      refetch();
      setNewTokenName("");
      setCreating(false);
      setShowNewToken({ id: result.id, token: result.token });
      toast.success("API token created!");
    },
    onError: (e) => { toast.error(e.message); setCreating(false); },
  });

  const deleteToken = trpc.admin.externalTokens.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Token revoked"); },
    onError: (e) => toast.error(e.message),
  });

  const tokens = (data as any[]) ?? [];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToken(text);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const handleCreate = () => {
    if (!newTokenName.trim()) { toast.error("Enter a name for this token"); return; }
    setCreating(true);
    createToken.mutate({ name: newTokenName.trim() });
  };

  const methodColor = (method: string) => {
    if (method === "GET") return { bg: "oklch(65% 0.22 250 / 0.15)", color: "oklch(65% 0.22 250)", border: "oklch(65% 0.22 250 / 0.3)" };
    if (method === "POST") return { bg: "oklch(72% 0.18 162 / 0.15)", color: "oklch(72% 0.18 162)", border: "oklch(72% 0.18 162 / 0.3)" };
    return { bg: "oklch(78% 0.12 75 / 0.15)", color: "oklch(78% 0.12 75)", border: "oklch(78% 0.12 75 / 0.3)" };
  };

  return (
    <DashboardShell title="External API" activeTab="external-api" isAdminShell>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="p-6 rounded-2xl" style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(72% 0.18 162 / 0.25)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(72% 0.18 162 / 0.15)", border: "1px solid oklch(72% 0.18 162 / 0.3)" }}>
              <Globe className="w-5 h-5" style={{ color: "oklch(72% 0.18 162)" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>External API Integration</h2>
              <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>Connect your third-party website to PilotHub</p>
            </div>
          </div>
          <p className="text-sm" style={{ color: "oklch(65% 0.03 220)" }}>
            Use these API endpoints to integrate PilotHub with your external website. When a user submits an application or payment from your site, it will appear in the Admin panel automatically.
          </p>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "oklch(15% 0.04 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            <Code className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(72% 0.18 162)" }} />
            <span className="text-xs font-mono" style={{ color: "oklch(72% 0.18 162)" }}>Base URL: {BASE_URL}</span>
            <button onClick={() => copyToClipboard(BASE_URL, "Base URL")} className="ml-auto p-1 rounded">
              {copiedToken === BASE_URL ? <CheckCircle className="w-3.5 h-3.5" style={{ color: "oklch(72% 0.18 162)" }} /> : <Copy className="w-3.5 h-3.5" style={{ color: "oklch(55% 0.03 220)" }} />}
            </button>
          </div>
        </div>

        {/* API Tokens */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(25% 0.04 220)" }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ background: "oklch(18% 0.05 220)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" style={{ color: "oklch(72% 0.18 162)" }} />
              <span className="font-semibold text-white text-sm">API Tokens</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "oklch(72% 0.18 162 / 0.15)", color: "oklch(72% 0.18 162)" }}>
                {tokens.length}
              </span>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
              <Plus className="w-3.5 h-3.5" />
              New Token
            </button>
          </div>

          {/* New token form */}
          {creating && (
            <div className="px-5 py-4 flex gap-3 items-center"
              style={{ background: "oklch(72% 0.18 162 / 0.05)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
              <input
                type="text"
                placeholder="Token name (e.g. My Website)"
                value={newTokenName}
                onChange={e => setNewTokenName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: "oklch(20% 0.04 220)", border: "1px solid oklch(72% 0.18 162 / 0.4)" }}
              />
              <button onClick={handleCreate} disabled={createToken.isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition"
                style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                {createToken.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
              </button>
              <button onClick={() => { setCreating(false); setNewTokenName(""); }}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: "oklch(22% 0.04 220)", color: "oklch(60% 0.03 220)" }}>
                Cancel
              </button>
            </div>
          )}

          {/* New token reveal */}
          {showNewToken && (
            <div className="px-5 py-4" style={{ background: "oklch(72% 0.18 162 / 0.06)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" style={{ color: "oklch(72% 0.18 162)" }} />
                <span className="text-sm font-semibold" style={{ color: "oklch(72% 0.18 162)" }}>Token created! Copy it now — it won't be shown again.</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "oklch(15% 0.04 220)", border: "1px solid oklch(72% 0.18 162 / 0.4)" }}>
                <code className="flex-1 text-xs font-mono text-white break-all">{showNewToken.token}</code>
                <button onClick={() => copyToClipboard(showNewToken.token, "Token")} className="p-1 rounded flex-shrink-0">
                  {copiedToken === showNewToken.token ? <CheckCircle className="w-4 h-4" style={{ color: "oklch(72% 0.18 162)" }} /> : <Copy className="w-4 h-4" style={{ color: "oklch(55% 0.03 220)" }} />}
                </button>
              </div>
              <button onClick={() => setShowNewToken(null)} className="mt-2 text-xs" style={{ color: "oklch(55% 0.03 220)" }}>Dismiss</button>
            </div>
          )}

          {/* Token list */}
          <div style={{ background: "oklch(16% 0.04 220)" }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(72% 0.18 162)" }} />
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-10">
                <Key className="w-8 h-8 mx-auto mb-3" style={{ color: "oklch(35% 0.03 220)" }} />
                <p className="text-sm" style={{ color: "oklch(50% 0.03 220)" }}>No API tokens yet</p>
                <p className="text-xs mt-1" style={{ color: "oklch(40% 0.03 220)" }}>Create a token to connect your external website</p>
              </div>
            ) : (
              tokens.map((token: any, i: number) => (
                <div key={token.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderBottom: i < tokens.length - 1 ? "1px solid oklch(22% 0.04 220)" : "none" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(72% 0.18 162 / 0.12)", border: "1px solid oklch(72% 0.18 162 / 0.2)" }}>
                    <Key className="w-3.5 h-3.5" style={{ color: "oklch(72% 0.18 162)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{token.name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "oklch(50% 0.03 220)" }}>
                      ph_ext_••••••••{token.tokenPreview ?? "••••••••"}
                    </p>
                  </div>
                  <p className="text-xs hidden sm:block" style={{ color: "oklch(45% 0.03 220)" }}>
                    {token.createdAt ? new Date(token.createdAt).toLocaleDateString() : "—"}
                  </p>
                  <button
                    onClick={() => { if (confirm(`Revoke token "${token.name}"?`)) deleteToken.mutate({ id: token.id }); }}
                    className="p-2 rounded-lg transition"
                    style={{ background: "oklch(60% 0.22 25 / 0.1)", color: "oklch(60% 0.22 25)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Usage instructions */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(25% 0.04 220)" }}>
          <div className="px-5 py-4" style={{ background: "oklch(18% 0.05 220)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
            <h3 className="font-semibold text-white text-sm">How to Use</h3>
          </div>
          <div className="px-5 py-4 space-y-3" style={{ background: "oklch(16% 0.04 220)" }}>
            <p className="text-sm" style={{ color: "oklch(65% 0.03 220)" }}>
              Include your API token in every request using the <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "oklch(22% 0.04 220)", color: "oklch(72% 0.18 162)" }}>X-API-Key</code> header:
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(25% 0.04 220)" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ background: "oklch(20% 0.04 220)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
                <span className="text-xs font-medium" style={{ color: "oklch(55% 0.03 220)" }}>Example — Submit Application (JavaScript)</span>
                <button onClick={() => copyToClipboard(`fetch("${BASE_URL}/api/public/applications/submit", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "YOUR_TOKEN_HERE"\n  },\n  body: JSON.stringify({\n    fullName: "Ko Aung",\n    email: "koaung@gmail.com",\n    phone: "09123456789",\n    businessName: "ABC Co., Ltd.",\n    businessType: "Trading",\n    useCase: "Business strategy",\n    plan: "bizpilot"\n  })\n})\n.then(r => r.json())\n.then(console.log);`, "Code")} className="p-1 rounded">
                  <Copy className="w-3.5 h-3.5" style={{ color: "oklch(55% 0.03 220)" }} />
                </button>
              </div>
              <pre className="px-4 py-3 text-xs font-mono overflow-x-auto" style={{ color: "oklch(72% 0.18 162)", background: "oklch(14% 0.03 220)" }}>{`fetch("${BASE_URL}/api/public/applications/submit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_TOKEN_HERE"
  },
  body: JSON.stringify({
    fullName: "Ko Aung",
    email: "koaung@gmail.com",
    phone: "09123456789",
    businessName: "ABC Co., Ltd.",
    businessType: "Trading",
    useCase: "Business strategy",
    plan: "bizpilot"
  })
})
.then(r => r.json())
.then(console.log);`}</pre>
            </div>
          </div>
        </div>

        {/* Endpoint docs */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white px-1">API Endpoints</h3>
          {ENDPOINTS.map((ep, i) => {
            const mc = methodColor(ep.method);
            const isOpen = expandedEndpoint === i;
            return (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(25% 0.04 220)" }}>
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 text-left transition"
                  style={{ background: isOpen ? "oklch(20% 0.05 220)" : "oklch(18% 0.05 220)" }}
                  onClick={() => setExpandedEndpoint(isOpen ? null : i)}>
                  <span className="px-2 py-0.5 rounded text-xs font-bold font-mono flex-shrink-0"
                    style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.border}` }}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-white">{ep.path}</code>
                  <span className="ml-auto flex-shrink-0">
                    {isOpen ? <ChevronDown className="w-4 h-4" style={{ color: "oklch(55% 0.03 220)" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "oklch(55% 0.03 220)" }} />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 py-4 space-y-4" style={{ background: "oklch(16% 0.04 220)", borderTop: "1px solid oklch(22% 0.04 220)" }}>
                    <p className="text-sm" style={{ color: "oklch(65% 0.03 220)" }}>{ep.description}</p>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(78% 0.12 75)" }} />
                      <span className="text-xs" style={{ color: "oklch(78% 0.12 75)" }}>Auth: {ep.auth}</span>
                    </div>
                    {ep.body && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: "oklch(55% 0.03 220)" }}>Request Body (JSON)</p>
                        <pre className="px-4 py-3 rounded-xl text-xs font-mono overflow-x-auto"
                          style={{ background: "oklch(14% 0.03 220)", color: "oklch(72% 0.18 162)", border: "1px solid oklch(22% 0.04 220)" }}>
                          {ep.body}
                        </pre>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: "oklch(55% 0.03 220)" }}>Response</p>
                      <pre className="px-4 py-3 rounded-xl text-xs font-mono overflow-x-auto"
                        style={{ background: "oklch(14% 0.03 220)", color: "oklch(65% 0.22 250)", border: "1px solid oklch(22% 0.04 220)" }}>
                        {ep.response}
                      </pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`curl -X ${ep.method} "${BASE_URL}${ep.path}" \\\n  -H "X-API-Key: YOUR_TOKEN_HERE" \\\n  -H "Content-Type: application/json"${ep.body ? ` \\\n  -d '${ep.body.replace(/\n/g, "").replace(/\s+/g, " ")}'` : ""}`, "cURL command")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={{ background: "oklch(22% 0.04 220)", color: "oklch(65% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                      <Copy className="w-3 h-3" />
                      Copy cURL
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </DashboardShell>
  );
}
