# Repository Guidelines

## Project Structure (Eleventy Static Site)

- `app/`: Eleventy input directory (templates, pages, data, source assets).
- `app/_includes/`: Shared layouts and partials.
  - `layouts/personal-site.njk`: the single page/document layout.
  - `partials/personal-site-page.njk`: the home page content sections.
- `app/_data/`: Global data files (`*.js`) shared across templates
  (`site.js`, `writing.js`, `assets.js`, `criticalCss.js`, `build.js`,
  `timeline.js`, `projects.js`, `contacts.js`).
- `app/assets/`: Source CSS/JS. In production these are built (see asset
  pipeline below); in dev they are served as-is.
- `app/_tools/build-assets.mjs`: the production asset builder.
- `public/`: Static passthrough assets served as-is (fonts, images).
- `_site/`: Generated static output (build artifact, never committed).
- Hand-authored SEO/discovery templates: `app/sitemap.njk`, `app/robots.njk`,
  `app/404.njk` (there is no feed template — the layout links to the blog's
  JSON feed at `blog.igorcodes.dev/feed.json`).
- Config at repo root: `.eleventy.js`, `biome.json`, `lefthook.yml`,
  `pnpm-workspace.yaml`, `mise.toml`, `vercel.json`, `package.json`.

## Default File Placement (When Creating New Files)

- Site pages: `app/**/*.njk`.
- Reusable layouts: `app/_includes/layouts/*.njk`.
- Reusable partials: `app/_includes/partials/*.njk`.
- Global shared data: `app/_data/*.js`.
- Styles and front-end assets: `app/assets/**`.
- Public passthrough assets (images/icons/fonts): `public/**`.

## Build, Lint, and Development Commands

- Package manager is `pnpm` (pinned via `packageManager` + `mise.toml`). Use
  `pnpm install`, not `npm install`.
- `pnpm dev`: Start Eleventy dev server (serves raw assets, no manifest).
- `pnpm build`: `build:assets` then a production Eleventy build to `_site/`.
- `pnpm build:assets`: Build hashed/minified CSS+JS and write the manifest.
- `pnpm clean`: Remove `_site/`, caches, and built assets/manifest.
- `pnpm lint`: Run the Biome linter.
- `pnpm format`: Format with Biome (`--write`).
- `pnpm check` / `pnpm check:fix`: Biome lint + format check (CI runs `check`).

## Technical Requirements

- Runtime: Node `>=26.0.0` (see `package.json` engines; `mise.toml` and CI pin
  `26.4.0`).
- Templating: Nunjucks (Eleventy 3). Markdown is enabled but unused today.
- Actual dependencies (all devDependencies — nothing ships a JS runtime):
  - `@11ty/eleventy` — static site generator.
  - `@11ty/eleventy-fetch` — cached fetch of the blog's JSON feed in `writing.js`.
  - `rolldown` — JS bundling/minification in `build-assets.mjs`.
  - `lightningcss` — CSS bundling/minification (`build-assets.mjs`,
    `criticalCss.js`).
  - `html-minifier-terser` — production HTML minification transform in
    `.eleventy.js`.
  - `lucide` — icon nodes rendered to inline SVG at build time via the custom
    `lucide` Nunjucks shortcode in `.eleventy.js` (no client runtime).
  - `@biomejs/biome` — linter + formatter (config in `biome.json`).
  - `lefthook` — git hooks runner (config in `lefthook.yml`); runs Biome on
    staged files pre-commit.

## Asset Pipeline

- `app/_tools/build-assets.mjs` bundles and content-hashes
  `personal-site.{css,js}` and `not-found.{css,js}`, writes them to
  `app/assets/build/`, and records the hashed paths in
  `app/_data/assets-manifest.json`.
- `app/_data/assets.js` reads that manifest to emit hashed URLs in production
  (and throws if the manifest is missing/invalid); in dev it returns raw paths.
- `app/assets/css/tokens.css` is the single source of truth for design tokens,
  imported by both `personal-site.css` and `personal-site-critical.css`.
- `app/_data/criticalCss.js` bundles `personal-site-critical.css` (inlining its
  `@import`s) and the layout inlines it in `<head>` for first paint; the full
  stylesheet loads via a normal `<link>`.

## Performance Best Practices (Eleventy)

- Prefer static-first rendering; avoid client-side JavaScript unless necessary.
- No images are shipped today. If images are ever added, use `@11ty/eleventy-img`
  (add it as a devDependency first) rather than shipping originals.
- Keep CSS minimal and token-driven; avoid unused large UI frameworks.
- Keep production HTML minification enabled.
- Keep `sitemap.xml`, `robots.txt`, and canonical metadata consistent. Content
  dates come from `site.contentUpdated`, not the build clock (keep it accurate).
- Keep generated output and caches out of git (`_site`, `.cache`,
  `app/assets/build`, `app/_data/assets-manifest.json`).

## Dependency Management

- Install new dependencies using latest stable versions unless a compatibility
  reason is documented in PR/commit notes.
- Commit `package-lock.json` with dependency changes.

## Coding Style & Naming

- 2-space indentation in JS/CSS/JSON and template files.
- Use `kebab-case` for filenames and folder names. The `fm-` class prefix and
  `personal-site-*` filenames are load-bearing (shared with the blog via
  `docs/THEME-TRANSFER.md` and the `fm-theme` localStorage key) — do not rename.
- Keep data/content in `_data` files; keep templates focused on presentation.

## Testing

- No formal test framework is configured. CI (`.github/workflows/ci.yml`) runs
  `pnpm check` (Biome lint + format) + build + linkinator (internal link/asset
  check) as the practical test suite.
- Minimum local validation for every change: `pnpm check` and `pnpm build`.

## Boundaries

- Always: create source files under `app/` and `public/` (not random root-level
  files).
- Ask first: reorganizing top-level folders or renaming major files.
- Never: commit secrets, `_site/`, `.cache/`, `.11ty-cache/`, or `.env*`.
