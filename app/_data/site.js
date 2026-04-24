module.exports = {
  name: "Igor Cheliadinski",
  description:
    "Software engineer with frontend roots and a systems mindset. Building maintainable, performant digital products and developer workflows.",
  url: process.env.SITE_URL || "https://igorcodes.dev",
  language: "en",
  locale: "en_US",
  themeColorDark: "#0a0a0a",
  themeColorLight: "#f6f1e8",
  author: "Igor Cheliadinski",
  email: "hi@igorcodes.dev",
  location: "Playa del Carmen, Mexico",
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || "",
  bingSiteVerification: process.env.BING_SITE_VERIFICATION || "",
  socialImage: "/images/seo/igorcodes-og-1200x630.jpg",
  socialImageAlt:
    "Igor Cheliadinski, software engineer focused on frontend architecture, systems thinking, and product engineering.",
  profileImage: "/images/seo/igor-cheliadinski-profile-800x800.jpg",
  logo: "/images/seo/igorcodes-logo-512x512.png",
  faviconIco: "/images/seo/favicon.ico",
  faviconPng: "/images/seo/favicon-32x32.png",
  appleTouchIcon: "/images/seo/apple-touch-icon-180x180.png",
  twitterHandle: "@igorxciv",
  writing: {
    feedUrl:
      process.env.WRITING_FEED_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://blog.igorcodes.dev/feed.json"
        : "http://localhost:3000/feed.json"),
    fallbackUrl: "https://blog.igorcodes.dev/",
  },
  sameAs: [
    "https://github.com/igorxciv",
    "https://www.linkedin.com/in/igorxciv",
    "https://t.me/igorxciv",
    "https://360code.dev",
  ],
  nav: [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/#contact" },
  ],
};
