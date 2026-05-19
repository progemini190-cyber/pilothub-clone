import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Zap, Lightbulb, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

const GEMINI_MODELS = [
  { value: "gemini-1.5-flash-latest", label: "Gemini 1.5 Flash (Vision, Recommended)" },
  { value: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro (Vision)" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
];

const OPENAI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommended)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

const ALL_MODELS = [...OPENAI_MODELS, ...GEMINI_MODELS];

const MODEL_CONFIGS = [
  {
    slug: "bizpilot" as const,
    name: "BizPilot",
    description: "Business strategy and operations advisor for Myanmar business operators.",
    glowColor: "oklch(65% 0.22 250)",
    glowBg: "oklch(65% 0.22 250 / 0.12)",
    glowBorder: "oklch(65% 0.22 250 / 0.3)",
    icon: Zap,
    tags: ["Strategy", "Operations", "Growth", "Finance"],
  },
  {
    slug: "founderpilot" as const,
    name: "FounderPilot",
    description: "Strategic advisor for founders and CEOs delivering decision support.",
    glowColor: "oklch(78% 0.12 75)",
    glowBg: "oklch(78% 0.12 75 / 0.12)",
    glowBorder: "oklch(78% 0.12 75 / 0.3)",
    icon: Lightbulb,
    tags: ["Vision", "Fundraising", "Team", "Leadership"],
  },
];

export default function AdminModels() {
  const [, setLocation] = useLocation();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.admin.models.list.useQuery(undefined, {
    retry: false,
    onError: () => setLocation("/admin/login"),
  } as any);

  const updateModel = trpc.admin.models.update.useMutation({
    onSuccess: () => {
      refetch();
      setSaving(null);
      toast.success("Model updated successfully!");
    },
    onError: (err: { message?: string }) => {
      setSaving(null);
      toast.error(err.message || "Failed to update model");
    },
  });

  const dbModels = (data?.models as any[]) ?? [];

  const getModelString = (slug: string) => {
    if (editValues[slug] !== undefined) return editValues[slug];
    const dbModel = dbModels.find((m: any) => m.targetRole === slug);
    return dbModel?.modelString ?? "gemini-2.5-pro";
  };

  const handleSave = (slug: "bizpilot" | "founderpilot") => {
    const modelString = getModelString(slug);
    setSaving(slug);
    updateModel.mutate({ targetRole: slug, modelString });
  };

  const getModelLabel = (value: string) => {
    return ALL_MODELS.find(m => m.value === value)?.label ?? value;
  };

  const inputStyle = {
    background: "oklch(20% 0.05 220)",
    border: "1px solid oklch(30% 0.04 220)",
    color: "white",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
  } as React.CSSProperties;

  return (
    <DashboardShell title="AI Model Configuration" activeTab="models" isAdminShell>
      <div className="space-y-6">
        <p className="text-sm" style={{ color: "oklch(55% 0.03 220)" }}>
          Configure which AI model each advisor uses. Gemini 2.5 Pro is recommended for best performance.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(72% 0.18 162)" }} />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {MODEL_CONFIGS.map((model) => {
              const Icon = model.icon;
              const currentModel = getModelString(model.slug);
              const isSaving = saving === model.slug;

              return (
                <div key={model.slug} className="p-6 rounded-2xl relative overflow-hidden"
                  style={{ background: "oklch(18% 0.05 220)", border: `1px solid ${model.glowBorder}` }}>
                  {/* Glow orb */}
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${model.glowColor} 0%, transparent 70%)`, opacity: 0.12, transform: "translate(30%, -30%)" }} />

                  {/* Header */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl ph-logo-frame ph-logo-frame--nav flex-shrink-0"
                      style={{ background: "oklch(22% 0.05 220)" }}>
                      <img src={LOGO_URL} alt={model.name} className="ph-logo-frame__img rounded-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: model.glowColor }}>
                        {model.name}
                      </h3>
                      <p className="text-sm" style={{ color: "oklch(60% 0.03 220)" }}>{model.description}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {model.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: model.glowBg, color: model.glowColor, border: `1px solid ${model.glowBorder}` }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Model selector */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: model.glowColor }}>
                      AI Model
                    </label>

                    {/* Gemini group */}
                    <div className="mb-2">
                      <p className="text-xs mb-1.5 font-medium" style={{ color: "oklch(50% 0.03 220)" }}>Google Gemini</p>
                      <div className="space-y-1.5">
                        {GEMINI_MODELS.map(m => (
                          <label key={m.value}
                            className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                            style={{
                              background: currentModel === m.value ? model.glowBg : "oklch(20% 0.05 220)",
                              border: `1px solid ${currentModel === m.value ? model.glowBorder : "oklch(26% 0.04 220)"}`,
                            }}>
                            <input
                              type="radio"
                              name={`model-${model.slug}`}
                              value={m.value}
                              checked={currentModel === m.value}
                              onChange={() => setEditValues(prev => ({ ...prev, [model.slug]: m.value }))}
                              style={{ accentColor: model.glowColor }}
                            />
                            <span className="text-sm" style={{ color: currentModel === m.value ? model.glowColor : "oklch(70% 0.03 220)" }}>
                              {m.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* OpenAI group */}
                    <div>
                      <p className="text-xs mb-1.5 font-medium" style={{ color: "oklch(50% 0.03 220)" }}>OpenAI</p>
                      <div className="space-y-1.5">
                        {OPENAI_MODELS.map(m => (
                          <label key={m.value}
                            className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                            style={{
                              background: currentModel === m.value ? model.glowBg : "oklch(20% 0.05 220)",
                              border: `1px solid ${currentModel === m.value ? model.glowBorder : "oklch(26% 0.04 220)"}`,
                            }}>
                            <input
                              type="radio"
                              name={`model-${model.slug}`}
                              value={m.value}
                              checked={currentModel === m.value}
                              onChange={() => setEditValues(prev => ({ ...prev, [model.slug]: m.value }))}
                              style={{ accentColor: model.glowColor }}
                            />
                            <span className="text-sm" style={{ color: currentModel === m.value ? model.glowColor : "oklch(70% 0.03 220)" }}>
                              {m.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between gap-3 pt-3"
                    style={{ borderTop: "1px solid oklch(25% 0.04 220)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "oklch(72% 0.18 162)" }} />
                      <span className="text-xs" style={{ color: "oklch(60% 0.03 220)" }}>
                        Current: <span className="font-semibold text-white">{getModelLabel(currentModel)}</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLocation(`/admin/prompts`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        style={{ background: model.glowBg, color: model.glowColor, border: `1px solid ${model.glowBorder}` }}>
                        Edit Prompt →
                      </button>
                      <button
                        onClick={() => handleSave(model.slug)}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)", opacity: isSaving ? 0.7 : 1 }}>
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info card */}
        <div className="p-5 rounded-2xl"
          style={{ background: "oklch(16% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
          <h3 className="font-bold text-white text-sm mb-2">Model Configuration Notes</h3>
          <ul className="space-y-1.5 text-sm" style={{ color: "oklch(60% 0.03 220)" }}>
            <li>• <span style={{ color: "oklch(65% 0.22 250)" }}>Gemini 2.5 Pro</span> — Best quality, ideal for complex business analysis</li>
            <li>• <span style={{ color: "oklch(65% 0.22 250)" }}>Gemini 2.0 Flash</span> — Fast responses, good for quick queries</li>
            <li>• <span style={{ color: "oklch(65% 0.22 250)" }}>Gemini 2.5 Flash</span> — Balanced speed and quality</li>
            <li>• Gemini models require a <strong className="text-white">Google Gemini API key</strong> in the API Keys section</li>
            <li>• OpenAI models require an <strong className="text-white">OpenAI API key</strong> in the API Keys section</li>
            <li>• If no API key is set, the built-in platform LLM is used as fallback</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
