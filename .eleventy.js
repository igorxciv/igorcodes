const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const { minify } = require("html-minifier-terser");
const {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  ChevronDown,
  GitBranch,
  Globe,
  House,
  Mail,
  SquareArrowOutUpRight,
  Terminal,
} = require("lucide");

// Lucide v1 removed its brand glyphs, so the brand names below deliberately map
// to the closest generic icon (github → GitBranch, linkedin → BriefcaseBusiness,
// telegram/globe → Globe). If exact brand marks are needed, add `simple-icons`
// as a devDependency and render its paths for those names.
const lucideIcons = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  calendar: Calendar,
  chevronDown: ChevronDown,
  github: GitBranch,
  globe: Globe,
  house: House,
  linkedin: BriefcaseBusiness,
  mail: Mail,
  squareArrowOutUpRight: SquareArrowOutUpRight,
  terminal: Terminal,
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

function serializeAttributes(attributes) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => (value === true ? key : `${key}="${escapeAttributeValue(value)}"`))
    .join(" ");
}

function renderElement(tag, attributes = {}) {
  const serializedAttributes = serializeAttributes(attributes);

  return `<${tag}${serializedAttributes ? ` ${serializedAttributes}` : ""}></${tag}>`;
}

function renderLucideSvg(iconNode, attributes = {}) {
  const svgBody = iconNode
    .map(([tag, elementAttributes]) => renderElement(tag, elementAttributes))
    .join("");

  return `<svg ${serializeAttributes({ ...lucideDefaultAttributes, ...attributes })}>${svgBody}</svg>`;
}

module.exports = function (eleventyConfig) {
  const isProduction = process.env.NODE_ENV === "production";

  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "public/": "/" });
  if (isProduction) {
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
    if (!outputPath || !outputPath.endsWith(".html") || !isProduction) {
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
