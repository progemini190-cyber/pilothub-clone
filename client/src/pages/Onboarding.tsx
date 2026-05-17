import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AuthPageShell } from "@/components/AuthPageShell";
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

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated, refresh } = useAuth();
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState("");

  const completeMutation = trpc.auth.completeOnboarding.useMutation({
    onSuccess: async (data) => {
      await refresh();
      setLocation(data.redirectTo);
    },
    onError: (err) => toast.error(err.message || "Could not save your profile"),
  });

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation("/sign-in");
      return;
    }
    if (user && !userNeedsOnboarding(user)) {
      setLocation("/app");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.useCase) setUseCase(user.useCase);
  }, [user?.name, user?.useCase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeMutation.mutate({ name: name.trim(), useCase: useCase.trim() });
  };

  if (loading || !isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(12% 0.03 220)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "oklch(72% 0.18 162 / 0.4)" }}
        />
      </div>
    );
  }

  return (
    <AuthPageShell
      title="Welcome to PilotHub"
      subtitle="Tell us a bit about yourself to get started"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>
            နာမည် (Name) <span style={{ color: "oklch(72% 0.18 162)" }}>*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            style={inputStyle}
            placeholder="သင်၏ နာမည်"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(65% 0.03 220)" }}>
            PilotHub အသုံးပြုမည့် ရည်ရွယ်ချက် (Purpose){" "}
            <span style={{ color: "oklch(72% 0.18 162)" }}>*</span>
          </label>
          <textarea
            required
            rows={4}
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            className={`${inputClass} resize-none`}
            style={inputStyle}
            placeholder="ဥပမာ — စီးပွားရေးဆိုင်ရာ ဆုံးဖြတ်ချက်များအတွက် AI advisor အသုံးပြုမည်"
          />
        </div>
        <button
          type="submit"
          disabled={completeMutation.isPending}
          className="w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60"
          style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}
        >
          {completeMutation.isPending ? "Saving..." : "Continue to Dashboard →"}
        </button>
      </form>
    </AuthPageShell>
  );
}
