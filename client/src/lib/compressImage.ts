/** Max base64 string length (chars) before tRPC upload — stay under 1MB payload. */
export const MAX_PAYMENT_SCREENSHOT_BASE64_LEN = 1024 * 1024 - 16;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Resize/compress an image via canvas until the base64 payload is under 1MB.
 */
export async function compressImageToBase64UnderLimit(
  file: File,
  maxBase64Len = MAX_PAYMENT_SCREENSHOT_BASE64_LEN,
): Promise<{ base64: string; contentType: string; previewDataUrl: string }> {
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);
  const mime = "image/jpeg";
  let maxSide = Math.max(img.width, img.height, 1);
  let quality = 0.88;

  for (let attempt = 0; attempt < 24; attempt++) {
    const scale = Math.min(1, 1920 / maxSide);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, w, h);
    const previewDataUrl = canvas.toDataURL(mime, quality);
    const base64 = previewDataUrl.split(",")[1] ?? "";
    if (base64.length < maxBase64Len) {
      return { base64, contentType: mime, previewDataUrl };
    }
    if (quality > 0.45) {
      quality -= 0.08;
    } else {
      maxSide *= 0.82;
      quality = 0.75;
    }
  }

  throw new Error("Could not compress image under 1MB. Try a smaller screenshot.");
}
