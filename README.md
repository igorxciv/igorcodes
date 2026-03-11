# igorxciv

Single-page personal website built with Eleventy.

## Stack

- [Eleventy](https://www.11ty.dev/) static site generator
- Nunjucks templates
- Production asset pipeline:
  - `lightningcss` for bundled/minified CSS
  - `esbuild` for minified JS
  - fingerprinted asset filenames via manifest (`app/_data/assets-manifest.json`)
- Production HTML minification with `html-minifier-terser`
- ESLint + Prettier + Husky/lint-staged

## Project structure

- `app/index.njk` single site entry page
- `app/_includes/layouts/personal-site.njk` page layout
- `app/_includes/partials/personal-site-page.njk` page content sections
- `app/_data/site.js` global site metadata
- `app/assets/css/personal-site.css` styles
- `app/assets/js/personal-site.js` progressive enhancements
- `public/` passthrough static assets
- `_site/` generated static output

## Scripts

- `npm run dev` start Eleventy dev server
- `npm run build` production build (`NODE_ENV=production`)
- `npm run build:assets` build optimized CSS/JS assets only
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

- `SITE_URL`: canonical site URL for metadata/canonical links.
