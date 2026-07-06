# Improvement Plan — igorcodes.dev

This document is the output of a multi-domain critical audit (code quality, build pipeline, accessibility, CSS architecture, design, security, SEO, repo hygiene) performed on 2026-07-05. It is written so that a less-capable model (or a junior developer) can execute each task independently.

## How to use this document

- Work on **one task at a time**, in priority order (P0 → P3) unless told otherwise.
- Tasks marked **[OWNER DECISION]** need input or assets from the site owner before they can be completed. Skip them and move on if the owner is unavailable; do not improvise.
- After **every** task, run the verification steps listed for it, plus the global check:
  ```bash
  npm run lint && npm run format:check && npm run build
  ```
  The build must succeed and `_site/` must contain `index.html`, `404.html`, hashed assets under `_site/assets/build/`, and no references to files that don't exist in `_site/`.
- Do **not** redesign anything visually. All visual changes here are narrowly scoped (e.g. transition timing). If a task seems to require a design decision it doesn't specify, stop and ask.
- Do not commit `_site/`, `.cache/`, `app/assets/build/`, or `app/_data/assets-manifest.json` (all gitignored).
- Line numbers below refer to the state of the repo at audit time (commit `97d8ee8`). If a file has changed, locate the code by the quoted content, not the line number.

## Project orientation (context for the executor)

- Eleventy 3 static single-page site. Input `app/`, output `_site/`. Templates are Nunjucks.
- `app/index.njk` → layout `app/_includes/layouts/personal-site.njk` → content partial `app/_includes/partials/personal-site-page.njk`.
- Global data in `app/_data/*.js` (`site.js` metadata, `writing.js` fetches blog feed at build time, `assets.js` resolves hashed asset paths from `assets-manifest.json`, `criticalCss.js` inlines `personal-site-critical.css`, `build.js` build timestamps).
- Production assets are built by `app/_tools/build-assets.mjs` (lightningcss + esbuild, content-hashed filenames, manifest written to `app/_data/assets-manifest.json`). Dev serves raw files from `app/assets/`.
- `personal-site-critical.css` is inlined in `<head>`; `personal-site.css` (which `@import`s `noncritical-fonts.css`) is the async-loaded full stylesheet.
- Progressive enhancement: `app/assets/js/personal-site.js` adds class `fm-enhanced` to `<body>` on load; reveal animations are supposed to apply only when that class exists.
- The blog is a separate app on `blog.igorcodes.dev`; this repo only consumes its JSON feed.

---

# P0 — Critical

## T1. Restore the missing SEO images and favicons [OWNER DECISION — needs image assets]

**Problem.** `app/_data/site.js:21-28` references six images under `/images/seo/`, and the layout (`personal-site.njk:39-55,74,92,111`) emits them as `og:image`, `twitter:image`, favicons, apple-touch-icon, and JSON-LD images. The directory `public/images/seo/` **does not exist** — `public/images/` contains only `profile-blob.svg`. Verified in the production build: every one of these URLs 404s. Result: no favicon in browser tabs, blank social-share cards, broken structured-data images. This is the most user-visible defect on the site.

**Fix.** The owner must supply these files (a model cannot generate the owner's photo/brand assets). Place them at exactly:

| Path under `public/`                               | Dimensions             |
| -------------------------------------------------- | ---------------------- |
| `images/seo/igorcodes-og-1200x630.jpg`             | 1200×630               |
| `images/seo/igor-cheliadinski-profile-800x800.jpg` | 800×800                |
| `images/seo/igorcodes-logo-512x512.png`            | 512×512                |
| `images/seo/favicon.ico`                           | multi-size ICO (16+32) |
| `images/seo/favicon-32x32.png`                     | 32×32                  |
| `images/seo/apple-touch-icon-180x180.png`          | 180×180                |

**Interim mitigation if assets are unavailable:** it is better not to declare an image than to declare a 404. Remove the `og:image*`/`twitter:image*` meta tags, the favicon `<link>`s, and the JSON-LD `image`/`logo`/`primaryImageOfPage` properties (or point them at an asset that exists). Restore them when real assets land.

**Verify.** `npm run build`, then for each path: `test -f _site/images/seo/<name> && echo OK`. Also `grep -o '/images/seo/[^"]*' _site/index.html | sort -u` — every listed path must exist in `_site/`.

## T2. Resolve the commercial-font licensing exposure and delete `__fonts/` [OWNER DECISION — repo visibility / license terms]

**Problem.** Both font families are commercial, paid, generally non-redistributable: **Dank Mono** and **Wotfard** (Atipo Foundry). The repo tracks 9 `.woff2` files in `public/fonts/` and a further 17 (584K, superset with unused weights) in a dead root-level `__fonts/` directory referenced by nothing. If this repo is public on GitHub, anyone can download the raw font binaries — that is redistribution and likely violates both licenses. Serving the fonts from your own site is typically fine; committing them to a public repo is the problem.

**Fix.**

1. Mechanical (do now, no decision needed): `git rm -r __fonts/` — it is referenced by nothing (verified; only match anywhere is `.omc/project-memory.json`, which is operational state).
2. Owner decides one of:
   - make the repo private;
   - or purge font binaries from git history (`git filter-repo --path public/fonts --path __fonts --invert-paths`, then force-push — destructive, coordinate first) and serve fonts from a non-tracked deployment artifact;
   - or replace with open-licensed fonts (e.g. a libre grotesque for Wotfard, JetBrains Mono for Dank Mono) — this is a visual change, owner must approve.
3. Whatever the choice, add a README note that the fonts are third-party licensed and not covered by the repo's terms (see also T29).

**Verify.** `git ls-files __fonts` returns nothing; `npm run build` still succeeds; the site still renders with the intended fonts (`_site/fonts/` still contains the files used by CSS).

## T3. Fix invisible timeline content when JavaScript is disabled

**Problem.** Reveal-on-scroll styles must apply only when JS has added `fm-enhanced` to `<body>`. The generic rule does this correctly (`app/assets/css/personal-site.css:1046` — `.fm-enhanced .fm-reveal { opacity: 0; ... }`), but the timeline-specific rules are **not** gated:

- `personal-site.css:578` — `.fm-timeline-item.fm-reveal .fm-timeline-copy { opacity: 0; transform: translate(18px); }`
- `personal-site.css:630` — `.fm-timeline-item.fm-reveal .fm-timeline-dot { opacity: 0; ... }`
- the ≥821px overrides around `personal-site.css:1207-1233` (`.fm-timeline-item-left/right.fm-reveal .fm-timeline-copy/.fm-timeline-dot` transforms)

`is-visible` (which restores opacity) is only ever added by `personal-site.js`. So with JS disabled or failed, the entire "Career Journey" section renders at `opacity: 0` — invisible — for any user who does not have `prefers-reduced-motion` set (the reduced-motion block at `:1082` is what accidentally rescues those users). WCAG 1.3.1 / basic robustness failure.

**Fix.** Prefix every timeline reveal rule (the `opacity: 0`/`transform` initial states AND their `.is-visible` counterparts at `:586`, `:640`, and in the 821px block) with `.fm-enhanced `, exactly matching the pattern at `:1046`. Example: `.fm-enhanced .fm-timeline-item.fm-reveal .fm-timeline-copy { ... }`. Update the same selectors inside the `prefers-reduced-motion` block (`:1077-1090`) to keep them consistent.

**Verify.** Build, open `_site/index.html` in a browser with JavaScript disabled (or comment out the `<script src=...>` tag in the built file): all four timeline entries (2023/2021/2017/2014) must be fully visible. Re-enable JS: reveal animation still works on scroll.

## T4. Hide JS-only controls when JavaScript is disabled (theme toggle, 404 "Go Back")

**Problem A — theme toggle.** The toggle button (`personal-site.njk:184-216`) only gets a click handler from `personal-site.js`. With JS off it is focusable, announced as a switch, and does nothing. Worse, its hardcoded initial state (`aria-checked="false"`, status text "Dark theme active…") is wrong for visitors whose system preference is light (the inline head script already painted the page light). With JS on, `updateThemeToggleState()` corrects this on load, so the defect is specific to the no-JS path.

**Problem B — 404 "Go Back".** `app/404.njk:59-62` renders `<button data-404-back-link>Go Back</button>`, wired only in `not-found.js` (`history.back()`). Dead control without JS.

**Fix.** In `personal-site.css` (and mirror into `personal-site-critical.css`, since the toggle's styles are part of critical CSS — see T11 for deduplication):

```css
.fm-theme-toggle {
  display: none;
}
.fm-enhanced .fm-theme-toggle {
  display: inline-flex;
}
```

Note: the existing `.fm-theme-toggle` rule already sets `display: inline-flex`; change it to `display: none` in the base rule and add the `.fm-enhanced` override next to it. In `not-found.css`, do the same for `[data-404-back-link]` / `.fm-404-btn-secondary` (hidden by default, shown under `.fm-enhanced`) — `not-found.js` runs on the 404 page and `personal-site.js` adds `fm-enhanced` there too (both scripts load on the 404 page; verify `fm-enhanced` is added on 404 — if only `not-found.js` runs, add `document.body.classList.add("fm-enhanced")` there as well).

**Verify.** With JS disabled: theme toggle and Go Back button are not visible and not focusable (Tab never reaches them). With JS enabled: both appear and work.

---

# P1 — High

## T5. Add CI (GitHub Actions) and Dependabot

**Problem.** There is no `.github/` directory at all. Nothing runs lint/format/build on push. The husky pre-commit hook only covers staged files locally and is bypassable. Defects like T1 (missing images) ship silently.

**Fix.** Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22.13.0"
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run build
      - name: Check internal links and assets
        run: npx linkinator ./_site --recurse --silent --skip "^https?://"
```

The linkinator step (external URLs skipped for determinism) catches missing local assets like T1 automatically. Also create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
```

**Verify.** Push a branch (or use `act` locally if available); the workflow runs green. Intentionally reference a nonexistent asset in a template, build, and confirm linkinator fails; revert.

## T6. Add security headers and remove the CSP-blocking `onload` stylesheet hack

**Problem.** No `vercel.json`/`_headers`/`netlify.toml` exists — the site ships with zero security headers (no CSP, HSTS, X-Content-Type-Options, Permissions-Policy, frame protection). Additionally, `personal-site.njk:165` uses `<link rel="stylesheet" ... media="print" onload="this.media='all'">`. That inline event handler cannot be allowed by a strict CSP (inline handlers aren't covered by script hashes/nonces), and if CSP blocks it the stylesheet stays at `media="print"` — an unstyled site. Since critical CSS is already inlined and there is a `<noscript>` fallback, the async trick buys almost nothing for one small self-hosted stylesheet.

**Fix.**

1. In `personal-site.njk`, replace lines 164-168 (the preload + print/onload pair + noscript) with a plain `<link rel="stylesheet" href="{{ assets.css | url }}" />`.
2. Create `vercel.json` at the repo root (assumes Vercel; if deployed elsewhere, translate the same headers to that platform's format and note it in README):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cloud.umami.is; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloud.umami.is; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests"
        },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        { "key": "X-Frame-Options", "value": "DENY" },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/assets/build/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

`'unsafe-inline'` in `script-src`/`style-src` is required by the inline theme-init script and inlined critical CSS; tightening to hashes is possible later but the theme script's hash changes whenever theme colors change — not worth it now. `connect-src https://cloud.umami.is` is required because Umami POSTs events.

**Verify.** Build; view `_site/index.html` — stylesheet link has no `media="print"` and no `onload`. After deploy: `curl -sI https://igorcodes.dev | grep -iE 'content-security|strict-transport|x-content-type'` shows the headers, and the browser console shows no CSP violations on load or when clicking around.

## T7. Rewrite AGENTS.md to describe the real project

**Problem.** `AGENTS.md` actively misleads AI agents (and humans):

- Lines 42-52 list a "plugin/tooling baseline" of packages that are **not installed**: `@11ty/eleventy-img`, `@11ty/eleventy-navigation`, `@11ty/eleventy-plugin-bundle`, `@11ty/eleventy-plugin-rss`, `@11ty/eleventy-plugin-syntaxhighlight`, `@quasibit/eleventy-plugin-sitemap`, `luxon`. Real deps: `@11ty/eleventy`, `lucide`, `esbuild`, `lightningcss`, `html-minifier-terser`.
- Lines 11 & 21 reference an `app/work/` Markdown collection that **does not exist**.
- Line 40 says Node `>=20.11`; `package.json` engines say `^20.19.0 || >=22.13.0`.
- Line 56 recommends Eleventy Image (not installed); sitemap/feed/robots are hand-written `.njk`, not plugins.

**Fix.** Rewrite those sections to match reality: real dependency list; remove all `app/work/` references; correct Node range; state that sitemap/feed/robots/404 are hand-authored templates in `app/`; document the custom asset pipeline (`app/_tools/build-assets.mjs` + `assets-manifest.json` + `criticalCss.js`) and the `lucide` build-time shortcode in `.eleventy.js`. Keep the structure/boundaries sections, which are accurate. Update the "Performance Best Practices" section to say "if images are ever added, use @11ty/eleventy-img" rather than implying it is installed.

**Verify.** Every package named in AGENTS.md appears in `package.json`; every directory named exists; Node version matches `engines`.

## T8. Stop stamping the build time into sitemap, JSON-LD, and feed; fix or drop feed.xml

**Problem.** `app/_data/build.js` captures `new Date()` at build time. It feeds `sitemap.njk:11` (`<lastmod>`), `personal-site.njk:113,124` (JSON-LD `dateModified`), and `feed.njk:12,19` (`lastBuildDate`, every item's `<pubDate>`). Every deploy claims all content changed: crawlers learn to distrust `lastmod`, RSS readers see a perpetually "new" item with a stable guid, and builds are not reproducible (spurious diffs). The feed itself is semantically broken: one item, permalink guid, ever-changing pubDate, no `atom:link rel="self"`.

**Fix.**

1. Add a real content date to `app/_data/site.js`: `contentUpdated: "2026-07-05"` (owner should bump this when page content meaningfully changes; document that in README).
2. In `sitemap.njk`, use `{{ entry.data.updated or site.contentUpdated }}` for `<lastmod>`.
3. In `personal-site.njk`, use `site.contentUpdated` for both JSON-LD `dateModified` values.
4. **Recommended:** delete `app/feed.njk` entirely and change the layout's `<link rel="alternate" type="application/rss+xml" ...>` (`personal-site.njk:32`) to point at the blog's real feed (`https://blog.igorcodes.dev/feed.json`, type `application/feed+json`) or remove it. A single-page portfolio has nothing to syndicate; the blog is the real feed source. **Alternative (if the owner wants to keep feed.xml):** add `xmlns:atom="http://www.w3.org/2005/Atom"` on `<rss>`, add `<atom:link href="{{ (site.url + '/feed.xml') | url }}" rel="self" type="application/rss+xml" />` in `<channel>`, and use `site.contentUpdated` for `pubDate`.
5. `build.js` keeps only `year` for the footer copyright (that use is fine).

**Verify.** Run `npm run build` twice a minute apart; `diff -r` the two `_site/` outputs — identical except (at most) nothing. `_site/sitemap.xml` lastmod equals `site.contentUpdated`. If feed kept: validate at validator.w3.org/feed (or `npx feed-validator` equivalent); if dropped: no `feed.xml` link remains in `_site/index.html`.

## T9. Make production fail loudly when the asset manifest is missing or corrupt

**Problem.** Two independent silent fallbacks compound: (a) `app/_data/assets.js:18,28` returns unhashed dev paths if the manifest is missing or unparseable — the `catch {}` swallows JSON errors silently; (b) `.eleventy.js:97` separately checks manifest existence to decide which directory to pass through. A corrupt-but-present manifest makes them disagree: `.eleventy.js` copies `build/` while `assets.js` emits `/assets/css/...` paths that were never copied → 404s. A missing manifest ships unminified, un-fingerprinted assets with zero error output.

**Fix.** In `assets.js`: when `process.env.NODE_ENV === "production"`, `throw new Error("assets-manifest.json missing or invalid — run npm run build:assets first")` instead of falling back (both for missing file and for parse failure). Keep the dev fallback as is. This makes the `.eleventy.js` duplication harmless (build dies before output), but also simplify: in `.eleventy.js`, replace the `hasAssetManifest` check with just `isProduction` for choosing the passthrough directory.

**Verify.** `rm -f app/_data/assets-manifest.json && NODE_ENV=production npx eleventy` → build fails with the clear error. `npm run build` (which runs build:assets first) → succeeds. `npm run dev` → still works without a manifest.

## T10. Remove the dev-loop network fetch and validate feed URLs

**Problem A — dev latency.** `app/_data/writing.js` runs on every build and every dev-server reload, fetching `http://localhost:3000/feed.json` (per `site.js:31-35`) with a 4-second abort timeout. When the blog isn't running locally (the common case), every save stalls up to 4s. Measured: this data file is 83% of build time.

**Problem B — URL scheme injection.** `normalizeArticle()` accepts any `url` string from the fetched feed and the partial renders `href="{{ article.url }}"`. Nunjucks autoescaping prevents HTML injection (verified: article fields are not `| safe`), but not a `javascript:` URL. The feed is owner-controlled, so this is hardening, not an active vuln.

**Fix.**

1. Replace the hand-rolled fetch/cache with `@11ty/eleventy-fetch`: `npm i -D @11ty/eleventy-fetch`, then in `writing.js` use `EleventyFetch(FEED_URL, { duration: "1d", type: "json" })` inside the existing try/catch. This caches to `.cache/` automatically and stops refetching on every reload. Keep the existing normalize/fallback logic. Delete the manual `readCache`/`writeCache`/`AbortController` code.
2. Also change the dev default: in `site.js`, make dev use the production feed URL (`https://blog.igorcodes.dev/feed.json`) instead of localhost — with a 1-day cache this costs one request per day; `WRITING_FEED_URL` env var still overrides for local blog development. Document `WRITING_FEED_URL` in README (see T29).
3. In `normalizeArticle()`, after computing `url`, add: `if (!/^https?:\/\//i.test(url)) return null;`

**Verify.** `npm run dev`, save a template file twice — rebuilds are near-instant (no 4s stall, check the `[11ty] Benchmark` line no longer shows writing.js dominating). `npm run build` still renders real article titles in `_site/index.html`. Temporarily add a feed item with `"url": "javascript:alert(1)"` to a local test feed (or unit-test the function mentally): it is dropped.

## T11. Create a single source of truth for design tokens (critical vs full CSS drift)

**Problem.** `personal-site-critical.css` is a hand-maintained copy of ~270 lines of `personal-site.css` (both `:root` token blocks, reset, skip link, full theme toggle, full hero incl. its media queries). Nothing reconciles them, and they have **already drifted**:

- `--fm-shadow-glow` exists in `personal-site.css:23,62` but not in critical's `:root`;
- the element transition rule: critical sets `margin-block-start: 0` on `p,h1,h2,h3,h4,small,strong,li,span` (critical:143) while main replaces that rule with a `transition` and no margin reset (main:129-132) — the page only works because both files cascade together;
- `.fm-role`: `margin-bottom: 0` (critical:285) vs `margin: 0` (main:361);
- the font-family tokens `--font-sans/--font-display/--font-mono` are defined **only** in critical (:26-29) — `personal-site.css` and `not-found.css` are not self-contained and silently depend on the inlined critical `<style>`.

**Fix.** Extract shared foundations into one file, imported by both bundles:

1. Create `app/assets/css/tokens.css` containing: both `:root` token blocks (dark + `[data-theme="light"]`), including the font-family custom properties, and the box-sizing/reset rules that both files need.
2. At the top of `personal-site.css` and `personal-site-critical.css`, add `@import "./tokens.css";` and delete the now-duplicated blocks from both. lightningcss `bundle()` inlines `@import` for the main bundle; for the critical path, `criticalCss.js` uses `transform()` which does NOT resolve imports — **change `criticalCss.js` to use `bundle()` (same API shape as in `build-assets.mjs`) so the import is inlined**. In dev mode (`NODE_ENV !== "production"`), `criticalCss.js` currently returns the raw file; change dev to also use `bundle()` but with `minify: false`.
3. Reconcile the intentional differences explicitly: keep the `margin-block-start` reset in `tokens.css` (both bundles get it), keep transitions only in the main file (critical intentionally has no transitions — that's the point of the split). Fix the `.fm-role` margin inconsistency to `margin: 0` in both.
4. Leave the remaining structural duplication (toggle + hero rules appearing in both files) for now — it is deliberate (above-the-fold coverage) — but add a comment header to `personal-site-critical.css`: `/* Above-the-fold subset of personal-site.css WITHOUT transitions/hover. Tokens live in tokens.css. If you edit hero/toggle styles in personal-site.css, mirror the edit here. */`

**Verify.** `npm run build`; open `_site/index.html`: the inline `<style>` contains both theme token blocks and font tokens exactly once; the built CSS in `_site/assets/build/site-*.css` also contains them; page renders identically in both themes with no flash of unstyled/wrong-theme content on reload; `npm run dev` also renders correctly.

---

# P2 — Medium

## T12. Extract hardcoded page content into data files

**Problem.** `app/_includes/partials/personal-site-page.njk` inlines all content as 280 lines of HTML: 4 timeline entries (lines 30-64), 4 project cards with tag lists (78-159), 4 contact links (238-271). The repo's own AGENTS.md mandates "keep data logic in `_data` files; keep templates focused on presentation", and the Writing section already follows that pattern via `writing.js`. Editing content means hand-editing HTML and keeping the timeline's left/right alternation classes and `aria-*` wiring intact each time.

**Fix.**

1. Create `app/_data/timeline.js` exporting an array of `{ year, title, description }` (copy the four entries verbatim).
2. Create `app/_data/projects.js` exporting `{ title, url, linkText, description, tags: [] }` — for the two cards that link to `#contact`, use `url: "#contact", linkText: "Ask about it"`; external ones get `linkText: "Visit site"`.
3. Create `app/_data/contacts.js` exporting `{ label, value, href, icon, external }` for Email/GitHub/LinkedIn/Telegram.
4. In the partial, replace the hardcoded blocks with `{% for %}` loops reproducing the exact current markup. Derive alternation with `{% if loop.index0 % 2 == 0 %}fm-timeline-item-left{% else %}fm-timeline-item-right{% endif %}`. For project links: render `target="_blank" rel="noopener noreferrer"` and the "(opens in a new tab)" visually-hidden suffix only when the URL starts with `http`.
5. The rendered HTML must be byte-equivalent in structure to the current output (same classes, same aria attributes, same visually-hidden text patterns).

**Verify.** `npm run build` before and after; `diff` the two `_site/index.html` files — differences should be zero or whitespace-only. All reveal animations and links still work.

## T13. De-duplicate theme colors (three sources of truth)

**Problem.** Theme colors live in: `site.js:8-9` (source of truth), the inline head script (`personal-site.njk:135-136`, correctly templated from site.js), and **hardcoded hex** in `personal-site.js:58` (`"#f6f1e8"`/`"#0a0a0a"`). Changing the palette in `site.js` leaves the runtime toggle setting a stale `theme-color`.

**Fix.** In `personal-site.njk`, add data attributes to `<html>` or `<body>`: `data-theme-color-light="{{ site.themeColorLight }}" data-theme-color-dark="{{ site.themeColorDark }}"`. In `personal-site.js` `applyTheme()`, read them: `const { themeColorLight, themeColorDark } = document.documentElement.dataset;` and use those instead of the literals. Also add a comment to both the inline script and `personal-site.js` noting they are a deliberately duplicated pair (inline runs pre-paint to avoid theme flash) and must agree on the storage key `fm-theme` and default-dark behavior.

**Verify.** Build; toggle the theme and inspect `<meta name="theme-color">` — it flips between the two values from `site.js`. Change `themeColorLight` in `site.js`, rebuild, toggle again — the new value appears without touching JS.

## T14. Escape JSON-LD values as JSON

**Problem.** `personal-site.njk:64-128` interpolates `site.description`, `pageDescription`, `pageTitle`, `site.author` etc. directly inside a `<script type="application/ld+json">`. Nunjucks HTML-escaping is not JSON escaping: a `"` or `\` in any of these strings produces invalid JSON; a literal `</script>` would break out of the element. Owner-controlled today, but fragile hardening-wise.

**Fix.** Use the `dump` filter for every string value, e.g. change `"description": "{{ site.description }}"` to `"description": {{ site.description | dump | safe }}` (note: `dump` emits the surrounding quotes — remove the manual ones). Apply to all interpolated string values in the JSON-LD block, including the `sameAs` array (replace the for-loop with `{{ site.sameAs | dump | safe }}`).

**Verify.** Build; extract the JSON-LD from `_site/index.html` and parse it: `node -e 'const m=require("fs").readFileSync("_site/index.html","utf8").match(/<script type="application\/ld\+json">(.*?)<\/script>/s); JSON.parse(m[1]); console.log("valid")'`. Temporarily put a `"` in the site description, rebuild, re-run the parse check, then revert.

## T15. Give browser JS files browser globals in ESLint

**Problem.** `eslint.config.mjs:28-35` applies `globals.node` + `sourceType: "commonjs"` to all `**/*.{js,cjs}`, including the browser scripts in `app/assets/js/`. That is why both files carry `/* global window, document, IntersectionObserver */` header comments.

**Fix.** Add a block **after** the existing `**/*.{js,cjs}` block:

```js
{
  files: ["app/assets/js/**/*.js"],
  languageOptions: {
    sourceType: "script",
    globals: { ...globals.browser },
  },
},
```

Then delete the `/* global ... */` comments from `personal-site.js` and `not-found.js`.

**Verify.** `npm run lint` passes. Temporarily use `navigator.foo` in `personal-site.js` — no `no-undef` error (browser global known); use `process.env` — `no-undef` fires. Revert the temp edits.

## T16. Pin the Node version in mise.toml

**Problem.** `mise.toml` sets `node = "latest"` while `package.json` engines require `^20.19.0 || >=22.13.0`. mise users float to the newest Node (possibly untested); CI may use another version.

**Fix.** Set `node = "22.13.0"` (matches engines and the CI version from T5).

**Verify.** `mise install && mise exec -- node --version` prints v22.13.x; `npm run build` succeeds under it.

## T17. Font loading correctness: preload the right face, drop unmatched faces

**Problem.**

- The layout preloads only `wotfard-regular` (weight 400) (`personal-site.njk:56-62`), but the hero headline (`.fm-name`, `.fm-role`) uses weight **500 (medium)** and the tagline weight **300 (light)** — the largest text on first paint swaps in late while a less-visible face was preloaded.
- `@font-face` declarations exist for faces no CSS rule ever matches. Weight/style usage across all CSS at audit time: 300, 400, 500, 600, 700 all in `font-style: normal`; **no rule sets `font-style: italic`**. So `wotfard-regularitalic` and `DankMono-Italic` are unmatched. **Caution:** `DankMono-Bold` (700) may be matched by the 404 page's weight-700 mono text — check before deleting.

**Fix.**

1. In `personal-site.njk`, change the preload to `wotfard-medium-webfont.woff2` (the hero face). Optionally add a second preload for `wotfard-light-webfont.woff2`. Do not preload more than two.
2. For each `@font-face` in `noncritical-fonts.css` and `personal-site-critical.css`, verify usage: `grep -n "font-weight\|font-style\|font-family" app/assets/css/*.css` and map weight+style+family combinations actually used against declared faces. Delete unmatched declarations AND their files from `public/fonts/`. (Expected deletions: the two italic faces; keep `DankMono-Bold` only if a `font-family: var(--font-mono)` context uses weight 700.)

**Verify.** Build; every `url(/fonts/...)` in the built CSS resolves to a file in `_site/fonts/`; no file in `_site/fonts/` is unreferenced by the built CSS. In devtools Network panel, the hero headline font (`wotfard-medium`) is fetched with priority from the preload, and rendering shows no missing-weight faux-bolding anywhere (check tags, skip-link focus state, and the 404 page's big "404" digits).

## T18. Simplify the theme toggle's ARIA and fix its focus order

**Problem.** The toggle has both `aria-label="Light theme"` (never updated by JS) and `aria-describedby` pointing at status text that JS rewrites — screen readers announce roughly "Light theme, switch, off, Dark theme active. Activate to switch to light theme": verbose and self-contradictory. The status node is not a live region, so its updates are never announced anyway. Separately, the button sits before `<main>` in the DOM (2nd tab stop) but is visually pinned bottom-right — focus order doesn't match visual placement.

**Fix.**

1. In `personal-site.njk`: keep `role="switch"` and `aria-checked`; change the label to a state-neutral `aria-label="Light theme"` → keep as is; **remove** `aria-describedby="theme-toggle-status"` and the entire `<span id="theme-toggle-status">` element.
2. In `personal-site.js`: delete `themeToggleStatus` and the status-text logic in `updateThemeToggleState()` (keep the `aria-checked` update).
3. Move the whole `<button class="fm-theme-toggle">` block to just **after** `</main>` in the layout (position: fixed keeps it visually identical; tab order becomes skip-link → content → toggle).

**Verify.** Build; with a screen reader (or accessibility tree inspector) the toggle announces as "Light theme, switch, on/off" only. Tab order: skip link first, then hero links, toggle last. Toggle still works and `aria-checked` flips.

## T19. Remove the Cmd/Ctrl+Shift+T keyboard hijack

**Problem.** `personal-site.js:99-104` intercepts Cmd/Ctrl+Shift+T with `preventDefault()` to toggle the theme — silently overriding the universal browser shortcut for "reopen closed tab", site-wide, with no discoverability.

**Fix.** Delete the entire `window.addEventListener("keydown", ...)` block. The visible toggle button is sufficient.

**Verify.** `npm run lint`; build; Ctrl/Cmd+Shift+T in the browser reopens a closed tab as normal; the click toggle still works.

## T20. Move the footer out of `<main>`

**Problem.** The layout renders `<main id="content">{{ content }}</main>` and the content partial ends with `<footer class="fm-footer">` — a footer that is a descendant of `main` is not exposed as a `contentinfo` landmark, so the page has none.

**Fix.** Cut the `<footer class="fm-footer">...</footer>` block (partial lines 275-279) out of `personal-site-page.njk` and paste it into `personal-site.njk` immediately after `</main>`. Note: the footer currently sits inside `<div class="fm-page">` — check `.fm-page`/`.fm-footer` CSS for layout dependencies (there are none apparent: `.fm-footer` uses its own container). Since the 404 page uses the same layout but its own content (currently no footer rendered on 404), adding the footer to the layout will now show it on the 404 page too — that is acceptable and more consistent; if undesired, wrap it in `{% if not notFoundPage %}`.

**Verify.** Build; in the accessibility tree, a `contentinfo` landmark exists at page level; footer renders visually unchanged at the page bottom in both themes and at mobile/desktop widths.

## T21. Coordinate theme-switch transitions (kill the three-speed "wave")

**Problem.** On theme toggle, elements retint at three different speeds: text/links/body over 280ms (`--fm-motion-theme`), cards/project links/contact icons over 160ms (`--fm-motion-fast`), and several tokened elements **snap instantly** with no transition at all: `.fm-tags li` (background/border/color), `.fm-timeline-line`, `.fm-timeline-dot`, `.fm-timeline-progress` gradient. The switch reads as an uncoordinated wave.

**Fix.** In `personal-site.css`, add `transition: background-color var(--fm-motion-theme) var(--fm-ease-standard), border-color var(--fm-motion-theme) var(--fm-ease-standard), color var(--fm-motion-theme) var(--fm-ease-standard);` to `.fm-tags li`, `.fm-timeline-line`, and `.fm-timeline-dot` (leave `.fm-timeline-progress` alone — it's accent-gradient on both themes and animates height already). Where an element already has a transition list for hover states (e.g. `.fm-card` uses `--fm-motion-fast` for border/background), extend the list so color-theme properties use `--fm-motion-theme` while transform/shadow keep `--fm-motion-fast` — do not just change the existing duration, or hover feedback becomes sluggish. Add the new selectors to the `prefers-reduced-motion` `transition: none` list (`:1064-1080` area).

**Verify.** Build; toggle theme and watch tags and timeline dots fade in sync with body text instead of snapping. Hover a card — hover reaction is still fast. With reduced motion emulated (devtools rendering panel), theme switch is instant everywhere.

## T22. Dependency and Eleventy-config hygiene

**Problem.** (a) `lucide` sits in `dependencies` but is used only at build time in `.eleventy.js` — the shipped site contains no lucide runtime. (b) `.eleventy.js` has two near-identical attribute serializers (`renderElement:53-66` and inline in `renderLucideSvg:73-82`). (c) `isProduction` is computed at line 86 but line 127 re-checks `process.env.NODE_ENV` directly. (d) The icon map renders semantically wrong glyphs for brands (`github`→GitBranch, `linkedin`→BriefcaseBusiness, `telegram`→Globe) — a known workaround for Lucide v1 removing brand icons.

**Fix.**

1. Move `lucide` from `dependencies` to `devDependencies` (`npm i -D lucide && npm rm lucide` or edit package.json + `npm install`).
2. Extract one `serializeAttributes(attributes)` helper used by both `renderElement` and `renderLucideSvg`.
3. Use the existing `isProduction` in the htmlmin transform condition.
4. **[OWNER DECISION]** brand icons: if brand fidelity matters, add `simple-icons` as a devDependency and render real GitHub/LinkedIn/Telegram paths in the shortcode for those three names; otherwise leave as is and add a comment in `.eleventy.js` explaining the substitution.

**Verify.** `npm run lint && npm run build`; `_site/index.html` still contains the same inline SVGs (diff before/after — icon markup unchanged); `package.json` `dependencies` is empty.

## T23. Make build-assets.mjs observable and guard the no-bundle constraint

**Problem.** `app/_tools/build-assets.mjs` prints nothing on success and a raw stack on any failure; there is no per-asset context. It also uses esbuild `transform()` (single-string, no import resolution) — the moment either JS file gains an `import`, the output is silently broken (minified but unresolved import in an IIFE).

**Fix.**

1. Switch `buildJs` from `transform()` to `esbuild.build()` with `{ entryPoints: [entryPath], bundle: true, write: false, minify: true, target: ["es2020"], format: "iife", legalComments: "none" }` and take `result.outputFiles[0].contents`. This makes future imports just work.
2. After each asset is written, `console.log` the mapping: `css → /assets/build/site-<hash>.css (<n> bytes)`.
3. Wrap each build call so failures report which entry failed before rethrowing.

**Verify.** `npm run build:assets` prints four mapping lines; add a temporary `import x from "./nope.js"` to `personal-site.js` → the build fails with a clear esbuild resolution error naming the file; revert. `npm run build` output unchanged in `_site/`.

---

# P3 — Low / polish

## T24. SEO/meta cleanup

All in small, independent edits:

1. **Drop the hreflang pair** (`personal-site.njk:29-30`): `hreflang="en"` + `x-default` both pointing at the canonical of a monolingual site do nothing. Delete both `<link rel="alternate" hreflang=...>` lines.
2. **robots.txt** (`app/robots.njk`): remove the non-standard `Host: igorcodes.dev` line (Yandex-only, ignored by Google/Bing, and it hardcodes the apex while `site.url` is env-driven).
3. **Redundant collection filter**: in `feed.njk:14` (if kept after T8) and `sitemap.njk:8`, drop `and not entry.data.eleventyExcludeFromCollections` — excluded entries never appear in `collections.all`. Keep the `entry.url` and `noindex` checks.
4. **theme-color for light mode**: the initial HTML has only the dark `<meta name="theme-color">` (`personal-site.njk:15`); pre-JS paint is wrong for light-preference users. Replace with a pair:
   ```html
   <meta
     name="theme-color"
     content="{{ site.themeColorDark }}"
     media="(prefers-color-scheme: dark)"
   />
   <meta
     name="theme-color"
     content="{{ site.themeColorLight }}"
     media="(prefers-color-scheme: light)"
   />
   ```
   and update the inline script + `personal-site.js` to target the correct meta (querySelector currently grabs the first `meta[name="theme-color"]`; with stored-theme override it should update both, or drop the media attributes and keep runtime control — keep it simple: keep both metas with media queries for the no-JS case, and have JS continue rewriting the first matching meta's content after removing its `media` attribute).
5. **www/apex**: confirm at the platform level that `www.igorcodes.dev` 301-redirects to the apex (canonical is always apex). Document the expectation in README.

**Verify.** Build; `grep -c hreflang _site/index.html` → 0; `_site/robots.txt` has no `Host:`; sitemap unchanged otherwise; emulate light preference with JS off — browser UI tints cream.

## T25. Markup nits (accessibility polish)

1. `partials/personal-site-page.njk:4`: change `<p class="fm-role">SOFTWARE ENGINEER</p>` to `<p class="fm-role">Software Engineer</p>` and add `text-transform: uppercase;` to `.fm-role` in both `personal-site.css` and `personal-site-critical.css` (`.fm-role` already sets `letter-spacing`; some screen readers spell out all-caps HTML as initialisms, and copy-paste/translation get the real string).
2. Replace the `<i aria-hidden="true">•</i>` separators (writing list, lines 181/198) with `<span aria-hidden="true">•</span>` and move the `.fm-writing-list small i` styles to a class (e.g. `.fm-dot-sep`). `<i>` has emphasis semantics that don't apply.
3. Hero links "View Work"/"Get in Touch" (`.fm-hero-links a`, `personal-site.css:397` area) compute to ~24px tall — marginal for WCAG 2.5.8. Increase padding to `0.5rem 0.7rem`.

**Verify.** Build; visual appearance of the role line and separators unchanged (uppercase now via CSS); hero links measurably ≥32px tall in devtools; lint/build green.

## T26. Delete dead code and stale config

Each item verified dead at audit time — re-verify with the given grep before deleting:

1. `app/assets/css/fonts.css` — orphaned 78-line duplicate of the @font-face declarations; imported nowhere (`grep -rn "fonts.css" app/ --include="*.css" --include="*.njk" --include="*.js"` matches only `noncritical-fonts.css`). Delete.
2. `public/images/profile-blob.svg` — referenced nowhere (`grep -rn "profile-blob" app/`). Delete (or wire it into the hero if the owner wants it — ask).
3. Dead CSS: `--fm-shadow-glow` (defined `personal-site.css:23,62`, used 0×) — either delete from both themes or apply it where a glow is wanted; `--fm-focus-ring` (defined, used 0× — focus styles use `var(--fm-accent)` directly) — delete; `.fm-theme-toggle-glow` (appears only inside the reduced-motion selector list at `:1070`, no rule/element) — remove from the list; `.fm-writing-active` (`:874-879`, never applied by JS or templates — `grep -rn "fm-writing-active" app/` matches only the CSS) — delete.
4. Next.js template cruft: remove `.next/**` from `eslint.config.mjs` ignores; remove `.next`, `out`, `.turbo` from `.prettierignore` (keep `.vercel`).
5. `.vscode/settings.json` contains only `{ "chatgpt.openOnStartup": true }` — a personal preference. Either delete + gitignore `.vscode/`, or replace with genuinely shared settings (Prettier as default formatter, format-on-save).
6. Dark `:root` hardcodes `rgba(0,217,255,…)` literals (`personal-site.css:14-16,23,32`) while the light theme builds the same values from `--fm-accent-rgb` — rewrite the dark literals as `rgba(var(--fm-accent-rgb), …)` for consistency (also applies inside `tokens.css` after T11).

**Verify.** For each deletion, the grep above returns no live references; `npm run build` green; site renders identically (spot-check both themes, the writing list hover, and the theme toggle focus ring).

## T27. CSS organization and polish

1. Add section banner comments to `personal-site.css` (`/* ===== Tokens ===== */`, Reset, Skip link, Theme toggle, Hero, Timeline, Cards, Writing, Contact, Footer, Reveal, Media queries) — it is currently 1334 unlabeled lines.
2. Add `::selection { background: var(--fm-accent-soft-strong); color: var(--fm-text); }` — cheap polish consistent with the token system.
3. Reduced-motion completeness: the theme-retint transitions on `body.fm-body`, `a`, and the `p,h1…span` group still run under `prefers-reduced-motion`. Color-only transitions are defensible, but for strict compliance add them to the `transition: none` block.
4. Optional (skip if unsure): scrollbar styling via `scrollbar-color: var(--fm-border-strong) transparent;` on `html`.

**Verify.** Build; selection color matches the accent tint in both themes; with reduced motion emulated, toggling theme changes colors instantly.

## T28. Repo/docs hygiene

1. **README**: document all env vars actually read (`SITE_URL`, `WRITING_FEED_URL`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `NODE_ENV`), the deploy story (platform, build command `npm run build`, output `_site/`, plus the headers file from T6), and the `site.contentUpdated` bump rule from T8.
2. **LICENSE**: add an explicit note (README section or LICENSE file) that the code is the owner's, all rights reserved (or a license of the owner's choice — ask), and that fonts under `public/fonts/` are third-party commercial fonts NOT covered by the repo license (ties into T2).
3. Move `THEME-TRANSFER.md` into `docs/` (it is a cross-repo design-token contract with the blog; root is cluttered). Update any references.
4. Optional: add `public/.well-known/security.txt` with a contact line.

**Verify.** README instructions work from a clean clone (`git clone` → `npm ci` → `npm run build`); all env vars named in README appear in the code and vice versa.

## T29. Optional: migrate Eleventy config and data files to ESM

`.eleventy.js` and `app/_data/*.js` are CommonJS while the rest of the toolchain is ESM. Eleventy 3 supports `eleventy.config.js` with ESM natively. Purely consistency; do this last, in one commit, converting `.eleventy.js` → `eleventy.config.js` (export default) and each `_data/*.js` to `export default`. **Skip if anything is unclear** — zero user-facing value.

**Verify.** `npm run dev` and `npm run build` both work; `_site/` output identical to before.

---

# Explicitly considered and NOT recommended

- **Replacing the custom asset pipeline with `@11ty/eleventy-plugin-bundle`**: the hand-rolled pipeline (fingerprinting + critical CSS inlining) is more machinery than one page strictly needs, but it works, and T9/T11/T23 remove its sharp edges. A migration is a rewrite with visual-regression risk and little payoff. Revisit only if the site grows pages.
- **Adding a JS test framework**: for a static page, CI (T5: lint + build + linkinator) is the pragmatic test suite. Unit tests for `writing.js` normalization would be the first candidate if tests are ever added.
- **Consolidating the blog into this repo**: the split (portfolio here, blog on `blog.igorcodes.dev` consumed via feed) is sound.
- **Renaming the `fm-` class prefix or `personal-site-*` filenames**: the prefix is load-bearing (shared with the blog via THEME-TRANSFER.md and the `fm-theme` localStorage key). Leave it; T11's comment header documents it.

# Suggested execution order (dependency-aware)

1. T3, T4, T19, T20 — small, independent accessibility fixes.
2. T5 (CI) — so everything after is gated.
3. T9, T10, T16, T15, T22, T23 — build/tooling correctness.
4. T8, T14, T24 — SEO/data correctness.
5. T11 then T13 then T17, T21, T25, T26, T27 — CSS/token work (T11 first; others touch the same files).
6. T6 — headers + stylesheet loading change (test after CSS work settles).
7. T12 — content extraction (largest diff; do when the templates are otherwise stable).
8. T7, T28 — docs last, so they describe the final state.
9. T1, T2 — whenever the owner supplies assets/decisions (T1 is top priority the moment assets exist).
