import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AuthPageShell } from "@/components/AuthPageShell";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { userNeedsOnboarding } from "@shared/onboarding";

const inputClass =
  "w-full px-4 py-3 rounded-xl text-sm text-white placeholder:opacity-50 outline-none focus:ring-2 transition";

const inputStyle = {
  background: "oklch(18% 0.05 220)",
  border: "1px solid oklch(28% 0.04 220)",
  color: "white",
} as const;

export default function SignIn() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, loading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await refresh();
      setLocation(data.redirectTo);
    },
    onError: (err) => toast.error(err.message || "Sign in failed"),
  });

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    setLocation(userNeedsOnboarding(user) ? "/onboarding" : "/app");
  }, [loading, isAuthenticated, user, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthPageShell title="Sign In" subtitle="Welcome back to PilotHub">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            style={inputStyle}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            style={inputStyle}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60"
          style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}
        >
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "oklch(28% 0.04 220)" }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2" style={{ background: "oklch(16% 0.04 220)", color: "oklch(55% 0.03 220)" }}>
            or
          </span>
        </div>
      </div>

      <GoogleSignInButton className="w-full" />

      <p className="text-center text-sm mt-6" style={{ color: "oklch(60% 0.03 220)" }}>
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => setLocation("/sign-up")}
          className="font-semibold underline-offset-2 hover:underline"
          style={{ color: "oklch(72% 0.18 162)" }}
        >
          Sign up
        </button>
      </p>
    </AuthPageShell>
  );
}
