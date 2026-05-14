import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { CheckCircle, Upload, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

type PlanId = "bizpilot-starter" | "bizpilot-pro" | "founderpilot-starter" | "founderpilot-pro";

const PLANS: Array<{
  id: PlanId;
  name: string;
  tag: string;
  price: number;
  priceStr: string;
  period: string;
  description: string;
  features: string[];
  accentColor: string;
  glowBg: string;
  glowBorder: string;
}> = [
  {
    id: "bizpilot-starter",
    name: "BizPilot",
    tag: "Starter Pack",
    price: 20000,
    priceStr: "၂၀,၀၀၀",
    period: "one-time",
    description: "Business operators & managers",
    features: ["BizPilot AI 20 messages", "Business strategy", "Operations & finance", "Myanmar market insights"],
    accentColor: "oklch(65% 0.22 250)",
    glowBg: "oklch(65% 0.22 250 / 0.1)",
    glowBorder: "oklch(65% 0.22 250 / 0.3)",
  },
  {
    id: "bizpilot-pro",
    name: "BizPilot",
    tag: "Pro",
    price: 100000,
    priceStr: "၁၀၀,၀၀၀",
    period: "တစ်လ",
    description: "Business operators & managers",
    features: ["BizPilot AI (Unlimited)", "Business strategy", "Operations & finance", "Myanmar market insights", "History 30 ရက်"],
    accentColor: "oklch(65% 0.22 250)",
    glowBg: "oklch(65% 0.22 250 / 0.1)",
    glowBorder: "oklch(65% 0.22 250 / 0.3)",
  },
  {
    id: "founderpilot-starter",
    name: "FounderPilot",
    tag: "Starter Pack",
    price: 40000,
    priceStr: "၄၀,၀၀၀",
    period: "one-time",
    description: "Founders, CEOs & executive teams",
    features: ["FounderPilot AI 20 messages", "Fundraising strategy", "Leadership coaching", "Strategic decision support"],
    accentColor: "oklch(78% 0.14 85)",
    glowBg: "oklch(78% 0.14 85 / 0.1)",
    glowBorder: "oklch(78% 0.14 85 / 0.3)",
  },
  {
    id: "founderpilot-pro",
    name: "FounderPilot",
    tag: "Pro",
    price: 300000,
    priceStr: "၃၀၀,၀၀၀",
    period: "တစ်လ",
    description: "Founders, CEOs & executive teams",
    features: ["BizPilot features အားလုံး", "FounderPilot AI (Unlimited)", "Fundraising strategy", "Leadership coaching", "Unlimited history"],
    accentColor: "oklch(78% 0.14 85)",
    glowBg: "oklch(78% 0.14 85 / 0.1)",
    glowBorder: "oklch(78% 0.14 85 / 0.3)",
  },
];

const PAYMENT_METHODS = [
  { id: "kbzpay", name: "KBZPay", color: "oklch(72% 0.18 162)" },
  { id: "wavepay", name: "WavePay", color: "oklch(65% 0.22 250)" },
  { id: "ayapay", name: "AYAPay", color: "oklch(78% 0.14 85)" },
];

export default function Billing() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-select plan from URL query param (e.g. ?plan=bizpilot-starter)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    if (planParam && PLANS.find(p => p.id === planParam)) {
      setSelectedPlan(planParam as PlanId);
    }
  }, []);

  const { data: paymentSettings } = trpc.payments.settings.useQuery();
  const uploadScreenshot = trpc.payments.uploadScreenshot.useMutation();
  const submitPayment = trpc.payments.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Payment submission received! Admin review ၂၄ နာရီအတွင်း ပြုလုပ်ပါမည်။");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Submission failed. Please try again.");
      setSubmitting(false);
    },
  });
  const { data: myPaymentsData } = trpc.payments.myPayments.useQuery();
  const myPayments = myPaymentsData?.payments;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ဖိုင်အရွယ်အစား 5MB ထက်မကျော်ပါနှင့်");
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !selectedPayment) {
      toast.error("Plan နှင့် Payment method ရွေးချယ်ပါ");
      return;
    }
    setSubmitting(true);
    try {
      let screenshotUrl: string | undefined;
      if (screenshotFile) {
        const arrayBuffer = await screenshotFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
        const base64 = btoa(binary);
        const result = await uploadScreenshot.mutateAsync({
          filename: screenshotFile.name,
          contentType: screenshotFile.type,
          dataBase64: base64,
        });
        screenshotUrl = result.url;
      }
      await submitPayment.mutateAsync({
        plan: selectedPlan as any,
        paymentMethod: selectedPayment,
        transactionRef: transactionRef.trim() || undefined,
        screenshotUrl,
      });
    } catch {
      setSubmitting(false);
    }
  };

  const accentGreen = "oklch(72% 0.18 162)";
  return (
    <DashboardShell activeTab="billing">
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Billing
          </h1>
          <p className="text-sm" style={{ color: "oklch(55% 0.03 220)" }}>Plan ရွေးချယ်ပြီး ငွေပေးချေပါ</p>
        </div>

        {submitted ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "oklch(15% 0.04 220)", border: "1px solid oklch(22% 0.04 220)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "oklch(72% 0.18 162 / 0.15)", border: "1px solid oklch(72% 0.18 162 / 0.3)" }}>
              <CheckCircle className="w-8 h-8" style={{ color: accentGreen }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Payment Submitted!
            </h2>
            <p className="text-sm mb-6" style={{ color: "oklch(65% 0.03 220)" }}>
              Admin မှ ၂၄ နာရီအတွင်း review ပြုလုပ်ပြီး account activate ဖြစ်ပါမည်
            </p>
            <button onClick={() => setLocation("/app")}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: accentGreen, color: "oklch(12% 0.03 220)" }}>
              Dashboard သို့ ပြန်သွားပါ
            </button>
          </div>
        ) : (
          <>
            {/* Current plan info */}
            {user && (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "oklch(15% 0.04 220)", border: "1px solid oklch(22% 0.04 220)" }}>
                <img src={LOGO_URL} alt="" className="w-10 h-10 rounded-xl object-contain" />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "oklch(50% 0.03 220)" }}>Current Plan</p>
                  <p className="font-bold text-white text-sm capitalize" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {(user as any).subscriptionPlan || "Free Trial"}
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Plan */}
            <div className="rounded-2xl p-6" style={{ background: "oklch(15% 0.04 220)", border: "1px solid oklch(22% 0.04 220)" }}>
              <h2 className="font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: accentGreen, color: "oklch(12% 0.03 220)" }}>1</span>
                Plan ရွေးချယ်ပါ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                      className="text-left p-5 rounded-xl transition"
                      style={{
                        background: isSelected ? plan.glowBg : "oklch(18% 0.04 220)",
                        border: `1px solid ${isSelected ? plan.accentColor : "oklch(25% 0.04 220)"}`,
                        boxShadow: isSelected ? `0 0 20px ${plan.accentColor}20` : "none",
                      }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative flex-shrink-0"
                          style={{ background: plan.glowBg, border: `1px solid ${plan.glowBorder}` }}>
                          <img src={LOGO_URL} alt="" className="w-7 h-7 rounded-lg object-contain" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full"
                            style={{ background: plan.accentColor, boxShadow: `0 0 6px ${plan.accentColor}` }} />
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: plan.accentColor }}>
                            {plan.name}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: plan.glowBg, color: plan.accentColor, border: `1px solid ${plan.glowBorder}` }}>
                            {plan.tag}
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="text-2xl font-extrabold" style={{ color: plan.accentColor, fontFamily: "'Space Grotesk', sans-serif" }}>
                          {plan.priceStr}
                        </span>
                        <span className="text-xs ml-1" style={{ color: "oklch(55% 0.03 220)" }}>ကျပ် / {plan.period}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "oklch(70% 0.02 220)" }}>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: plan.accentColor }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Payment method */}
            <div className="rounded-2xl p-6" style={{ background: "oklch(15% 0.04 220)", border: "1px solid oklch(22% 0.04 220)" }}>
              <h2 className="font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: accentGreen, color: "oklch(12% 0.03 220)" }}>2</span>
                ငွေပေးချေမှု နည်းလမ်း ရွေးချယ်ပါ
              </h2>
              <div className="flex flex-wrap gap-3 mb-4">
                {PAYMENT_METHODS.map((pm) => (
                  <button key={pm.id} onClick={() => setSelectedPayment(pm.id)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                    style={{
                      background: selectedPayment === pm.id ? `${pm.color}20` : "oklch(18% 0.04 220)",
                      border: `1px solid ${selectedPayment === pm.id ? pm.color : "oklch(25% 0.04 220)"}`,
                      color: selectedPayment === pm.id ? pm.color : "oklch(65% 0.03 220)",
                    }}>
                    {pm.name}
                  </button>
                ))}
              </div>

              {/* Payment info - per selected method */}
              {(() => {
                const methodKey = selectedPayment as "kbzpay" | "wavepay" | "ayapay";
                const mInfo = paymentSettings?.[methodKey];
                const phone = mInfo?.phone || paymentSettings?.phone;
                const name = mInfo?.name || paymentSettings?.kpayName;
                const qrUrl = mInfo?.qrUrl || paymentSettings?.qrUrl;
                if (!phone && !qrUrl) return null;
                return (
                  <>
                    {phone && (
                      <div className="p-4 rounded-xl mb-4" style={{ background: "oklch(18% 0.04 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                        <p className="text-xs mb-2" style={{ color: "oklch(55% 0.03 220)" }}>ငွေလွှဲရမည့် ဖုန်းနံပါတ်</p>
                        <p className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{phone}</p>
                        {name && <p className="text-sm mt-1" style={{ color: "oklch(65% 0.03 220)" }}>Name: {name}</p>}
                        {selectedPlan && (
                          <p className="text-sm mt-2 font-semibold" style={{ color: accentGreen }}>
                            Amount: {PLANS.find(p => p.id === selectedPlan)?.priceStr} ကျပ်
                          </p>
                        )}
                      </div>
                    )}
                    {qrUrl && (
                      <div className="p-4 rounded-xl mb-4 text-center" style={{ background: "oklch(18% 0.04 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                        <p className="text-xs mb-3" style={{ color: "oklch(55% 0.03 220)" }}>QR Code ဖြင့် ငွေလွှဲပါ</p>
                        <img src={qrUrl} alt="Payment QR" className="w-40 h-40 mx-auto rounded-xl object-cover" />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Step 3: Screenshot */}
            <div className="rounded-2xl p-6" style={{ background: "oklch(15% 0.04 220)", border: "1px solid oklch(22% 0.04 220)" }}>
              <h2 className="font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: accentGreen, color: "oklch(12% 0.03 220)" }}>3</span>
                ငွေလွှဲပြေစာ Upload လုပ်ပါ
              </h2>
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition"
                style={{ borderColor: screenshotPreview ? accentGreen : "oklch(28% 0.04 220)", background: screenshotPreview ? "oklch(72% 0.18 162 / 0.05)" : "oklch(18% 0.04 220)" }}
                onClick={() => fileInputRef.current?.click()}>
                {screenshotPreview ? (
                  <div className="relative">
                    <img src={screenshotPreview} alt="Receipt" className="max-h-48 mx-auto rounded-xl object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setScreenshotFile(null); setScreenshotPreview(null); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "oklch(60% 0.22 25)", color: "white" }}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(45% 0.03 220)" }} />
                    <p className="text-sm font-medium" style={{ color: "oklch(65% 0.03 220)" }}>
                      ငွေလွှဲပြေစာ screenshot ကို ဒီနေရာတွင် upload လုပ်ပါ
                    </p>
                    <p className="text-xs mt-1" style={{ color: "oklch(45% 0.03 220)" }}>PNG, JPG, WEBP · max 5MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              {/* Optional transaction ref */}
              <div className="mt-4">
                <label className="text-xs mb-2 block" style={{ color: "oklch(55% 0.03 220)" }}>
                  Transaction Reference (optional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="e.g. TXN123456789"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(18% 0.04 220)",
                    border: "1px solid oklch(28% 0.04 220)",
                    color: "white",
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedPlan || !selectedPayment}
              className="w-full py-4 rounded-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: accentGreen, color: "oklch(12% 0.03 220)" }}>
              {submitting ? "Submitting..." : "Payment Submission ပေးပို့ပါ"}
            </button>
            <p className="text-xs text-center" style={{ color: "oklch(45% 0.03 220)" }}>
              Admin မှ ၂၄ နာရီအတွင်း review ပြုလုပ်ပြီး account activate ဖြစ်ပါမည်
            </p>
          </>
        )}

        {/* Payment history */}
        {myPayments && myPayments.length > 0 && (
          <div className="mt-8">
            <h2 className="font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Payment History
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(22% 0.04 220)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "oklch(18% 0.04 220)", borderBottom: "1px solid oklch(22% 0.04 220)" }}>
                    {["Plan", "Amount", "Method", "Status", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "oklch(55% 0.03 220)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myPayments?.map((p, i: number) => (
                    <tr key={p.id} style={{
                      background: i % 2 === 0 ? "oklch(15% 0.04 220)" : "oklch(14% 0.03 220)",
                      borderBottom: "1px solid oklch(20% 0.04 220)"
                    }}>
                      <td className="px-4 py-3 text-white font-medium">{p.plan}</td>
                      <td className="px-4 py-3 text-white">{p.amount.toLocaleString()} ကျပ်</td>
                      <td className="px-4 py-3" style={{ color: "oklch(65% 0.03 220)" }}>{p.paymentMethod ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: p.status === "confirmed" ? "oklch(72% 0.18 162 / 0.15)"
                              : p.status === "rejected" ? "oklch(60% 0.22 25 / 0.15)"
                              : "oklch(78% 0.14 85 / 0.15)",
                            color: p.status === "confirmed" ? "oklch(72% 0.18 162)"
                              : p.status === "rejected" ? "oklch(70% 0.22 25)"
                              : "oklch(78% 0.14 85)",
                          }}>
                          {p.status === "confirmed" ? "Confirmed" : p.status === "rejected" ? "Rejected" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "oklch(55% 0.03 220)" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
