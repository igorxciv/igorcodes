const fs = require("node:fs");
const path = require("node:path");

const defaultAssets = {
  css: "/assets/css/personal-site.css",
  js: "/assets/js/personal-site.js",
};

module.exports = () => {
  if (process.env.NODE_ENV !== "production") {
    return defaultAssets;
  }

  const manifestPath = path.join(__dirname, "assets-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return defaultAssets;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return {
      ...defaultAssets,
      ...manifest,
    };
  } catch {
    return defaultAssets;
  }
};
