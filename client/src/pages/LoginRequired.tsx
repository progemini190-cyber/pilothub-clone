import { useLocation } from "wouter";
import { AlertTriangle, LogIn, Mail, ArrowLeft } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "/manus-storage/pilothub-logo_5dd5446d.png";

export default function LoginRequired() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  // Get email from URL query param
  const params = new URLSearchParams(window.location.search);
  const wrongEmail = params.get("email") || "";

  const handleLogoutAndRetry = async () => {
    await logout();
    window.location.href = getLoginUrl();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "oklch(12% 0.03 220)" }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          background: "oklch(16% 0.04 220)",
          border: "1px solid oklch(28% 0.08 30 / 0.6)",
          boxShadow: "0 0 40px oklch(65% 0.22 30 / 0.1)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={LOGO_URL}
            alt="PilotHub"
            className="w-14 h-14 rounded-2xl object-cover"
            style={{ filter: "drop-shadow(0 0 12px oklch(72% 0.18 162 / 0.5))" }}
          />
        </div>

        {/* Warning icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "oklch(65% 0.22 30 / 0.15)", border: "1px solid oklch(65% 0.22 30 / 0.4)" }}
        >
          <AlertTriangle className="w-8 h-8" style={{ color: "oklch(75% 0.18 55)" }} />
        </div>

        <h1 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          ဤ Google Account ဖြင့် ဝင်ခွင့်မရပါ
        </h1>

        {wrongEmail && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 mx-auto w-fit"
            style={{ background: "oklch(65% 0.22 30 / 0.1)", border: "1px solid oklch(65% 0.22 30 / 0.3)" }}
          >
            <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(65% 0.22 30)" }} />
            <span className="text-sm font-mono" style={{ color: "oklch(75% 0.18 55)" }}>
              {wrongEmail}
            </span>
          </div>
        )}

        <p className="text-sm mb-2" style={{ color: "oklch(65% 0.03 220)", lineHeight: 1.7 }}>
          ဤ email address သည် PilotHub တွင် <strong style={{ color: "oklch(75% 0.18 55)" }}>approved မဖြစ်သေး</strong> သော account ဖြစ်သည်။
        </p>

        <p className="text-sm mb-6" style={{ color: "oklch(65% 0.03 220)", lineHeight: 1.7 }}>
          Admin မှ approval email ပေးပို့ထားသော <strong className="text-white">Gmail account</strong> ဖြင့်သာ ဝင်ရောက်နိုင်ပါသည်။ Approval email ရှိပါက ထို Gmail ဖြင့် ထပ်မံ login ဝင်ပါ။
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogoutAndRetry}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
            style={{
              background: "oklch(72% 0.18 162)",
              color: "oklch(12% 0.03 220)",
              boxShadow: "0 0 20px oklch(72% 0.18 162 / 0.3)",
            }}
          >
            <LogIn className="w-4 h-4" />
            တခြား Google Account ဖြင့် Login ဝင်ပါ
          </button>

          <button
            onClick={() => setLocation("/apply")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition"
            style={{
              background: "transparent",
              color: "white",
              border: "1px solid oklch(35% 0.05 220)",
            }}
          >
            Access လျှောက်ထားပါ
          </button>

          <button
            onClick={() => setLocation("/")}
            className="flex items-center justify-center gap-1.5 text-sm transition hover:text-white"
            style={{ color: "oklch(55% 0.03 220)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home ကို ပြန်သွားပါ
          </button>
        </div>
      </div>

      {/* Help text */}
      <p className="mt-6 text-xs text-center max-w-sm" style={{ color: "oklch(45% 0.03 220)" }}>
        Approval email မရသေးပါက{" "}
        <button
          onClick={() => setLocation("/apply")}
          className="underline hover:text-white transition"
          style={{ color: "oklch(60% 0.03 220)" }}
        >
          /apply
        </button>{" "}
        မှ လျှောက်ထားနိုင်ပါသည်။
      </p>
    </div>
  );
}
