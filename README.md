# igorxciv

Single-page personal website ([igorcodes.dev](https://igorcodes.dev)) built with
Eleventy.

## Stack

- [Eleventy](https://www.11ty.dev/) static site generator
- Nunjucks templates
- Production asset pipeline:
  - `lightningcss` for bundled/minified CSS (and inlined critical CSS)
  - `rolldown` for bundled/minified JS
  - content-hashed asset filenames via a manifest (`app/_data/assets-manifest.json`)
- Production HTML minification with `html-minifier-terser`
- Build-time icons via `lucide` (rendered to inline SVG, no client runtime)
- Blog "Writing" list fetched from `blog.igorcodes.dev` via `@11ty/eleventy-fetch`
- [Biome](https://biomejs.dev/) for linting + formatting, [lefthook](https://lefthook.dev/) git hooks
- `pnpm` package manager, Node `>=26` (both pinned in `mise.toml`)

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

- `pnpm dev` start Eleventy dev server
- `pnpm build` production build (`build:assets` + `NODE_ENV=production eleventy`)
- `pnpm build:assets` build optimized CSS/JS assets and manifest only
- `pnpm clean` remove build/cache folders
- `pnpm lint` run Biome linter
- `pnpm format` format with Biome (`--write`)
- `pnpm check` Biome lint + format check (what CI runs); `pnpm check:fix` to autofix

## Setup

Node and pnpm versions are pinned in `mise.toml` — run `mise install` first (or
match the versions manually), then:

```bash
pnpm install
pnpm dev
```

Production build:

```bash
pnpm build
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
- `BLOB_READ_WRITE_TOKEN`: token for the Vercel Blob store that holds the
  licensed fonts. Injected automatically on Vercel when a Blob store is connected
  to the project. Only needed where `public/fonts/` is empty (a fresh clone or
  the Vercel build) — see **Fonts** below. Locally, keep your licensed `.woff2`
  files in `public/fonts/` and no token is required.

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

## Fonts

Wotfard (Atipo Foundry) and Dank Mono are **commercial, non-redistributable**
fonts, so their `.woff2` binaries are **not** committed (`public/fonts/` is
gitignored). They are stored in a private **Vercel Blob** store and supplied to
the build:

- `pnpm fonts:upload` — one-time (or when a font changes) upload of the local
  `public/fonts/*.woff2` into Blob. Needs `BLOB_READ_WRITE_TOKEN`
  (`vercel env pull` first).
- `pnpm fonts:fetch` — runs automatically at the start of `pnpm build`. It is
  idempotent: if the files are already on disk (local dev) it does nothing;
  otherwise it downloads them from Blob. The list of expected files lives in
  `app/_tools/fonts-manifest.mjs`.

For local development, just keep your licensed `.woff2` copies in
`public/fonts/`. See [`docs/purge-fonts-from-history.md`](docs/purge-fonts-from-history.md)
for removing the binaries from existing git history.

## Deployment

- Platform: Vercel. Build command `pnpm build`, output directory `_site/`.
- Connect a **Vercel Blob** store to the project so `BLOB_READ_WRITE_TOKEN` is
  present at build time; `pnpm build` fetches the fonts into `public/fonts/`
  before Eleventy runs (see **Fonts** above). The build fails loudly if the
  fonts are neither on disk nor reachable via Blob.
- Security headers and long-lived caching for hashed assets are defined in
  `vercel.json`. If you deploy elsewhere, translate those headers to that
  platform's config (e.g. a `_headers` / `netlify.toml` file).
- Ensure `www.igorcodes.dev` 301-redirects to the apex `igorcodes.dev` (the
  canonical URL is always the apex).

## Licensing

© Igor Cheliadinski. **All rights reserved** — see [`LICENSE`](LICENSE). The
source code, content, and brand assets are proprietary; viewing the public
source for reference is fine, but no reuse, copying, or redistribution is
granted without written permission.

The fonts under `public/fonts/` (Wotfard by Atipo Foundry, and Dank Mono) are
**third-party commercial fonts** licensed to the site owner. They are **not**
covered by this repository's terms and must not be redistributed. Because this
repository is public, the binaries must be removed from git history — see
[`docs/purge-fonts-from-history.md`](docs/purge-fonts-from-history.md).
