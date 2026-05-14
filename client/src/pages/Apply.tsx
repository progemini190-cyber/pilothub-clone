import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Menu, X } from "lucide-react";

import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

export default function Apply() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    businessType: "",
    useCase: "",
  });

  const submitMutation = trpc.applications.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Submission failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      businessName: formData.businessName || undefined,
      businessType: formData.businessType || undefined,
      useCase: formData.useCase || undefined,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(12% 0.03 220)" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, oklch(72% 0.18 162 / 0.05) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar - Apply only, NO login button */}
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
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <button type="button" onClick={() => setLocation("/pricing")} className="text-sm font-medium transition" style={{ color: "oklch(60% 0.03 220)" }}>Pricing</button>
          <button type="button" onClick={() => setLocation("/apply")}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
            Apply
          </button>
        </div>
        <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
          <button type="button"
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
        <div className="relative z-10 sm:hidden px-4 pb-3 space-y-2" style={{ borderBottom: "1px solid oklch(22% 0.04 220)" }}>
          <button type="button"
            onClick={() => { setLocation("/pricing"); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: "oklch(18% 0.05 220)", color: "oklch(75% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            Pricing
          </button>
          <button type="button"
            onClick={() => { setLocation("/"); setMobileMenuOpen(false); }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: "oklch(18% 0.05 220)", color: "oklch(75% 0.03 220)", border: "1px solid oklch(25% 0.04 220)" }}>
            Home
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
        {submitted ? (
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "oklch(72% 0.18 162 / 0.15)", border: "2px solid oklch(72% 0.18 162 / 0.4)", boxShadow: "0 0 40px oklch(72% 0.18 162 / 0.2)" }}>
              <span className="text-4xl text-white">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Application Submitted!
            </h2>
            <p className="mb-2" style={{ color: "oklch(70% 0.03 220)" }}>
              သင်၏ application ကို လက်ခံရရှိပါပြီ။
            </p>
            <p className="text-sm mb-8" style={{ color: "oklch(60% 0.03 220)" }}>
              ChatPilot team မှ ၂၄ နာရီအတွင်း review ပြုလုပ်ပြီး login credentials ကို email ဖြင့် ပေးပို့ပါမည်။
            </p>
            <button onClick={() => setLocation("/")}
              className="px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
              Back to Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Info */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
                style={{ background: "oklch(72% 0.18 162 / 0.1)", border: "1px solid oklch(72% 0.18 162 / 0.25)", color: "oklch(72% 0.18 162)" }}>
                Apply for Access
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 break-words leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                PilotHub ကို သုံးဖို့<br />Apply လုပ်ပါ
              </h1>
              <p className="mb-8 text-sm sm:text-base break-words" style={{ color: "oklch(70% 0.03 220)" }}>
                Myanmar business operator တွေနဲ့ founder တွေအတွက် AI advisor platform — BizPilot နဲ့ FounderPilot တို့ကို access ရဖို့ apply လုပ်ပါ။
              </p>

              {/* Steps */}
              <div className="space-y-4 mb-8">
                {[
                  { step: "01", title: "Form ဖြည့်ပါ", desc: "သင်၏ business information ကို ဖြည့်သွင်းပါ" },
                  { step: "02", title: "Review", desc: "ChatPilot team မှ ၂၄ နာရီအတွင်း review လုပ်ပါမည်" },
                  { step: "03", title: "Access ရပါမည်", desc: "Login credentials ကို email ဖြင့် ပေးပို့ပါမည်" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{ background: "oklch(72% 0.18 162 / 0.12)", color: "oklch(72% 0.18 162)", border: "1px solid oklch(72% 0.18 162 / 0.25)" }}>
                      {s.step}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{s.title}</p>
                      <p className="text-sm" style={{ color: "oklch(60% 0.03 220)" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Why Apply */}
              <div className="p-5 rounded-2xl"
                style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                <h3 className="font-bold text-white mb-3 text-sm">Why Apply?</h3>
                <ul className="space-y-2">
                  {[
                    "Myanmar business context ကို နားလည်သော AI advisors",
                    "BizPilot — practical business execution support",
                    "FounderPilot — strategic decision support for CEOs",
                    "Myanmar Kyat ဖြင့် ပေးချေနိုင်",
                    "KBZPay, WavePay, AYAPay လက်ခံ",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "oklch(70% 0.03 220)" }}>
                      <span style={{ color: "oklch(72% 0.18 162)" }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Form */}
            <div className="p-5 sm:p-8 rounded-2xl w-full min-w-0"
              style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
              <h2 className="text-lg font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Application Form
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(70% 0.03 220)" }}>Full Name *</label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} required
                      placeholder="Ko Aung"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white"
                      style={{ background: "oklch(20% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(70% 0.03 220)" }}>Business Name</label>
                    <input name="businessName" value={formData.businessName} onChange={handleChange}
                      placeholder="ABC Co., Ltd."
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white"
                      style={{ background: "oklch(20% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(70% 0.03 220)" }}>Email *</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white"
                    style={{ background: "oklch(20% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(70% 0.03 220)" }}>Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="09xxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white"
                    style={{ background: "oklch(20% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(70% 0.03 220)" }}>Business Type *</label>
                  <select name="businessType" value={formData.businessType} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "oklch(20% 0.05 220)", border: "1px solid oklch(28% 0.04 220)", color: formData.businessType ? "white" : "oklch(50% 0.03 220)" }}>
                    <option value="">Select business type</option>
                    <option value="startup">Startup</option>
                    <option value="sme">SME</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="freelancer">Freelancer / Solo</option>
                    <option value="ngo">NGO / Non-profit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(70% 0.03 220)" }}>How will you use PilotHub? *</label>
                  <textarea name="useCase" value={formData.useCase} onChange={handleChange} required
                    rows={3} placeholder="Business strategy, marketing, operations..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none text-white"
                    style={{ background: "oklch(20% 0.05 220)", border: "1px solid oklch(28% 0.04 220)" }} />
                </div>
                <button type="submit" disabled={submitMutation.isPending}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60"
                  style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)", boxShadow: "0 0 20px oklch(72% 0.18 162 / 0.3)" }}>
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
