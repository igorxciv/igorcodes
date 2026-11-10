const path = require("node:path");
const { bundle } = require("lightningcss");
const browserTargets = require("../_tools/browser-targets");

module.exports = () => {
  const filePath = path.join(
    __dirname,
    "..",
    "assets",
    "css",
    "personal-site-critical.css",
  );

  const { code } = bundle({
    filename: filePath,
    minify: process.env.NODE_ENV === "production",
    sourceMap: false,
    targets: browserTargets,
  });

  return code.toString();
};
