# igorxciv

Single-page personal website ([igorcodes.dev](https://igorcodes.dev)) built with
Eleventy.

## Stack

- [Eleventy](https://www.11ty.dev/) static site generator
- Nunjucks templates
- Production asset pipeline:
  - `lightningcss` for bundled/minified CSS (and inlined critical CSS)
  - `esbuild` for bundled/minified JS
  - content-hashed asset filenames via a manifest (`app/_data/assets-manifest.json`)
- Production HTML minification with `html-minifier-terser`
- Build-time icons via `lucide` (rendered to inline SVG, no client runtime)
- Blog "Writing" list fetched from `blog.igorcodes.dev` via `@11ty/eleventy-fetch`
- ESLint + Prettier + Husky/lint-staged

## Project structure

- `app/index.njk` single site entry page
- `app/_includes/layouts/personal-site.njk` page layout
- `app/_includes/partials/personal-site-page.njk` page content sections
- `app/_data/` global data (`site.js`, `writing.js`, `assets.js`, `criticalCss.js`,
  `build.js`, and the `timeline.js` / `projects.js` / `contacts.js` content lists)
- `app/assets/css/tokens.css` design tokens shared by both CSS bundles
- `app/assets/css/personal-site.css` full styles; `personal-site-critical.css` the
  inlined above-the-fold subset
- `app/assets/js/personal-site.js` progressive enhancements
- `app/_tools/build-assets.mjs` production asset builder
- `public/` passthrough static assets (fonts)
- `_site/` generated static output

## Scripts

- `npm run dev` start Eleventy dev server
- `npm run build` production build (`build:assets` + `NODE_ENV=production eleventy`)
- `npm run build:assets` build optimized CSS/JS assets and manifest only
- `npm run clean` remove build/cache folders
- `npm run lint` run ESLint
- `npm run format` / `npm run format:check` run Prettier write / check

## Setup

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
```

## Environment variables

All are optional; sensible defaults apply.

- `SITE_URL`: canonical site origin for metadata/canonical links
  (default `https://igorcodes.dev`).
- `WRITING_FEED_URL`: JSON feed URL for the "Writing" section. Defaults to
  `https://blog.igorcodes.dev/feed.json`; set this to a locally running blog
  (e.g. `http://localhost:3000/feed.json`) during blog development. The feed is
  cached for a day, so a build/reload does not refetch on every pass.
- `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`: search-console
  verification tokens (emitted as meta tags when set).
- `NODE_ENV`: set to `production` by the build scripts. In production the asset
  manifest is required (the build fails loudly if it is missing/invalid).

## Content updates

`site.contentUpdated` (in `app/_data/site.js`) is the single content-freshness
date. It feeds the sitemap `<lastmod>` and the JSON-LD `dateModified`. **Bump it
(YYYY-MM-DD) whenever the page content meaningfully changes** — builds are
otherwise reproducible and do not stamp the build clock into output.

## SEO images

`public/images/seo/` currently holds **generated monogram placeholders** (favicon,
apple-touch icon, OG/social card, logo, and profile image) so nothing 404s and
social previews render. Replace them in place with real brand assets — keep the
same filenames and dimensions:

| File                                    | Dimensions             |
| --------------------------------------- | ---------------------- |
| `igorcodes-og-1200x630.jpg`             | 1200×630               |
| `igor-cheliadinski-profile-800x800.jpg` | 800×800                |
| `igorcodes-logo-512x512.png`            | 512×512                |
| `favicon.ico`                           | multi-size ICO (16+32) |
| `favicon-32x32.png`                     | 32×32                  |
| `apple-touch-icon-180x180.png`          | 180×180                |

## Deployment

- Platform: Vercel. Build command `npm run build`, output directory `_site/`.
- Security headers and long-lived caching for hashed assets are defined in
  `vercel.json`. If you deploy elsewhere, translate those headers to that
  platform's config (e.g. a `_headers` / `netlify.toml` file).
- Ensure `www.igorcodes.dev` 301-redirects to the apex `igorcodes.dev` (the
  canonical URL is always the apex).

## Licensing

The site code is © Igor Cheliadinski. **No license is granted yet** — add a
`LICENSE` file (all-rights-reserved or a chosen open license) to clarify reuse
terms.

The fonts under `public/fonts/` (Wotfard by Atipo Foundry, and Dank Mono) are
**third-party commercial fonts** licensed to the site owner. They are **not**
covered by this repository's terms and must not be redistributed. Because this
repository is public, the binaries must be removed from git history — see
[`docs/purge-fonts-from-history.md`](docs/purge-fonts-from-history.md).
