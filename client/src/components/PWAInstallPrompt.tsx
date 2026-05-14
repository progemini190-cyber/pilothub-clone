import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { PILOTHUB_LOGO_URL } from "@/lib/siteAssets";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Check if dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show iOS instructions after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Listen for install prompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Install banner */}
      <div
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-4"
        style={{
          background: "oklch(18% 0.06 220)",
          border: "1px solid oklch(72% 0.18 162 / 0.4)",
          boxShadow: "0 0 30px oklch(72% 0.18 162 / 0.15), 0 20px 60px rgba(0,0,0,0.5)",
        }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(72% 0.18 162 / 0.15)", border: "1px solid oklch(72% 0.18 162 / 0.3)" }}>
          <img
            src={PILOTHUB_LOGO_URL}
            alt="PilotHub"
            className="w-7 h-7 rounded-lg object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Install PilotHub
          </p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(60% 0.03 220)" }}>
            {isIOS
              ? "Add to Home Screen for the best experience"
              : "Install as an app for quick access to BizPilot & FounderPilot"}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
              <Download className="w-3 h-3" />
              {isIOS ? "How to Install" : "Install App"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{ background: "oklch(22% 0.05 220)", color: "oklch(60% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
              Not now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 rounded-lg flex-shrink-0" style={{ color: "oklch(50% 0.03 220)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* iOS instructions modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowIOSInstructions(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "oklch(18% 0.06 220)", border: "1px solid oklch(72% 0.18 162 / 0.3)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(72% 0.18 162 / 0.15)" }}>
                <Smartphone className="w-5 h-5" style={{ color: "oklch(72% 0.18 162)" }} />
              </div>
              <div>
                <p className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Add to Home Screen
                </p>
                <p className="text-xs" style={{ color: "oklch(55% 0.03 220)" }}>iOS Installation Steps</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { step: "1", text: 'Tap the Share button (□↑) at the bottom of Safari' },
                { step: "2", text: 'Scroll down and tap "Add to Home Screen"' },
                { step: "3", text: 'Tap "Add" in the top right corner' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
                    {step}
                  </div>
                  <p className="text-sm text-white">{text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
