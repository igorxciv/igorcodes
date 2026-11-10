# Repository Guidelines

Eleventy 3 static personal site (Nunjucks templates, no client framework),
deployed on Vercel. Scripts live in `package.json`; tool config sits at the
repo root (`.eleventy.js`, `biome.json`, `lefthook.yml`, `mise.toml`,
`pnpm-workspace.yaml`, `vercel.json`).

## Layout

- `app/` is the Eleventy input: pages (`*.njk`), `_includes/layouts/` and
  `_includes/partials/`, global data in `_data/*.js`, source CSS/JS in
  `assets/`, build scripts in `_tools/`.
- `public/` is copied through as-is (images, fonts).
- Put new source files under `app/` or `public/`; keep content in `_data`
  files and templates presentational.

## Toolchain

- Node 26 LTS and pnpm 12, pinned in three places that move together:
  `mise.toml`, `package.json` (`engines`, `packageManager`), and
  `.github/workflows/ci.yml`. Vercel builds with the `engines` major, so only
  move to a major Vercel lists as supported (Node 26 was unsupported until
  late 2026, which once forced a rollback to 24).
- Use `pnpm`; the lockfile is `pnpm-lock.yaml`. Commit it with every
  dependency change.
- pnpm enforces a minimum release age: a version published within the last
  day is rejected, and `pnpm add` may write `minimumReleaseAgeExclude` entries
  into `pnpm-workspace.yaml`. Pick the newest version old enough to pass
  instead, and keep that file free of excludes.
- Upgrade dependencies to the latest stable release; record any reason for
  holding one back in the commit message.
- Biome minor releases can move rules out of `nursery`; run
  `pnpm exec biome migrate --write` after upgrading, then reformat
  `biome.json` (migrate writes tabs).

## Build pipeline

- `pnpm build` runs `fonts:fetch` → `build:assets` → Eleventy (production).
- Fonts (Wotfard, Dank Mono) are licensed and gitignored. `fetch-fonts.mjs`
  pulls them from a private Vercel Blob store when `public/fonts/` is
  incomplete, which needs `BLOB_READ_WRITE_TOKEN`; local copies skip the fetch.
  The file list lives in `app/_tools/fonts-manifest.mjs`.
- `build-assets.mjs` bundles and content-hashes `personal-site.{css,js}` and
  `not-found.{css,js}` (lightningcss + rolldown) and writes
  `app/_data/assets-manifest.json`; `assets.js` reads it in production and
  throws if it is missing. `pnpm dev` serves raw assets with no manifest.
- `criticalCss.js` bundles `personal-site-critical.css`, which the layout
  inlines in `<head>`; the full sheet loads via `<link>`.
- Both CSS paths use `app/_tools/browser-targets.js` (Baseline widely
  available). lightningcss lowers anything newer, so modern CSS is fine to
  write; raise the targets as the Baseline window moves.
- Production HTML is minified in `.eleventy.js`. Icons come from the custom
  `lucide` shortcode, rendered to inline SVG at build time.

## CSS conventions

- `app/assets/css/tokens.css` is the single source of design tokens, imported
  by both the full and critical sheets.
- Theme colors use `light-dark(<light>, <dark>)`, switched by `color-scheme` on
  `:root` (`[data-theme="light"]` sets light; dark is the default). Add a token
  once with `light-dark()`; only non-color values (shadows) need the light
  override block.
- Translucent accents: `color-mix(in srgb, var(--fm-accent) N%, transparent)`.
  `--fm-accent-rgb` stays defined only for the blog.
- The `fm-` class prefix, `personal-site-*` filenames, and the `fm-theme`
  localStorage key are shared with the blog (blog.igorcodes.dev); keep their
  names stable. The pre-paint script in `personal-site.njk` and
  `personal-site.js` must agree on that key.

## Content and SEO

- Static-first: reach for CSS or build-time rendering before client JS.
- No images ship today; if adding any, use `@11ty/eleventy-img` rather than
  originals.
- `sitemap.njk`, `robots.njk`, `llms.txt.njk`, and canonical metadata stay
  consistent. Content dates come from `site.contentUpdated` in `site.js`, not
  the build clock, so update it with content changes.
- The writing section fetches the blog's JSON feed via eleventy-fetch (1-day
  cache) and falls back to a static link on failure, so a build that logs
  `[writing] Using fallback` still succeeds.

## Validation

There is no test framework. CI runs `pnpm check` (Biome lint + format),
`pnpm build`, and linkinator over `_site`. Before every commit, run
`pnpm check` and `pnpm build`. linkinator serves `_site` from a loopback
URL, so its `--skip` pattern must exclude only external hosts; a pattern like
`^https?://` silently skips every internal link.

## Boundaries

- Ask first before reorganizing top-level folders or renaming major files.
- Keep secrets, `.env*`, fonts, and build output (`_site/`, `.cache/`,
  `.11ty-cache/`, `app/assets/build/`, the assets manifest) out of git;
  `.gitignore` already covers them.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `igorxciv/igorcodes`, via the `gh` CLI. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five default labels, each named after its role: `needs-triage`,
`needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See
`docs/agents/domain.md`.
