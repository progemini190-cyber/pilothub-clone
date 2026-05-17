import { useLocation } from "wouter";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

export default function LoginRequired() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason") || "";
  const isUnverified = reason === "unverified";

  const handleLogoutAndRetry = async () => {
    await logout();
    setLocation("/sign-in");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "oklch(12% 0.03 220)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          background: "oklch(16% 0.04 220)",
          border: "1px solid oklch(28% 0.08 30 / 0.6)",
          boxShadow: "0 0 40px oklch(65% 0.22 30 / 0.1)",
        }}
      >
        <div className="flex justify-center mb-6">
          <div
            className="ph-logo-frame ph-logo-frame--tile w-14 h-14 rounded-2xl"
            style={{
              border: "1px solid oklch(72% 0.18 162 / 0.3)",
              background: "oklch(18% 0.05 220)",
              boxShadow: "0 0 20px oklch(72% 0.18 162 / 0.25)",
            }}
          >
            <img
              src={LOGO_URL}
              alt="PilotHub"
              className="ph-logo-frame__img rounded-xl"
              style={{ filter: "drop-shadow(0 0 12px oklch(72% 0.18 162 / 0.5))" }}
            />
          </div>
        </div>

        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            background: "oklch(65% 0.22 30 / 0.15)",
            border: "1px solid oklch(65% 0.22 30 / 0.4)",
          }}
        >
          <AlertTriangle className="w-8 h-8" style={{ color: "oklch(75% 0.18 55)" }} />
        </div>

        <h1
          className="text-xl font-bold text-white mb-3"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {isUnverified ? "Verify your Google account" : "Sign in required"}
        </h1>

        <p className="text-sm mb-6" style={{ color: "oklch(65% 0.03 220)", lineHeight: 1.7 }}>
          {isUnverified
            ? "Use a Google account with a verified email address, or sign up with email and password."
            : "Please sign in or create an account to access PilotHub."}
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setLocation("/sign-in")}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setLocation("/sign-up")}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{
              background: "transparent",
              color: "white",
              border: "1px solid oklch(40% 0.05 220)",
            }}
          >
            Sign Up
          </button>
          <GoogleSignInButton className="w-full" />
          <button
            type="button"
            onClick={handleLogoutAndRetry}
            className="w-full text-xs mt-2 underline"
            style={{ color: "oklch(55% 0.03 220)" }}
          >
            Sign out and try again
          </button>
        </div>
      </div>
    </div>
  );
}
