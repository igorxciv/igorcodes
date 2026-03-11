const { DateTime } = require("luxon");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const eleventyPluginRss = require("@11ty/eleventy-plugin-rss");
const eleventyPluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const eleventyPluginBundle = require("@11ty/eleventy-plugin-bundle").default;
const eleventyPluginSitemap = require("@quasibit/eleventy-plugin-sitemap");
const Image = require("@11ty/eleventy-img");
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
  Twitter,
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
  twitter: Twitter,
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
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(eleventyPluginRss);
  eleventyConfig.addPlugin(eleventyPluginSyntaxHighlight);
  eleventyConfig.addPlugin(eleventyPluginBundle);
  eleventyConfig.addPlugin(eleventyPluginSitemap, {
    sitemap: {
      hostname: process.env.SITE_URL || "https://example.com",
    },
  });

  eleventyConfig.addPassthroughCopy({ "public/": "/" });
  eleventyConfig.addPassthroughCopy({ "app/assets/": "/assets/" });
  eleventyConfig.addWatchTarget("./app/assets/css/");

  eleventyConfig.addFilter("readableDate", (value, format = "LLLL dd, yyyy") => {
    return DateTime.fromJSDate(value, { zone: "utc" }).toFormat(format);
  });

  eleventyConfig.addFilter("htmlDateString", (value) => {
    return DateTime.fromJSDate(value, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addCollection("featuredWork", (collectionApi) => {
    return collectionApi
      .getFilteredByTag("work")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
      .slice(0, 3);
  });

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

  eleventyConfig.addNunjucksAsyncShortcode(
    "optimizedImage",
    async function (src, alt, className = "", widths = [320, 640, 960]) {
      const metadata = await Image(src, {
        widths,
        formats: ["avif", "webp", "jpeg"],
        urlPath: "/assets/images/",
        outputDir: "_site/assets/images/",
        filenameFormat: (id, srcPath, width, format) => {
          const extension = srcPath.split(".").pop();
          const safeExtension = extension ? extension.replace(/[^a-z0-9]/gi, "") : "img";
          return `${id}-${width}.${format || safeExtension}`;
        },
      });

      return Image.generateHTML(
        metadata,
        {
          alt,
          class: className,
          loading: "lazy",
          decoding: "async",
          sizes: "(min-width: 1024px) 40rem, 92vw",
        },
        {
          whitespaceMode: "inline",
        },
      );
    },
  );

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
