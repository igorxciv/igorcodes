// Scene discovery. A folder in app/assets/scenes/ is the whole registration of
// a seasonal scene: its name is the season and scene.js is the manifest.
// Shared by the Eleventy data file (_data/scenes.js) and the asset build
// (build-assets.mjs) so both see the same scenes and fail on the same errors.
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

export const scenesDir = path.resolve(
  import.meta.dirname,
  "..",
  "assets",
  "scenes",
);

// Host elements the home template offers. Adding a slot is a template change.
const SLOTS = ["hero"];

async function listDir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

// scene.js is CommonJS, like the data files in _data/. It is dropped from the
// require cache first so the dev server picks up edits.
function readManifest(season, dir) {
  const manifestPath = path.join(dir, "scene.js");
  if (!existsSync(manifestPath)) {
    throw new Error(
      `[scenes] app/assets/scenes/${season}/ has no scene.js. Every scene folder needs a manifest.`,
    );
  }

  Reflect.deleteProperty(require.cache, manifestPath);
  const manifest = require(manifestPath);
  if (typeof manifest?.icon !== "string" || !manifest.icon) {
    throw new Error(
      `[scenes] ${season}/scene.js must name a lucide icon for the season control.`,
    );
  }
  return manifest;
}

async function readScene(season, seasons) {
  if (!(season in seasons.starts)) {
    throw new Error(
      `[scenes] app/assets/scenes/${season}/ is not a season. Scene folders must be named one of: ${Object.keys(seasons.starts).join(", ")}.`,
    );
  }

  const dir = path.join(scenesDir, season);
  const manifest = readManifest(season, dir);
  const has = (file) => existsSync(path.join(dir, file));
  const ambient = has("ambient.js");

  if (ambient && !SLOTS.includes(manifest.slot)) {
    throw new Error(
      `[scenes] ${season}/scene.js mounts its ambient layer into slot "${manifest.slot}". Known slots: ${SLOTS.join(", ")}.`,
    );
  }

  const assetFiles = (await listDir(path.join(dir, "assets")))
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  return {
    season,
    dir,
    icon: manifest.icon,
    slot: ambient ? manifest.slot : null,
    occasions: manifest.occasions ?? [],
    accentsCss: has("accents.css"),
    accentsJs: has("accents.js"),
    ambient,
    assetFiles,
  };
}

// An occasion the date table schedules must be one the season's scene knows
// how to draw. A season with no scene is exempt: its occasions do nothing.
function checkOccasions(scenes, seasons) {
  for (const occasion of seasons.occasions) {
    const scene = scenes.find((entry) => entry.season === occasion.season);
    if (scene && !scene.occasions.includes(occasion.name)) {
      throw new Error(
        `[scenes] seasons.js schedules the "${occasion.name}" occasion in ${occasion.season}, but ${occasion.season}/scene.js does not list it under occasions.`,
      );
    }
  }
}

export async function discoverScenes(seasons) {
  const folders = (await listDir(scenesDir))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const scenes = await Promise.all(
    folders.map((season) => readScene(season, seasons)),
  );
  checkOccasions(scenes, seasons);
  return scenes;
}
