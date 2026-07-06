const EleventyFetch = require("@11ty/eleventy-fetch");
const site = require("./site");

const ARTICLE_LIMIT = 4;
const FEED_URL = site.writing.feedUrl;
const FALLBACK_URL = site.writing.fallbackUrl;

const fallbackArticles = [
  {
    title: "Latest writing on the blog",
    url: FALLBACK_URL,
    dateLabel: "Updated regularly",
    detail: "Notes and articles",
  },
];

function cleanText(value) {
  if (!value) {
    return "";
  }

  return String(value).replace(/\s+/g, " ").trim();
}

function truncateText(value, maxLength = 96) {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDate(value) {
  const date = parseDate(value);

  if (!date) {
    return "Recent";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getArticleDateValue(article) {
  return (
    article.date_published ||
    article.date_modified ||
    article.published ||
    article.updated ||
    ""
  );
}

function normalizeArticle(article) {
  const url = cleanText(article.url || article.external_url || article.id);
  const title = cleanText(article.title);

  if (!url || !title) {
    return null;
  }

  // Reject non-http(s) schemes (e.g. javascript:) — url is rendered into an href.
  if (!/^https?:\/\//i.test(url)) {
    return null;
  }

  return {
    title,
    url,
    dateLabel: formatDate(getArticleDateValue(article)),
    detail: truncateText(
      article.summary || article.content_text || article.description,
    ),
  };
}

function sortByNewest(a, b) {
  const firstDate = parseDate(getArticleDateValue(a))?.getTime() || 0;
  const secondDate = parseDate(getArticleDateValue(b))?.getTime() || 0;

  return secondDate - firstDate;
}

function normalizeFeed(feed) {
  if (!feed || !Array.isArray(feed.items)) {
    return [];
  }

  return feed.items
    .filter((item) => item && typeof item === "object")
    .toSorted(sortByNewest)
    .map(normalizeArticle)
    .filter(Boolean)
    .slice(0, ARTICLE_LIMIT);
}

function emitFeedWarning(message) {
  process.stderr.write(`[writing] ${message}\n`);
}

module.exports = async () => {
  try {
    const feed = await EleventyFetch(FEED_URL, {
      duration: "1d",
      type: "json",
      fetchOptions: {
        headers: {
          Accept: "application/feed+json, application/json",
        },
      },
    });

    const articles = normalizeFeed(feed);

    if (articles.length > 0) {
      return {
        articles,
        sourceUrl: cleanText(feed.home_page_url) || FALLBACK_URL,
      };
    }

    throw new Error("Feed did not include any valid articles");
  } catch (error) {
    emitFeedWarning(`Using fallback writing content: ${error.message}`);
    return {
      articles: fallbackArticles,
      sourceUrl: FALLBACK_URL,
    };
  }
};
