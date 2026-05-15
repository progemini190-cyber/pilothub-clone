import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [path.join(root, "scripts/vercel-api-entry.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: path.join(root, "api/index.js"),
  alias: {
    "@shared": path.join(root, "shared"),
  },
  packages: "external",
  sourcemap: true,
  logLevel: "info",
});

console.log("[build] Wrote api/index.js for Vercel");
