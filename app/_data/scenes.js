const {
  currentOccasions,
  currentSeason,
} = require("../_tools/season-clock.js");
const getAssets = require("./assets.js");
const seasons = require("./seasons.js");

// Seasonal scenes found in app/assets/scenes/, in the shapes the layout needs:
//   list         one entry per scene, for build-time markup (control icons,
//                dev stylesheet links)
//   client       per-season URLs and slot, inlined into the pre-paint script
//   clockSource  the season picker's source, inlined next to the date table
//   devModules   true when the browser loads scene modules unbundled
module.exports = async () => {
  const { discoverScenes } = await import("../_tools/scene-registry.mjs");
  const scenes = await discoverScenes(seasons);
  const isProduction = process.env.NODE_ENV === "production";
  const built = isProduction ? (getAssets().scenes ?? {}) : {};

  const devUrls = (scene) => {
    const base = `/assets/scenes/${scene.season}`;
    return {
      accents: scene.accentsJs ? `${base}/accents.js` : null,
      ambient: scene.ambient ? `${base}/ambient.js` : null,
      assets: Object.fromEntries(
        scene.assetFiles.map((file) => [file, `${base}/assets/${file}`]),
      ),
    };
  };

  const client = {};
  for (const scene of scenes) {
    const urls = isProduction ? built[scene.season] : devUrls(scene);
    if (!urls) {
      throw new Error(
        `[scenes] assets-manifest.json has no entry for the ${scene.season} scene. Run pnpm build:assets first.`,
      );
    }
    client[scene.season] = { slot: scene.slot, ...urls };
  }

  return {
    list: scenes.map((scene) => ({
      season: scene.season,
      icon: scene.icon,
      accentsCss:
        !isProduction && scene.accentsCss
          ? `/assets/scenes/${scene.season}/accents.css`
          : null,
    })),
    client,
    clockSource: `${currentSeason}\n${currentOccasions}`,
    devModules: !isProduction && scenes.some((scene) => scene.ambient),
  };
};
