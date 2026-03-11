const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const fs = require("node:fs");
const path = require("node:path");
const { minify } = require("html-minifier-terser");
const {
  ArrowRight,
  Calendar,
  ChevronDown,
  Github,
  Globe,
  Linkedin,
  Mail,
  SquareArrowOutUpRight,
} = require("lucide");

const lucideIcons = {
  arrowRight: ArrowRight,
  calendar: Calendar,
  chevronDown: ChevronDown,
  github: Github,
  globe: Globe,
  linkedin: Linkedin,
  mail: Mail,
  squareArrowOutUpRight: SquareArrowOutUpRight,
};

const lucideDefaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

function escapeAttributeValue(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderElement(tag, attributes = {}) {
  const serializedAttributes = Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => {
      if (value === true) {
        return key;
      }

      return `${key}="${escapeAttributeValue(value)}"`;
    })
    .join(" ");

  return `<${tag}${serializedAttributes ? ` ${serializedAttributes}` : ""}></${tag}>`;
}

function renderLucideSvg(iconNode, attributes = {}) {
  const svgBody = iconNode
    .map(([tag, elementAttributes]) => renderElement(tag, elementAttributes))
    .join("");

  return `<svg ${Object.entries({ ...lucideDefaultAttributes, ...attributes })
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => {
      if (value === true) {
        return key;
      }

      return `${key}="${escapeAttributeValue(value)}"`;
    })
    .join(" ")}>${svgBody}</svg>`;
}

module.exports = function (eleventyConfig) {
  const isProduction = process.env.NODE_ENV === "production";
  const hasAssetManifest = fs.existsSync(
    path.join(__dirname, "app", "_data", "assets-manifest.json"),
  );

  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "public/": "/" });
  if (isProduction && hasAssetManifest) {
    eleventyConfig.addPassthroughCopy({ "app/assets/build/": "/assets/build/" });
  } else {
    eleventyConfig.addPassthroughCopy({ "app/assets/": "/assets/" });
  }
  eleventyConfig.addWatchTarget("./app/assets/css/");
  eleventyConfig.addWatchTarget("./app/assets/js/");

  eleventyConfig.addNunjucksShortcode("lucide", (name, className = "", label = "") => {
    const iconNode = lucideIcons[name];
    if (!iconNode) {
      throw new Error(`Unknown Lucide icon "${name}"`);
    }

    const iconAttributes = {
      class: className || undefined,
      focusable: "false",
    };

    if (label) {
      iconAttributes.role = "img";
      iconAttributes["aria-label"] = label;
    } else {
      iconAttributes["aria-hidden"] = "true";
    }

    return renderLucideSvg(iconNode, iconAttributes);
  });

  eleventyConfig.addTransform("htmlmin", async function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html") || process.env.NODE_ENV !== "production") {
      return content;
    }

    return minify(content, {
      collapseWhitespace: true,
      removeComments: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      minifyCSS: true,
      minifyJS: true,
    });
  });

  return {
    dir: {
      input: "app",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
