# Purge commercial fonts from git history

> **Status: completed.** History was rewritten and force-pushed; `main` no longer
> contains any font binaries in any commit. This document is kept as the record
> of what was done and how to redo it if fonts are ever re-committed.

The Wotfard (Atipo Foundry) and Dank Mono fonts are **commercial,
non-redistributable** fonts. Because this repository is public, their binaries
were downloadable from the raw git history — which is redistribution and likely
violates both licenses. Deleting the files in a normal commit is **not** enough;
they remain in every earlier commit. Over the repo's life the binaries lived in
**three** locations, all of which had to be purged:

- `app/fonts/` — the original location (a full family: many weights + italics)
- `public/fonts/` — the later, trimmed set actually served
- `__fonts/` — a short-lived root directory

This runbook rewrites history to remove them. It is **destructive** and requires
a **force-push** — coordinate with anyone else who has a clone before running it,
and take a backup first.

## How builds get the fonts now (already wired up)

The fonts are no longer tracked in git. Instead:

- `public/fonts/` is in `.gitignore`; keep your own licensed `.woff2` copies
  there for local dev (they are used as-is and never committed).
- The licensed files live in a **private Vercel Blob store**. `app/_tools/`
  holds the machinery, driven by `app/_tools/fonts-manifest.mjs` (the single
  list of expected files):
  - `pnpm fonts:upload` — one-time (or on font change) push of the local
    `public/fonts/*.woff2` into the Blob store.
  - `pnpm fonts:fetch` — runs first in `pnpm build`; idempotent. If the files
    are already on disk it does nothing; otherwise it downloads them from Blob
    using `BLOB_READ_WRITE_TOKEN`.
- On Vercel, connect a Blob store to the project so `BLOB_READ_WRITE_TOKEN` is
  injected into the build automatically. `app/assets/css/*.css` already expects
  the fonts at `/fonts/...` and Eleventy passthrough-copies `public/` → `/`.

So before rewriting history, make sure the fonts are in Blob:

```bash
vercel env pull          # writes BLOB_READ_WRITE_TOKEN into .env.local
pnpm fonts:upload        # uploads the 6 woff2 from public/fonts/
```

> Alternative to the whole approach: switch to open-licensed fonts you *can*
> commit (Wotfard → a libre grotesque, Dank Mono → JetBrains Mono in
> `noncritical-fonts.css` / `personal-site-critical.css`). That is a visual
> change but removes the licensing constraint entirely.

## 1. Back up

```bash
git clone --mirror . ../igorcodes-backup.git
```

## 2. Rewrite history

Preferred: [git-filter-repo](https://github.com/newren/git-filter-repo)
(`brew install git-filter-repo`). This removes all three historical font
locations from every commit:

```bash
git filter-repo --path app/fonts --path public/fonts --path __fonts --invert-paths
```

If `git-filter-repo` is unavailable, git's built-in `filter-branch` does the same
(this is what was actually used):

```bash
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch app/fonts public/fonts __fonts' \
  --prune-empty --tag-name-filter cat -- --all
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all && git gc --prune=now
```

Verify nothing remains before pushing:

```bash
git rev-list --all --objects | grep -iE 'woff|\.otf|\.ttf'   # expect no output
```

`git filter-repo` strips the `origin` remote as a safety measure; re-add it:

```bash
git remote add origin git@github.com:igorxciv/igorcodes.git
```

## 3. Force-push

```bash
git push --force-with-lease origin main
```

Everyone else must then re-clone (their old clones still contain the binaries).
If the repo was ever cloned/forked by others while the fonts were tracked,
consider the binaries already exposed — rotating is not possible for fonts, so
the practical mitigation is the rewrite plus keeping the repo's future history
clean.

> Alternative to all of the above: make the repository private. Then serving and
> tracking the fonts is fine and no history rewrite is needed.
