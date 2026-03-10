# igorxciv

Performance-first personal landing page + portfolio built with Eleventy.

## Stack

- [Eleventy](https://www.11ty.dev/) static site generator
- Nunjucks templates + Markdown content collections
- Performance plugins:
  - `@11ty/eleventy-plugin-bundle`
  - `@11ty/eleventy-img`
  - `@11ty/eleventy-plugin-rss`
  - `@quasibit/eleventy-plugin-sitemap`
  - `html-minifier-terser` transform (production)
- DX tooling: ESLint (flat config), Prettier, Husky + lint-staged

## Project structure

- `app/` Eleventy input directory
- `app/_includes/` layouts and partials
- `app/_data/` global data (`site`, `portfolio`)
- `app/work/` portfolio case studies (Markdown)
- `app/assets/css/site.css` global styles
- `public/` passthrough static assets
- `_site/` generated static output

## Scripts

- `npm run dev` start Eleventy dev server
- `npm run build` production build (`NODE_ENV=production`)
- `npm run clean` remove build/cache folders
- `npm run lint` run ESLint
- `npm run format` run Prettier write
- `npm run format:check` run Prettier check

## Setup

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Environment variables

- `SITE_URL`: canonical site URL used for RSS/sitemap/canonical links.

## Best practices already wired

- Static-first architecture (no runtime framework hydration)
- Minified HTML in production
- Sitemap + RSS generation
- Structured global data files for content maintainability
- Collection-based portfolio entries for easy scaling
- Statically served assets via passthrough copy
