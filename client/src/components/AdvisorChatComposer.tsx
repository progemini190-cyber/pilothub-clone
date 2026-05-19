import { useRef, useState, useCallback } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type PendingImage = {
  previewUrl: string;
  dataUrl: string;
};

type AdvisorChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string, imageDataUrl?: string) => void;
  sending: boolean;
  disabled?: boolean;
  placeholder: string;
  accentColor: string;
  accentGlow: string;
  borderColor: string;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function AdvisorChatComposer({
  value,
  onChange,
  onSend,
  sending,
  disabled,
  placeholder,
  accentColor,
  accentGlow,
  borderColor,
}: AdvisorChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);

  const clearImage = useCallback(() => {
    setPendingImage(null);
  }, []);

  const attachFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use JPEG, PNG, WebP, or GIF images only.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 4 MB.");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setPendingImage({ previewUrl: dataUrl, dataUrl });
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item?.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void attachFile(file);
          }
          break;
        }
      }
    },
    [attachFile],
  );

  const canSend = !disabled && !sending && (value.trim().length > 0 || pendingImage);

  const submit = () => {
    if (!canSend) return;
    onSend(value, pendingImage?.dataUrl);
    onChange("");
    clearImage();
  };

  return (
    <div className="flex flex-col gap-2">
      {pendingImage && (
        <div className="px-1">
          <div className="relative inline-block">
            <img
              src={pendingImage.previewUrl}
              alt="Upload preview"
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover"
              style={{ border: `1px solid ${borderColor}` }}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "oklch(60% 0.2 30)", color: "white" }}
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-2 sm:gap-3 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void attachFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition"
          style={{
            background: "oklch(20% 0.05 220)",
            border: `1px solid ${borderColor}`,
            color: accentColor,
          }}
          aria-label="Upload image"
        >
          <ImagePlus className="w-4 h-4" />
        </button>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          disabled={disabled || sending}
          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm resize-none outline-none text-white"
          style={{
            background: "oklch(20% 0.05 220)",
            border: `1px solid ${borderColor}`,
            maxHeight: "120px",
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition"
          style={{
            background: canSend ? accentColor : "oklch(25% 0.04 220)",
            boxShadow: canSend ? accentGlow : "none",
          }}
        >
          <Send
            className="w-3.5 sm:w-4 h-3.5 sm:h-4"
            style={{ color: canSend ? "oklch(12% 0.03 220)" : "oklch(45% 0.03 220)" }}
          />
        </button>
      </div>
    </div>
  );
}
