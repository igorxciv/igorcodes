const fs = require("node:fs");
const path = require("node:path");

const defaultAssets = {
  css: "/assets/css/personal-site.css",
  js: "/assets/js/personal-site.js",
  notFoundCss: "/assets/css/not-found.css",
  notFoundJs: "/assets/js/not-found.js",
};

const MANIFEST_ERROR =
  "assets-manifest.json missing or invalid — run npm run build:assets first";

module.exports = () => {
  if (process.env.NODE_ENV !== "production") {
    return defaultAssets;
  }

  const manifestPath = path.join(__dirname, "assets-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(MANIFEST_ERROR);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return {
      ...defaultAssets,
      ...manifest,
    };
  } catch {
    throw new Error(MANIFEST_ERROR);
  }
};
