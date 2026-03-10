const { DateTime } = require("luxon");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const eleventyPluginRss = require("@11ty/eleventy-plugin-rss");
const eleventyPluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const eleventyPluginBundle = require("@11ty/eleventy-plugin-bundle").default;
const eleventyPluginSitemap = require("@quasibit/eleventy-plugin-sitemap");
const Image = require("@11ty/eleventy-img");
const { minify } = require("html-minifier-terser");

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
