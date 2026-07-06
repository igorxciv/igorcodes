import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build as esbuild } from "esbuild";
import { bundle as bundleCss } from "lightningcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const appDir = path.join(rootDir, "app");
const buildDir = path.join(appDir, "assets", "build");
const manifestPath = path.join(appDir, "_data", "assets-manifest.json");

const cssEntryPath = path.join(appDir, "assets", "css", "personal-site.css");
const jsEntryPath = path.join(appDir, "assets", "js", "personal-site.js");
const notFoundCssEntryPath = path.join(appDir, "assets", "css", "not-found.css");
const notFoundJsEntryPath = path.join(appDir, "assets", "js", "not-found.js");

const packVersion = (major, minor = 0, patch = 0) => (major << 16) | (minor << 8) | patch;

const browserTargets = {
  chrome: packVersion(111),
  edge: packVersion(111),
  firefox: packVersion(113),
  safari: packVersion(16, 4),
};

const hashContent = (content) => createHash("sha256").update(content).digest("hex").slice(0, 10);

function logAsset(label, url, byteLength) {
  console.log(`${label} → ${url} (${byteLength} bytes)`);
}

async function buildCss(label, entryPath, outputPrefix) {
  const { code } = bundleCss({
    filename: entryPath,
    minify: true,
    sourceMap: false,
    targets: browserTargets,
  });

  const fileName = `${outputPrefix}-${hashContent(code)}.css`;
  await writeFile(path.join(buildDir, fileName), code);
  const url = `/assets/build/${fileName}`;
  logAsset(label, url, code.length);
  return url;
}

async function buildJs(label, entryPath, outputPrefix) {
  // bundle: true resolves imports, so the scripts can gain `import`s later
  // without silently shipping an unresolved reference inside the IIFE.
  const result = await esbuild({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    minify: true,
    target: ["es2020"],
    format: "iife",
    legalComments: "none",
  });

  const code = result.outputFiles[0].contents;
  const fileName = `${outputPrefix}-${hashContent(code)}.js`;
  await writeFile(path.join(buildDir, fileName), code);
  const url = `/assets/build/${fileName}`;
  logAsset(label, url, code.length);
  return url;
}

async function runBuild(label, fn) {
  try {
    return await fn();
  } catch (error) {
    console.error(`Failed to build "${label}":`);
    throw error;
  }
}

async function main() {
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });

  const [css, js, notFoundCss, notFoundJs] = await Promise.all([
    runBuild("css", () => buildCss("css", cssEntryPath, "site")),
    runBuild("js", () => buildJs("js", jsEntryPath, "site")),
    runBuild("notFoundCss", () => buildCss("notFoundCss", notFoundCssEntryPath, "not-found")),
    runBuild("notFoundJs", () => buildJs("notFoundJs", notFoundJsEntryPath, "not-found")),
  ]);

  await writeManifest({
    css,
    js,
    notFoundCss,
    notFoundJs,
  });
}

async function writeManifest(assets) {
  await writeFile(manifestPath, `${JSON.stringify(assets, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
