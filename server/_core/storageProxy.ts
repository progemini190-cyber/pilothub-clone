import type { Express } from "express";
import { ENV } from "./env";

/** Keys that should resolve to local public assets instead of Forge storage. */
const LOCAL_ASSET_REDIRECTS: Record<string, string> = {
  "pilothub-logo.png": "/pilothub-logo.PNG",
  "pilothub-logo.PNG": "/pilothub-logo.PNG",
};

function resolveLocalAsset(key: string): string | null {
  const normalized = key.replace(/^\/+/, "").toLowerCase();
  const basename = normalized.split("/").pop() ?? normalized;

  if (LOCAL_ASSET_REDIRECTS[basename]) {
    return LOCAL_ASSET_REDIRECTS[basename];
  }
  if (basename.includes("pilothub-logo")) {
    return "/pilothub-logo.PNG";
  }
  return null;
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)["0"];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const localPath = resolveLocalAsset(key);
    if (localPath) {
      res.set("Cache-Control", "public, max-age=86400");
      res.redirect(307, localPath);
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      // Avoid 500 spam when Forge is not configured (e.g. local dev)
      res.status(404).send("Storage asset not found");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.warn(`[StorageProxy] forge miss for "${key}": ${forgeResp.status} ${body}`);
        res.status(404).send("Storage asset not found");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(404).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(404).send("Storage proxy error");
    }
  });
}
