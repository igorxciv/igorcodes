const fs = require("node:fs/promises");
const path = require("node:path");
const site = require("./site");

const ARTICLE_LIMIT = 4;
const FEED_URL = site.writing.feedUrl;
const FALLBACK_URL = site.writing.fallbackUrl;
const REQUEST_TIMEOUT_MS = 4000;
const CACHE_FILE = path.join(process.cwd(), ".cache", "writing-feed.json");

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
    article.date_published || article.date_modified || article.published || article.updated || ""
  );
}

function normalizeArticle(article) {
  const url = cleanText(article.url || article.external_url || article.id);
  const title = cleanText(article.title);

  if (!url || !title) {
    return null;
  }

  return {
    title,
    url,
    dateLabel: formatDate(getArticleDateValue(article)),
    detail: truncateText(article.summary || article.content_text || article.description),
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

async function readCache() {
  try {
    const cachedFeed = JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
    return normalizeFeed(cachedFeed);
  } catch {
    return [];
  }
}

async function writeCache(feed) {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(feed, null, 2));
}

async function fetchFeed() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(FEED_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/feed+json, application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Feed request failed with ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function () {
  try {
    const feed = await fetchFeed();
    const articles = normalizeFeed(feed);

    if (articles.length > 0) {
      await writeCache(feed);
      return {
        articles,
        sourceUrl: cleanText(feed.home_page_url) || FALLBACK_URL,
      };
    }

    throw new Error("Feed did not include any valid articles");
  } catch (error) {
    const cachedArticles = await readCache();

    if (cachedArticles.length > 0) {
      emitFeedWarning(`Using cached writing feed: ${error.message}`);
      return {
        articles: cachedArticles,
        sourceUrl: FALLBACK_URL,
      };
    }

    emitFeedWarning(`Using fallback writing content: ${error.message}`);
    return {
      articles: fallbackArticles,
      sourceUrl: FALLBACK_URL,
    };
  }
};
