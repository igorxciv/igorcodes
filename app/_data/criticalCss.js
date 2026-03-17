const fs = require("node:fs");
const path = require("node:path");
const { transform } = require("lightningcss");

module.exports = () => {
  const filePath = path.join(__dirname, "..", "assets", "css", "personal-site-critical.css");
  const css = fs.readFileSync(filePath);

  if (process.env.NODE_ENV !== "production") {
    return css.toString("utf8");
  }

  return transform({
    filename: filePath,
    code: css,
    minify: true,
    sourceMap: false,
  }).code.toString();
};
