import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getSignUpUrl } from "@/const";
import { Check, Zap, Star, Crown, Lock, Menu, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

const faqs = [
  {
    q: "Starter Pack ဆိုတာ ဘာလဲ?",
    a: "Starter Pack သည် one-time purchase ဖြစ်ပြီး 20 messages ကို ပေးသည်။ Pro Plan မဝယ်မီ AI advisor ကို စမ်းကြည့်ရန် သင့်တော်သည်။",
  },
  {
    q: "ဘယ်လို ပေးချေနိုင်မလဲ?",
    a: "KBZPay, WavePay, AYAPay တို့ဖြင့် ပေးချေနိုင်ပါသည်။",
  },
  {
    q: "Payment confirm ဖြစ်ဖို့ ဘယ်လောက် ကြာမလဲ?",
    a: "Payment confirm လုပ်ပြီးနောက် ၂၄ နာရီအတွင်း account activate ဖြစ်ပါမည်။",
  },
  {
    q: "Plan ပြောင်းလို့ ရမလား?",
    a: "ဟုတ်ကဲ့၊ မည်သည့်အချိန်မဆို plan upgrade လုပ်နိုင်ပါသည်။",
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch message usage to know if starter was already purchased
  const { data: usageData } = trpc.ai.messageUsage.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const bizHasUsedStarter = usageData?.biz?.hasUsedStarter ?? false;
  const founderHasUsedStarter = usageData?.founder?.hasUsedStarter ?? false;

  const handleCTA = (planId: string) => {
    if (isAuthenticated) {
      setLocation(`/app/billing?plan=${planId}`);
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(12% 0.03 220)" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, oklch(72% 0.18 162 / 0.05) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 min-w-0"
        style={{ borderBottom: "1px solid oklch(20% 0.04 220)" }}>
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-1" onClick={() => setLocation("/")}>
          <div
            className="ph-logo-frame ph-logo-frame--nav w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0"
            style={{ border: "1px solid oklch(72% 0.18 162 / 0.25)", background: "oklch(18% 0.05 220)", boxShadow: "0 0 14px oklch(72% 0.18 162 / 0.2)" }}
          >
            <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-lg" style={{ filter: "drop-shadow(0 0 8px oklch(72% 0.18 162 / 0.5))" }} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PilotHub</p>
            <p className="text-xs truncate" style={{ color: "oklch(72% 0.18 162)" }}>by ChatPilot</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-shrink-0">
          <button type="button" onClick={() => setLocation("/pricing")} className="text-sm font-medium text-white">Pricing</button>
          <button type="button" onClick={() => setLocation("/sign-in")} className="text-sm font-medium transition" style={{ color: "oklch(60% 0.03 220)" }}>Sign In</button>
          {isAuthenticated ? (
            <button type="button" onClick={() => setLocation("/app")}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
              Dashboard
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLocation(getSignUpUrl())}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}
            >
              Sign Up
            </button>
          )}
        </div>
        <div className="flex md:hidden items-center gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <button type="button" onClick={() => setLocation("/app")}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
              Dashboard
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLocation(getSignUpUrl())}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}
            >
              Sign Up
            </button>
          )}
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 rounded-lg"
            style={{ background: "oklch(20% 0.04 220)", color: "oklch(70% 0.03 220)" }}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="relative z-10 md:hidden px-4 pb-3 space-y-2" style={{ borderBottom: "1px solid oklch(22% 0.04 220)" }}>
          <button type="button"
            onClick={() => { setLocation("/pricing"); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: "oklch(18% 0.05 220)", color: "oklch(75% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            Pricing
          </button>
          <button type="button"
            onClick={() => { setLocation("/sign-up"); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: "oklch(18% 0.05 220)", color: "oklch(75% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            Sign Up
          </button>
          <button type="button"
            onClick={() => { setLocation("/"); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: "oklch(18% 0.05 220)", color: "oklch(75% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            Home
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="relative z-10 text-center pt-12 sm:pt-16 pb-10 sm:pb-12 px-4">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-medium mb-5 sm:mb-6 max-w-full"
          style={{ background: "oklch(72% 0.18 162 / 0.1)", border: "1px solid oklch(72% 0.18 162 / 0.25)", color: "oklch(72% 0.18 162)" }}>
          <span className="leading-snug">Myanmar Kyat ဖြင့် ပေးချေနိုင်သည်</span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-1 break-words" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Simple, Transparent Pricing
        </h1>
        <p className="text-sm sm:text-base md:text-lg max-w-xl mx-auto break-words px-1" style={{ color: "oklch(60% 0.03 220)" }}>
          Myanmar business တွေနဲ့ founder တွေအတွက် ဒီဇိုင်းဆွဲထားသော AI advisor platform
        </p>
      </div>

      {/* ── BizPilot Plans ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-5 sm:mb-6 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(65% 0.22 250 / 0.15)", border: "1px solid oklch(65% 0.22 250 / 0.4)" }}>
              <Zap className="w-4 h-4" style={{ color: "oklch(65% 0.22 250)" }} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BizPilot Plans</h2>
          </div>
          <p className="text-xs sm:text-sm sm:ml-1 min-w-0 break-words" style={{ color: "oklch(55% 0.03 220)" }}>Business operators & managers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* BizPilot Free */}
          <div className="flex flex-col rounded-2xl p-6"
            style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(50% 0.03 220 / 0.2)", border: "1px solid oklch(50% 0.03 220 / 0.3)" }}>
                <Star className="w-4 h-4" style={{ color: "oklch(60% 0.03 220)" }} />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(50% 0.03 220 / 0.2)", color: "oklch(65% 0.03 220)" }}>Free</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BizPilot Free</h3>
            <p className="text-sm mb-5" style={{ color: "oklch(55% 0.03 220)" }}>စမ်းကြည့်ရန်</p>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Free</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["BizPilot AI (5 messages)", "Business Q&A", "Myanmar market insights"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "oklch(70% 0.02 220)" }}>
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(60% 0.03 220)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="w-full py-3 rounded-xl font-semibold text-sm text-center"
              style={{ background: "oklch(20% 0.04 220)", color: "oklch(55% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
              Default Plan
            </div>
          </div>

          {/* BizPilot Starter */}
          <div className="flex flex-col rounded-2xl p-6 relative"
            style={{
              background: "oklch(16% 0.05 220)",
              border: bizHasUsedStarter ? "1px solid oklch(25% 0.04 220)" : "1px solid oklch(65% 0.22 250 / 0.4)",
              boxShadow: bizHasUsedStarter ? "none" : "0 0 30px oklch(65% 0.22 250 / 0.08)",
            }}>
            {bizHasUsedStarter && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
                style={{ background: "oklch(12% 0.03 220 / 0.85)" }}>
                <div className="text-center">
                  <Lock className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(55% 0.03 220)" }} />
                  <p className="text-sm font-semibold" style={{ color: "oklch(65% 0.03 220)" }}>Already Purchased</p>
                  <p className="text-xs mt-1" style={{ color: "oklch(50% 0.03 220)" }}>Pro Plan သို့ upgrade လုပ်ပါ</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(65% 0.22 250 / 0.15)", border: "1px solid oklch(65% 0.22 250 / 0.4)" }}>
                <Zap className="w-4 h-4" style={{ color: "oklch(65% 0.22 250)" }} />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(65% 0.22 250 / 0.15)", color: "oklch(65% 0.22 250)", border: "1px solid oklch(65% 0.22 250 / 0.3)" }}>
                One-Time
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BizPilot Starter</h3>
            <p className="text-sm mb-5" style={{ color: "oklch(55% 0.03 220)" }}>တစ်ကြိမ်သာ ဝယ်ယူနိုင်သည်</p>
            <div className="mb-6">
              <span className="text-3xl font-bold" style={{ color: "oklch(65% 0.22 250)", fontFamily: "'Space Grotesk', sans-serif" }}>၂၀,၀၀၀</span>
              <span className="text-sm ml-2" style={{ color: "oklch(55% 0.03 220)" }}>ကျပ် (one-time)</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["BizPilot AI (20 messages)", "Business strategy & planning", "Operations optimization", "Myanmar market insights", "Conversation history"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "oklch(70% 0.02 220)" }}>
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(65% 0.22 250)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => !bizHasUsedStarter && handleCTA("bizpilot-starter")}
              disabled={bizHasUsedStarter}
              className="w-full py-3 rounded-xl font-semibold text-sm transition"
              style={{
                background: bizHasUsedStarter ? "oklch(20% 0.04 220)" : "oklch(65% 0.22 250)",
                color: bizHasUsedStarter ? "oklch(45% 0.03 220)" : "oklch(12% 0.03 220)",
                cursor: bizHasUsedStarter ? "not-allowed" : "pointer",
              }}>
              {bizHasUsedStarter ? "Already Purchased" : "Get Starter Pack"}
            </button>
          </div>

          {/* BizPilot Pro */}
          <div className="flex flex-col rounded-2xl p-6"
            style={{
              background: "oklch(17% 0.06 220)",
              border: "1px solid oklch(65% 0.22 250 / 0.6)",
              boxShadow: "0 0 40px oklch(65% 0.22 250 / 0.12)",
            }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(65% 0.22 250 / 0.2)", border: "1px solid oklch(65% 0.22 250 / 0.5)" }}>
                <Crown className="w-4 h-4" style={{ color: "oklch(65% 0.22 250)" }} />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(65% 0.22 250 / 0.2)", color: "oklch(65% 0.22 250)", border: "1px solid oklch(65% 0.22 250 / 0.4)" }}>
                Pro
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BizPilot Pro</h3>
            <p className="text-sm mb-5" style={{ color: "oklch(55% 0.03 220)" }}>Unlimited monthly access</p>
            <div className="mb-6">
              <span className="text-3xl font-bold" style={{ color: "oklch(65% 0.22 250)", fontFamily: "'Space Grotesk', sans-serif" }}>၁၀၀,၀၀၀</span>
              <span className="text-sm ml-2" style={{ color: "oklch(55% 0.03 220)" }}>ကျပ် / လ</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["BizPilot AI (Unlimited)", "Business strategy & planning", "Operations & process optimization", "Financial analysis & budgeting", "Marketing & sales strategy", "Myanmar market insights", "Conversation history (30 ရက်)", "Priority response time"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "oklch(75% 0.02 220)" }}>
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(65% 0.22 250)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleCTA("bizpilot")}
              className="w-full py-3 rounded-xl font-semibold text-sm transition"
              style={{ background: "oklch(65% 0.22 250)", color: "oklch(12% 0.03 220)", boxShadow: "0 0 20px oklch(65% 0.22 250 / 0.4)" }}>
              Get BizPilot Pro
            </button>
          </div>
        </div>

        {/* ── FounderPilot Plans ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-5 sm:mb-6 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(78% 0.14 85 / 0.15)", border: "1px solid oklch(78% 0.14 85 / 0.4)" }}>
              <Crown className="w-4 h-4" style={{ color: "oklch(78% 0.14 85)" }} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FounderPilot Plans</h2>
          </div>
          <p className="text-xs sm:text-sm sm:ml-1 min-w-0 break-words" style={{ color: "oklch(55% 0.03 220)" }}>Founders, CEOs & executive teams</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* FounderPilot Free */}
          <div className="flex flex-col rounded-2xl p-6"
            style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(50% 0.03 220 / 0.2)", border: "1px solid oklch(50% 0.03 220 / 0.3)" }}>
                <Star className="w-4 h-4" style={{ color: "oklch(60% 0.03 220)" }} />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(50% 0.03 220 / 0.2)", color: "oklch(65% 0.03 220)" }}>Free</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FounderPilot Free</h3>
            <p className="text-sm mb-5" style={{ color: "oklch(55% 0.03 220)" }}>စမ်းကြည့်ရန်</p>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Free</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["FounderPilot AI (5 messages)", "Strategic Q&A", "Startup insights"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "oklch(70% 0.02 220)" }}>
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(60% 0.03 220)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="w-full py-3 rounded-xl font-semibold text-sm text-center"
              style={{ background: "oklch(20% 0.04 220)", color: "oklch(55% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
              Default Plan
            </div>
          </div>

          {/* FounderPilot Starter */}
          <div className="flex flex-col rounded-2xl p-6 relative"
            style={{
              background: "oklch(16% 0.05 220)",
              border: founderHasUsedStarter ? "1px solid oklch(25% 0.04 220)" : "1px solid oklch(78% 0.14 85 / 0.4)",
              boxShadow: founderHasUsedStarter ? "none" : "0 0 30px oklch(78% 0.14 85 / 0.08)",
            }}>
            {founderHasUsedStarter && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
                style={{ background: "oklch(12% 0.03 220 / 0.85)" }}>
                <div className="text-center">
                  <Lock className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(55% 0.03 220)" }} />
                  <p className="text-sm font-semibold" style={{ color: "oklch(65% 0.03 220)" }}>Already Purchased</p>
                  <p className="text-xs mt-1" style={{ color: "oklch(50% 0.03 220)" }}>Pro Plan သို့ upgrade လုပ်ပါ</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(78% 0.14 85 / 0.15)", border: "1px solid oklch(78% 0.14 85 / 0.4)" }}>
                <Zap className="w-4 h-4" style={{ color: "oklch(78% 0.14 85)" }} />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(78% 0.14 85 / 0.15)", color: "oklch(78% 0.14 85)", border: "1px solid oklch(78% 0.14 85 / 0.3)" }}>
                One-Time
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FounderPilot Starter</h3>
            <p className="text-sm mb-5" style={{ color: "oklch(55% 0.03 220)" }}>တစ်ကြိမ်သာ ဝယ်ယူနိုင်သည်</p>
            <div className="mb-6">
              <span className="text-3xl font-bold" style={{ color: "oklch(78% 0.14 85)", fontFamily: "'Space Grotesk', sans-serif" }}>၄၀,၀၀၀</span>
              <span className="text-sm ml-2" style={{ color: "oklch(55% 0.03 220)" }}>ကျပ် (one-time)</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["FounderPilot AI (20 messages)", "Fundraising & investor strategy", "Team building & leadership", "Product-market fit analysis", "Competitive landscape mapping"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "oklch(70% 0.02 220)" }}>
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(78% 0.14 85)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => !founderHasUsedStarter && handleCTA("founderpilot-starter")}
              disabled={founderHasUsedStarter}
              className="w-full py-3 rounded-xl font-semibold text-sm transition"
              style={{
                background: founderHasUsedStarter ? "oklch(20% 0.04 220)" : "oklch(78% 0.14 85)",
                color: founderHasUsedStarter ? "oklch(45% 0.03 220)" : "oklch(12% 0.03 220)",
                cursor: founderHasUsedStarter ? "not-allowed" : "pointer",
              }}>
              {founderHasUsedStarter ? "Already Purchased" : "Get Starter Pack"}
            </button>
          </div>

          {/* FounderPilot Pro */}
          <div className="flex flex-col rounded-2xl p-6"
            style={{
              background: "oklch(17% 0.06 220)",
              border: "1px solid oklch(78% 0.14 85 / 0.6)",
              boxShadow: "0 0 40px oklch(78% 0.14 85 / 0.12)",
            }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(78% 0.14 85 / 0.2)", border: "1px solid oklch(78% 0.14 85 / 0.5)" }}>
                <Crown className="w-4 h-4" style={{ color: "oklch(78% 0.14 85)" }} />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(78% 0.14 85 / 0.2)", color: "oklch(78% 0.14 85)", border: "1px solid oklch(78% 0.14 85 / 0.4)" }}>
                Pro · Most Popular
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>FounderPilot Pro</h3>
            <p className="text-sm mb-5" style={{ color: "oklch(55% 0.03 220)" }}>Unlimited monthly access</p>
            <div className="mb-6">
              <span className="text-3xl font-bold" style={{ color: "oklch(78% 0.14 85)", fontFamily: "'Space Grotesk', sans-serif" }}>၃၀၀,၀၀၀</span>
              <span className="text-sm ml-2" style={{ color: "oklch(55% 0.03 220)" }}>ကျပ် / လ</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["BizPilot features အားလုံး ပါဝင်သည်", "FounderPilot AI (Unlimited)", "Fundraising & investor strategy", "Team building & leadership coaching", "Product-market fit analysis", "Competitive landscape mapping", "Board & stakeholder communication", "Unlimited conversation history", "Early access to new features"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "oklch(75% 0.02 220)" }}>
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(78% 0.14 85)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleCTA("founderpilot")}
              className="w-full py-3 rounded-xl font-semibold text-sm transition"
              style={{ background: "oklch(78% 0.14 85)", color: "oklch(12% 0.03 220)", boxShadow: "0 0 20px oklch(78% 0.14 85 / 0.4)" }}>
              Get FounderPilot Pro
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-4 p-6 rounded-2xl text-center"
          style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
          <h3 className="font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ပေးချေမှု နည်းလမ်းများ</h3>
          <p className="text-sm mb-2" style={{ color: "oklch(60% 0.03 220)" }}>
            KBZPay · WavePay · AYAPay
          </p>
          <p className="text-xs" style={{ color: "oklch(45% 0.03 220)" }}>
            Payment confirm လုပ်ပြီးနောက် ၂၄ နာရီအတွင်း account activate ဖြစ်ပါမည်
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            မေးလေ့ရှိသော မေးခွန်းများ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-5 rounded-2xl"
                style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                <h4 className="font-semibold text-white mb-2 text-sm">{faq.q}</h4>
                <p className="text-sm" style={{ color: "oklch(60% 0.03 220)" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-6 sm:py-8 px-4 sm:px-6 text-center"
        style={{ borderTop: "1px solid oklch(20% 0.04 220)" }}>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-3">
          <div className="ph-logo-frame ph-logo-frame--nav w-8 h-8 rounded-lg" style={{ border: "1px solid oklch(25% 0.04 220)", background: "oklch(18% 0.05 220)" }}>
            <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-md" style={{ filter: "drop-shadow(0 0 6px oklch(72% 0.18 162 / 0.4))" }} />
          </div>
          <span className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PilotHub</span>
          <span className="text-xs" style={{ color: "oklch(72% 0.18 162)" }}>by ChatPilot</span>
        </div>
        <p className="text-xs" style={{ color: "oklch(40% 0.03 220)" }}>© 2026 PilotHub by ChatPilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
