const {
  currentOccasions,
  currentSeason,
} = require("../_tools/season-clock.js");
const { scenesForPage } = require("../_tools/scene-page.js");
const getAssets = require("./assets.js");
const seasons = require("./seasons.js");

// Seasonal scenes found in app/assets/scenes/, in the shapes the layout needs:
//   list         one entry per scene, for build-time markup (control icons,
//                dev stylesheet links)
//   forPage      forPage(html) gives one page what its scenes can show there:
//                  client      per-season URLs, slot and hasAccents,
//                              inlined into the pre-paint script
//                  hasScenes   false when no scene has anything to show
//                  devModules  true when the browser loads scene modules
//                              unbundled (an ambient layer on a dev page)
//   clockSource  the season picker's source, inlined next to the date table
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
    client[scene.season] = {
      slot: scene.slot,
      hasAccents: scene.accentsCss || scene.accentsJs,
      ...urls,
    };
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
    forPage: (html) => {
      const page = scenesForPage(client, html);
      return {
        ...page,
        devModules:
          !isProduction &&
          Object.values(page.client).some((entry) => entry.ambient),
      };
    },
    clockSource: `${currentSeason}\n${currentOccasions}`,
  };
};
