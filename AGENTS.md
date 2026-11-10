# Repository Guidelines

Eleventy 3 static personal site (Nunjucks templates, no client framework),
deployed on Vercel. Scripts live in `package.json`; tool config sits at the
repo root (`.eleventy.js`, `biome.json`, `lefthook.yml`, `mise.toml`,
`pnpm-workspace.yaml`, `vercel.json`).

## Layout

- `app/` is the Eleventy input: pages (`*.njk`), `_includes/layouts/` and
  `_includes/partials/`, global data in `_data/*.js`, source CSS/JS in
  `assets/`, build scripts in `_tools/`.
- `app/assets/scenes/<season>/` holds one seasonal scene per folder (see
  Seasonal scenes).
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

## Seasonal scenes

Terms (season, seasonal scene, ambient layer, content accents, season
control, occasion, lighter form) are defined in `GLOSSARY.md`.

- `app/_data/seasons.js` is the date table: four season start dates plus
  occasions. It is the only place outside `app/assets/scenes/` that names a
  season (tests aside). The browser picks the season from the visitor's date, so no rebuild
  is needed when a season starts.
- A scene is one folder, `app/assets/scenes/<season>/`, and the folder is the
  registration: `scene.js` (manifest, required), `accents.css`, `accents.js`,
  `ambient.js`, `assets/` (all optional). Deleting the folder removes the
  scene; the build still passes and that season shows the plain site.
- Scenes decorate only the season-neutral hooks in the templates
  (`data-scene-accent="name"`, `data-scene-accent="heading"`) and mount into a
  slot (`data-scene-slot="hero"`). They never select `fm-` content classes, and
  every `accents.css` rule sits under `[data-scene="<season>"]`. Adding a hook
  or slot is a template change, not part of a scene.
- `ambient.js` exports `mount(host, context)` returning
  `{ update(context), destroy() }`. `accents.js` exports `apply()` and
  `remove()` and may not import three.js.
- The machinery is on per page through `seasonalScene: true` front matter:
  the home page (whole scene) and the 404 page (content accents alone; only
  its title carries a hook). The pre-paint script in `personal-site.njk` sets
  `data-scene` on `<html>`; `personal-site.js` owns the season control, loading
  and the frame-rate watch. Both must agree on the `fm-scene` storage key
  (a shared `fm-` name, like `fm-theme`).
- What a page gets is decided at build time from its HTML
  (`app/_tools/scene-page.js`): a page without a scene's slot never learns
  that scene's ambient URLs, so it cannot load three.js. A scene with nothing
  to show on a page (no content accents, and no slot for its ambient layer) is
  left out there: no `data-scene`, no season control.
- Switching the season control on where the scene has no ambient layer by
  design (no slot on the page, or none in the scene) removes the stored
  `fm-scene` value instead of storing `"on"`. Where an ambient layer exists
  but is not running (no WebGL, failed download, too slow), a press still
  stores `"on"`.
- `?season=<name>` and `?occasion=<name>` preview a scene for one page view,
  in production too: `/?season=winter&occasion=christmas`,
  `/404.html?season=winter`.
- `build-assets.mjs` appends every `accents.css` to the full stylesheet and
  builds each `accents.js` and `ambient.js` as its own hashed ES module, with
  three.js bundled into the ambient one. `pnpm dev` loads them unbundled
  through an import map instead.
- An ambient layer (script plus files in `assets/`) may transfer at most
  200 kB; the build prints each scene's total and fails over the cap
  (`app/_tools/scene-budget.mjs`). The build also fails on a scene folder that
  is not a season, colliding season starts, an occasion outside its season,
  and an occasion its scene's manifest does not list.
- The Content-Security-Policy in `vercel.json` allows scenes only while any
  `.glb` holds geometry alone (embedded textures become `blob:` URLs), no
  Draco, meshopt or KTX2 decoder is used (they need WebAssembly or workers),
  and every file is served from the site.

## Content and SEO

- Static-first: reach for CSS or build-time rendering before client JS.
- No content images ship today; if adding any, use `@11ty/eleventy-img`
  rather than originals. Scene textures in `app/assets/scenes/*/assets/` are
  not content images: they ship as authored, at most 256 px.
- `sitemap.njk`, `robots.njk`, `llms.txt.njk`, and canonical metadata stay
  consistent. Content dates come from `site.contentUpdated` in `site.js`, not
  the build clock, so update it with content changes.
- The writing section fetches the blog's JSON feed via eleventy-fetch (1-day
  cache) and falls back to a static link on failure, so a build that logs
  `[writing] Using fallback` still succeeds.

## Validation

Tests are few and use Node's built-in runner: `pnpm test` runs
`app/_tools/*.test.js` (the season date logic). CI runs `pnpm check` (Biome
lint + format), `pnpm test`, `pnpm build`, and linkinator over `_site`. Before
every commit, run `pnpm check`, `pnpm test` and `pnpm build`. linkinator serves `_site` from a loopback
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
