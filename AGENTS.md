# Repository Guidelines

## Project Structure (Eleventy Static Site)

- `app/`: Eleventy input directory (templates, pages, content).
- `app/_includes/`: Shared layouts and partials.
  - `layouts/` for page/item layouts.
  - `partials/` for reusable fragments (header, footer, etc.).
- `app/_data/`: Global data files (`*.js`) shared across templates.
- `app/assets/`: Source assets copied to output (e.g. `app/assets/css/site.css`).
- `app/work/`: Portfolio case studies (Markdown content + index template).
- `public/`: Static passthrough assets served as-is.
- `_site/`: Generated static output (build artifact, never committed).
- Config at repo root:
  - `.eleventy.js`, `eslint.config.mjs`, `prettier.config.mjs`, `package.json`.

## Default File Placement (When Creating New Files)

- Site pages: `app/**/*.njk`.
- Content entries: `app/work/*.md` (or additional collection folders under `app/`).
- Reusable layouts: `app/_includes/layouts/*.njk`.
- Reusable partials: `app/_includes/partials/*.njk`.
- Global shared data: `app/_data/*.js`.
- Styles and front-end assets: `app/assets/**`.
- Public passthrough assets (images/icons/files): `public/**`.
- SEO/discovery files:
  - `app/sitemap.njk`, `app/feed.njk`, `app/robots.njk`, `app/404.njk`.

## Build, Lint, and Development Commands

- `npm run dev`: Start Eleventy dev server.
- `npm run build`: Production static build to `_site/`.
- `npm run clean`: Remove `_site/` and Eleventy caches.
- `npm run lint`: Run ESLint (flat config).
- `npm run format`: Format repository with Prettier.
- `npm run format:check`: Validate formatting.

## Technical Requirements

- Runtime: Node `>=20.11`.
- Templating: Nunjucks + Markdown (Eleventy).
- Current plugin/tooling baseline (keep aligned unless intentionally changed):
  - `@11ty/eleventy`
  - `@11ty/eleventy-img`
  - `@11ty/eleventy-navigation`
  - `@11ty/eleventy-plugin-bundle`
  - `@11ty/eleventy-plugin-rss`
  - `@11ty/eleventy-plugin-syntaxhighlight`
  - `@quasibit/eleventy-plugin-sitemap`
  - `html-minifier-terser` (production HTML minification transform)
  - `luxon` (date formatting)

## Performance Best Practices (Eleventy)

- Prefer static-first rendering; avoid client-side JavaScript unless necessary.
- Optimize images with Eleventy Image (`@11ty/eleventy-img`) instead of shipping originals.
- Keep CSS minimal and route-agnostic; avoid unused large UI frameworks.
- Ensure production build keeps HTML minification enabled.
- Maintain `sitemap.xml`, `feed.xml`, and canonical metadata consistency.
- Keep generated output and caches out of git (`_site`, `.cache`, `.11ty-cache`).

## Dependency Management

- Install new dependencies using latest stable versions.
- Do not pin to old versions unless there is a compatibility reason documented in PR/commit notes.
- Commit `package-lock.json` with dependency changes.

## Coding Style & Naming

- 2-space indentation in JS/CSS/JSON and template files.
- Use `kebab-case` for filenames and folder names.
- Use clear collection/tag names and keep front matter minimal, explicit, and typed-by-convention.
- Keep data logic in `_data` files; keep templates focused on presentation.

## Testing

- No formal test framework is configured yet.
- Minimum validation for every change:
  - `npm run lint`
  - `npm run build`
- If you introduce tests, document the framework and commands in this file.

## Boundaries

- Always: create source files under `app/` and `public/` (not random root-level files).
- Ask first: reorganizing top-level folders or renaming major content collections.
- Never: commit secrets, `_site/`, `.cache/`, `.11ty-cache/`, or `.env*`.
