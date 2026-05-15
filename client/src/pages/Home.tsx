import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

export default function Home() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "Apply", href: "/apply" },
  ];

  return (
    <div className="min-h-screen text-foreground" style={{ background: "oklch(12% 0.03 220)" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50"
        style={{ background: "oklch(12% 0.03 220 / 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid oklch(25% 0.04 220)" }}>
        <div className="flex items-center justify-between gap-2 px-4 md:px-6 py-3 min-w-0">
          {/* Logo + Name */}
          <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer min-w-0 flex-1 md:flex-initial" onClick={() => setLocation("/")}>
            <div
              className="ph-logo-frame ph-logo-frame--nav w-9 h-9 rounded-xl flex-shrink-0"
              style={{ border: "1px solid oklch(72% 0.18 162 / 0.25)", background: "oklch(18% 0.05 220)", boxShadow: "0 0 14px oklch(72% 0.18 162 / 0.25)" }}
            >
              <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-lg" style={{ filter: "drop-shadow(0 0 8px oklch(72% 0.18 162 / 0.6))" }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white leading-none text-sm truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PilotHub</p>
              <p className="text-xs truncate" style={{ color: "oklch(72% 0.18 162)" }}>by ChatPilot</p>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            {navLinks.map(l => (
              <button key={l.href} onClick={() => setLocation(l.href)}
                className="text-sm font-medium transition hover:text-white"
                style={{ color: "oklch(70% 0.03 220)" }}>
                {l.label}
              </button>
            ))}
            {isAuthenticated ? (
              <button onClick={() => setLocation("/app")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition"
                style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                Dashboard
              </button>
            ) : (
              <GoogleSignInButton size="compact" className="!shadow-none" />
            )}
          </div>

          <div className="flex md:hidden items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <button onClick={() => setLocation("/app")}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                Dashboard
              </button>
            ) : (
              <GoogleSignInButton size="compact" className="!px-2.5 !py-1.5 !text-xs !shadow-none" />
            )}
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg flex-shrink-0"
              style={{ background: "oklch(20% 0.04 220)", color: "oklch(70% 0.03 220)" }}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2"
            style={{ borderTop: "1px solid oklch(22% 0.04 220)" }}>
            {navLinks.map(l => (
              <button key={l.href}
                onClick={() => { setLocation(l.href); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition"
                style={{ background: "oklch(18% 0.05 220)", color: "oklch(75% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex items-center pt-20 pb-16"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(72% 0.18 162 / 0.08) 0%, transparent 70%), oklch(12% 0.03 220)", minHeight: "100vh" }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(oklch(25% 0.04 220 / 0.2) 1px, transparent 1px), linear-gradient(90deg, oklch(25% 0.04 220 / 0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="container relative z-10">
          <div className="max-w-2xl">
            {/* Logo hero display */}
            <div
              className="ph-logo-frame ph-logo-frame--tile mb-6 w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-2xl"
              style={{
                border: "1px solid oklch(72% 0.18 162 / 0.35)",
                background: "oklch(16% 0.04 220)",
                boxShadow: "0 0 24px oklch(72% 0.18 162 / 0.35), inset 0 0 12px oklch(72% 0.18 162 / 0.08)",
              }}
            >
              <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-xl" style={{ filter: "drop-shadow(0 0 20px oklch(72% 0.18 162 / 0.6))" }} />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 max-w-full"
              style={{ background: "oklch(72% 0.18 162 / 0.12)", border: "1px solid oklch(72% 0.18 162 / 0.3)", color: "oklch(72% 0.18 162)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: "oklch(72% 0.18 162)" }} />
              <span className="text-left leading-snug">Myanmar Business AI Guide Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 break-words" style={{ fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.15 }}>
              PilotHub
            </h1>

            <p className="mb-8 text-sm sm:text-base max-w-prose" style={{ color: "oklch(65% 0.03 220)", lineHeight: 1.7 }}>
              BizPilot powers practical execution. FounderPilot delivers strategic decision support for CEOs and executive teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:flex-wrap">
              {isAuthenticated ? (
                <button onClick={() => setLocation("/app")}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm transition w-full sm:w-auto text-center"
                  style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)", boxShadow: "0 0 20px oklch(72% 0.18 162 / 0.4)" }}>
                  Dashboard သို့ ဝင်ရောက်ပါ →
                </button>
              ) : (
                <>
                  <GoogleSignInButton
                    className="w-full sm:w-auto !shadow-md"
                  />
                  <button onClick={() => setLocation("/apply")}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm transition w-full sm:w-auto text-center"
                    style={{ background: "transparent", color: "white", border: "1px solid oklch(40% 0.05 220)" }}>
                    Apply for Access
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Advisors ── */}
      <section className="py-16" style={{ background: "oklch(15% 0.04 220)" }}>
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Meet Your AI Advisors</h2>
            <p style={{ color: "oklch(60% 0.03 220)" }}>Two specialized AI personas designed to help you succeed</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* BizPilot */}
            <div className="p-5 sm:p-8 rounded-2xl relative overflow-hidden transition sm:hover:scale-[1.02]"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(65% 0.22 250 / 0.3)", boxShadow: "0 0 30px oklch(65% 0.22 250 / 0.1)" }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, oklch(65% 0.22 250 / 0.15) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
              <div
                className="ph-logo-frame ph-logo-frame--tile w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-2xl mb-5 sm:mb-6"
                style={{
                  background: "oklch(22% 0.05 220)",
                  boxShadow: "0 0 20px oklch(65% 0.22 250 / 0.4), 0 0 50px oklch(65% 0.22 250 / 0.15)",
                  border: "1px solid oklch(65% 0.22 250 / 0.35)",
                }}
              >
                <div className="ph-logo-frame__inset rounded-2xl" style={{ boxShadow: "inset 0 0 15px oklch(65% 0.22 250 / 0.3)" }} />
                <img src={LOGO_URL} alt="BizPilot" className="ph-logo-frame__img rounded-xl" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <span style={{ background: "linear-gradient(135deg, oklch(65% 0.22 250), oklch(75% 0.18 250))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  BizPilot
                </span>
              </h3>
              <p className="mb-6 text-sm sm:text-base break-words" style={{ color: "oklch(65% 0.03 220)" }}>
                Business strategy and operations advisor. Powers practical execution for business leaders and operators.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Strategy", "Operations", "Growth", "Finance"].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: "oklch(65% 0.22 250 / 0.12)", color: "oklch(65% 0.22 250)", border: "1px solid oklch(65% 0.22 250 / 0.25)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* FounderPilot */}
            <div className="p-5 sm:p-8 rounded-2xl relative overflow-hidden transition sm:hover:scale-[1.02]"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(78% 0.12 75 / 0.3)", boxShadow: "0 0 30px oklch(78% 0.12 75 / 0.1)" }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, oklch(78% 0.12 75 / 0.15) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
              <div
                className="ph-logo-frame ph-logo-frame--tile w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-2xl mb-5 sm:mb-6"
                style={{
                  background: "oklch(22% 0.05 220)",
                  boxShadow: "0 0 20px oklch(78% 0.12 75 / 0.4), 0 0 50px oklch(78% 0.12 75 / 0.15)",
                  border: "1px solid oklch(78% 0.12 75 / 0.35)",
                }}
              >
                <div className="ph-logo-frame__inset rounded-2xl" style={{ boxShadow: "inset 0 0 15px oklch(78% 0.12 75 / 0.3)" }} />
                <img src={LOGO_URL} alt="FounderPilot" className="ph-logo-frame__img rounded-xl" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <span style={{ background: "linear-gradient(135deg, oklch(78% 0.12 75), oklch(88% 0.10 75))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  FounderPilot
                </span>
              </h3>
              <p className="mb-6 text-sm sm:text-base break-words" style={{ color: "oklch(65% 0.03 220)" }}>
                Strategic advisor for founders and CEOs. Delivers decision support for executive teams and vision-setting.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Vision", "Fundraising", "Team", "Leadership"].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: "oklch(78% 0.12 75 / 0.12)", color: "oklch(78% 0.12 75)", border: "1px solid oklch(78% 0.12 75 / 0.25)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16" style={{ background: "oklch(12% 0.03 220)" }}>
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Why PilotHub?</h2>
            <p style={{ color: "oklch(60% 0.03 220)" }}>Built specifically for Myanmar business leaders</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: "🧠", title: "AI-Powered Insights", desc: "Get expert business advice powered by cutting-edge AI technology tailored for your context." },
              { icon: "🇲🇲", title: "Myanmar-Focused", desc: "Advice grounded in Myanmar market realities, regulations, and business culture." },
              { icon: "🔒", title: "Private & Secure", desc: "Your conversations are private. Enterprise-grade security for sensitive business discussions." },
              { icon: "⚡", title: "Instant Responses", desc: "Get strategic advice in seconds, not days. Available 24/7 for urgent decisions." },
              { icon: "📊", title: "Data-Driven", desc: "Recommendations backed by market data and proven business frameworks." },
              { icon: "🎯", title: "Actionable Plans", desc: "Not just advice — concrete action plans you can implement immediately." },
            ].map((f) => (
              <div key={f.title} className="p-5 sm:p-6 rounded-2xl transition sm:hover:scale-[1.02]"
                style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
                <p className="text-sm break-words" style={{ color: "oklch(60% 0.03 220)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16" style={{ background: "oklch(15% 0.04 220)" }}>
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to pilot your business?
          </h2>
          <p className="text-sm md:text-base mb-8 max-w-2xl mx-auto" style={{ color: "oklch(60% 0.03 220)" }}>
            Join Myanmar's leading business founders and operators who use PilotHub to make smarter decisions.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => setLocation("/pricing")}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)", boxShadow: "0 0 24px oklch(72% 0.18 162 / 0.4)" }}>
              View Pricing
            </button>
            <button onClick={() => setLocation("/apply")}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition"
              style={{ background: "transparent", color: "white", border: "1px solid oklch(40% 0.05 220)" }}>
              Apply for Access
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8" style={{ background: "oklch(10% 0.03 220)", borderTop: "1px solid oklch(20% 0.04 220)" }}>
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div
              className="ph-logo-frame ph-logo-frame--nav w-10 h-10 rounded-xl"
              style={{ border: "1px solid oklch(72% 0.18 162 / 0.25)", background: "oklch(18% 0.05 220)", boxShadow: "0 0 12px oklch(72% 0.18 162 / 0.2)" }}
            >
              <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-lg" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">PilotHub</p>
              <p className="text-xs" style={{ color: "oklch(72% 0.18 162)" }}>by ChatPilot</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "oklch(50% 0.03 220)" }}>
            © 2026 ChatPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
