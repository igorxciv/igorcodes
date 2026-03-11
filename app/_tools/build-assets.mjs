import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { transform as transformJs } from "esbuild";
import { bundle as bundleCss } from "lightningcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const appDir = path.join(rootDir, "app");
const buildDir = path.join(appDir, "assets", "build");
const manifestPath = path.join(appDir, "_data", "assets-manifest.json");

const cssEntryPath = path.join(appDir, "assets", "css", "personal-site.css");
const jsEntryPath = path.join(appDir, "assets", "js", "personal-site.js");

const packVersion = (major, minor = 0, patch = 0) => (major << 16) | (minor << 8) | patch;

const browserTargets = {
  chrome: packVersion(111),
  edge: packVersion(111),
  firefox: packVersion(113),
  safari: packVersion(16, 4),
};

const hashContent = (content) => createHash("sha256").update(content).digest("hex").slice(0, 10);

async function buildCss() {
  const { code } = bundleCss({
    filename: cssEntryPath,
    minify: true,
    sourceMap: false,
    targets: browserTargets,
  });

  const fileName = `site-${hashContent(code)}.css`;
  await writeFile(path.join(buildDir, fileName), code);
  return `/assets/build/${fileName}`;
}

async function buildJs() {
  const jsSource = await readFile(jsEntryPath, "utf8");

  const { code } = await transformJs(jsSource, {
    loader: "js",
    minify: true,
    target: ["es2020"],
    format: "iife",
    legalComments: "none",
  });

  const jsBuffer = Buffer.from(code);
  const fileName = `site-${hashContent(jsBuffer)}.js`;
  await writeFile(path.join(buildDir, fileName), jsBuffer);
  return `/assets/build/${fileName}`;
}

async function writeManifest(assets) {
  await writeFile(manifestPath, `${JSON.stringify(assets, null, 2)}\n`, "utf8");
}

async function main() {
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });

  const [css, js] = await Promise.all([buildCss(), buildJs()]);

  await writeManifest({
    css,
    js,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
