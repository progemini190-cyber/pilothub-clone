import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

type AuthPageShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthPageShell({ children, title, subtitle }: AuthPageShellProps) {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(12% 0.03 220)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, oklch(72% 0.18 162 / 0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      <nav
        className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 min-w-0"
        style={{ borderBottom: "1px solid oklch(20% 0.04 220)" }}
      >
        <button
          type="button"
          className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 text-left"
          onClick={() => setLocation("/")}
        >
          <div
            className="ph-logo-frame ph-logo-frame--nav w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0"
            style={{
              border: "1px solid oklch(72% 0.18 162 / 0.25)",
              background: "oklch(18% 0.05 220)",
              boxShadow: "0 0 14px oklch(72% 0.18 162 / 0.2)",
            }}
          >
            <img
              src={LOGO_URL}
              alt="PilotHub"
              className="ph-logo-frame__img rounded-lg"
              style={{ filter: "drop-shadow(0 0 8px oklch(72% 0.18 162 / 0.5))" }}
            />
          </div>
          <div className="min-w-0">
            <p
              className="font-bold text-white text-sm truncate"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              PilotHub
            </p>
            <p className="text-xs truncate" style={{ color: "oklch(72% 0.18 162)" }}>
              by ChatPilot
            </p>
          </div>
        </button>
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setLocation("/sign-in")}
            className="text-sm font-medium transition"
            style={{ color: "oklch(60% 0.03 220)" }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setLocation("/sign-up")}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}
          >
            Sign Up
          </button>
        </div>
        <button
          type="button"
          className="flex sm:hidden p-2 rounded-lg"
          style={{ background: "oklch(20% 0.04 220)", color: "oklch(70% 0.03 220)" }}
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div
          className="relative z-10 sm:hidden px-4 pb-3 space-y-2"
          style={{ borderBottom: "1px solid oklch(22% 0.04 220)" }}
        >
          <button
            type="button"
            onClick={() => {
              setLocation("/sign-in");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: "oklch(18% 0.05 220)",
              color: "oklch(75% 0.03 220)",
              border: "1px solid oklch(25% 0.04 220)",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setLocation("/sign-up");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: "oklch(72% 0.18 162 / 0.15)",
              color: "oklch(72% 0.18 162)",
              border: "1px solid oklch(72% 0.18 162 / 0.3)",
            }}
          >
            Sign Up
          </button>
        </div>
      )}

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm" style={{ color: "oklch(60% 0.03 220)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "oklch(16% 0.04 220)",
              border: "1px solid oklch(25% 0.04 220)",
              boxShadow: "0 0 40px oklch(72% 0.18 162 / 0.06)",
            }}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
