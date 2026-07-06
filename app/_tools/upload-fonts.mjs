// One-time (or on-change) helper: upload the licensed fonts from `public/fonts/`
// into the Vercel Blob store so builds can fetch them. Run locally with the
// store token available:
//
//   vercel env pull            # writes BLOB_READ_WRITE_TOKEN into .env.local
//   pnpm fonts:upload          # (dotenv/`vercel env pull` must export the var)
//
// Blobs are stored under their manifest pathname with a stable URL (no random
// suffix) and private access — the store is private, so downloads require the
// token (see fetch-fonts.mjs). The fonts are still served publicly from the
// site itself; the private store just keeps the master copy out of reach.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { put } from "@vercel/blob";

import { FONT_FILES } from "./fonts-manifest.mjs";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const publicDir = path.join(rootDir, "public");

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "fonts: BLOB_READ_WRITE_TOKEN is unset. Run `vercel env pull` (or export the\n" +
        "  token from the Vercel dashboard) before uploading.",
    );
  }

  for (const rel of FONT_FILES) {
    const data = await readFile(path.join(publicDir, rel));
    const { url } = await put(rel, data, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "font/woff2",
      token,
    });
    console.log(`fonts: uploaded ${rel} → ${url}`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
