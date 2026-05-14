import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const adminLoginMutation = trpc.admin.login.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setLocation("/admin/users");
      } else {
        setError("Invalid credentials. Please try again.");
      }
      setLoading(false);
    },
    onError: (err) => {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    adminLoginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(12% 0.03 220)" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 min-w-0 flex-wrap"
        style={{ borderBottom: "1px solid oklch(20% 0.04 220)" }}>
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => setLocation("/")}>
          <div
            className="ph-logo-frame ph-logo-frame--nav w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0"
            style={{ border: "1px solid oklch(72% 0.18 162 / 0.25)", background: "oklch(18% 0.05 220)", boxShadow: "0 0 12px oklch(72% 0.18 162 / 0.2)" }}
          >
            <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-lg" style={{ filter: "drop-shadow(0 0 8px oklch(72% 0.18 162 / 0.5))" }} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PilotHub</p>
            <p className="text-xs truncate" style={{ color: "oklch(72% 0.18 162)" }}>by ChatPilot</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0 flex-wrap justify-end">
          <button onClick={() => setLocation("/pricing")} className="text-sm font-medium text-slate-400 hover:text-white transition">Pricing</button>
          <button onClick={() => setLocation("/apply")} className="text-sm font-medium text-slate-400 hover:text-white transition">Apply</button>
          <button onClick={() => setLocation("/")}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition"
            style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
            Login
          </button>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        {/* Ambient glow */}
        <div className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(72% 0.18 162 / 0.06) 0%, transparent 70%)", top: "40%", left: "50%", transform: "translate(-50%, -50%)" }} />

        <div className="w-full max-w-md relative z-10">
          <div className="p-6 sm:p-8 rounded-2xl w-full"
            style={{ background: "oklch(17% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            {/* Header */}
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Admin Control Center
            </h1>
            <p className="text-sm mb-6" style={{ color: "oklch(55% 0.03 220)" }}>
              Internal access for ChatPilot operations.
            </p>

            {/* Logo card */}
            <div className="flex items-center gap-3 p-3 rounded-xl mb-6 min-w-0"
              style={{ background: "oklch(22% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }}>
              <div
                className="ph-logo-frame ph-logo-frame--nav w-10 h-10 rounded-xl flex-shrink-0"
                style={{ border: "1px solid oklch(72% 0.18 162 / 0.2)", background: "oklch(18% 0.05 220)", boxShadow: "0 0 12px oklch(72% 0.18 162 / 0.15)" }}
              >
                <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-lg" style={{ filter: "drop-shadow(0 0 8px oklch(72% 0.18 162 / 0.5))" }} />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">PilotHub</p>
                <p className="text-xs" style={{ color: "oklch(72% 0.18 162)" }}>by ChatPilot</p>
              </div>
            </div>

            {/* Warning banner */}
            <div className="px-4 py-3 rounded-xl mb-6 text-sm font-medium"
              style={{ background: "oklch(55% 0.14 75 / 0.15)", border: "1px solid oklch(55% 0.14 75 / 0.3)", color: "oklch(78% 0.12 75)" }}>
              🔒 Restricted area: authorized admin users only.
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl mb-4 text-sm"
                style={{ background: "oklch(60% 0.22 25 / 0.15)", border: "1px solid oklch(60% 0.22 25 / 0.3)", color: "oklch(75% 0.18 25)" }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                  style={{
                    background: "oklch(22% 0.05 220)",
                    border: "1px solid oklch(28% 0.04 220)",
                    color: "white",
                  }}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                  style={{
                    background: "oklch(22% 0.05 220)",
                    border: "1px solid oklch(28% 0.04 220)",
                    color: "white",
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition"
                style={{
                  background: loading ? "oklch(55% 0.14 162)" : "oklch(72% 0.18 162)",
                  color: "oklch(12% 0.03 220)",
                  boxShadow: "0 0 20px oklch(72% 0.18 162 / 0.35)",
                }}>
                {loading ? "Signing in..." : "Sign in as Admin"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
