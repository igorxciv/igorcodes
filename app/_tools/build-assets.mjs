import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { bundle as bundleCss } from "lightningcss";
import { rolldown } from "rolldown";

import seasons from "../_data/seasons.js";
import browserTargets from "./browser-targets.js";
import { checkSceneBudget } from "./scene-budget.mjs";
import { discoverScenes } from "./scene-registry.mjs";

const rootDir = path.resolve(import.meta.dirname, "../..");
const appDir = path.join(rootDir, "app");
const buildDir = path.join(appDir, "assets", "build");
const manifestPath = path.join(appDir, "_data", "assets-manifest.json");

const cssEntryPath = path.join(appDir, "assets", "css", "personal-site.css");
const jsEntryPath = path.join(appDir, "assets", "js", "personal-site.js");
const notFoundCssEntryPath = path.join(
  appDir,
  "assets",
  "css",
  "not-found.css",
);
const notFoundJsEntryPath = path.join(appDir, "assets", "js", "not-found.js");

const THREE_MODULE = /[\\/]node_modules[\\/]three[\\/]/;

const hashContent = (content) =>
  createHash("sha256").update(content).digest("hex").slice(0, 10);

function logAsset(label, url, byteLength) {
  console.log(`${label} → ${url} (${byteLength} bytes)`);
}

async function writeHashed(label, prefix, extension, content) {
  const fileName = `${prefix}-${hashContent(content)}${extension}`;
  await writeFile(path.join(buildDir, fileName), content);
  const url = `/assets/build/${fileName}`;
  logAsset(label, url, content.length);
  return url;
}

const minifyCss = (entryPath) =>
  bundleCss({
    filename: entryPath,
    minify: true,
    sourceMap: false,
    targets: browserTargets,
  }).code;

// extraEntryPaths are bundled on their own and appended to the sheet, which
// is how every scene's accents.css reaches the full stylesheet.
function buildCss(label, entryPath, outputPrefix, extraEntryPaths = []) {
  const code = Buffer.concat([entryPath, ...extraEntryPaths].map(minifyCss));
  return writeHashed(label, outputPrefix, ".css", code);
}

// The site entries are classic scripts and build as an IIFE. Scene entries
// are loaded with import(url), so they build as one standalone ES module each.
async function bundleJs(entryPath, format) {
  const bundle = await rolldown({
    input: entryPath,
    logLevel: "silent",
  });
  const { output } = await bundle.generate({
    format,
    minify: true,
  });
  await bundle.close();

  const [chunk] = output;
  return { code: chunk.code, moduleIds: chunk.moduleIds };
}

async function buildJs(label, entryPath, outputPrefix) {
  const { code } = await bundleJs(entryPath, "iife");
  return writeHashed(label, outputPrefix, ".js", code);
}

async function buildSceneAccents(scene) {
  const label = `scene ${scene.season} accents`;
  const { code, moduleIds } = await bundleJs(
    path.join(scene.dir, "accents.js"),
    "es",
  );
  if (moduleIds.some((id) => THREE_MODULE.test(id))) {
    throw new Error(
      `[scenes] ${scene.season}/accents.js imports three.js. Content accents must work without the ambient layer; move that code to ambient.js.`,
    );
  }
  return writeHashed(label, `scene-${scene.season}-accents`, ".js", code);
}

async function buildSceneAmbient(scene) {
  const label = `scene ${scene.season} ambient`;
  const { code } = await bundleJs(path.join(scene.dir, "ambient.js"), "es");
  const measured = [{ name: "ambient.js", content: Buffer.from(code) }];

  const assets = {};
  for (const file of scene.assetFiles) {
    const content = await readFile(path.join(scene.dir, "assets", file));
    const { name, ext } = path.parse(file);
    assets[file] = await writeHashed(
      `${label} ${file}`,
      `scene-${scene.season}-${name}`,
      ext,
      content,
    );
    measured.push({ name: file, content });
  }

  checkSceneBudget(scene.season, measured);

  return {
    ambient: await writeHashed(
      label,
      `scene-${scene.season}-ambient`,
      ".js",
      code,
    ),
    assets,
  };
}

async function buildScene(scene) {
  const accents = scene.accentsJs ? await buildSceneAccents(scene) : null;
  const { ambient, assets } = scene.ambient
    ? await buildSceneAmbient(scene)
    : { ambient: null, assets: {} };
  return [scene.season, { accents, ambient, assets }];
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

  const sceneList = await discoverScenes(seasons);
  const accentCssPaths = sceneList
    .filter((scene) => scene.accentsCss)
    .map((scene) => path.join(scene.dir, "accents.css"));

  const [css, js, notFoundCss, notFoundJs, ...sceneEntries] = await Promise.all(
    [
      runBuild("css", () =>
        buildCss("css", cssEntryPath, "site", accentCssPaths),
      ),
      runBuild("js", () => buildJs("js", jsEntryPath, "site")),
      runBuild("notFoundCss", () =>
        buildCss("notFoundCss", notFoundCssEntryPath, "not-found"),
      ),
      runBuild("notFoundJs", () =>
        buildJs("notFoundJs", notFoundJsEntryPath, "not-found"),
      ),
      ...sceneList.map((scene) =>
        runBuild(`scene ${scene.season}`, () => buildScene(scene)),
      ),
    ],
  );

  await writeManifest({
    css,
    js,
    notFoundCss,
    notFoundJs,
    scenes: Object.fromEntries(sceneEntries),
  });
}

async function writeManifest(assets) {
  await writeFile(manifestPath, `${JSON.stringify(assets, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
