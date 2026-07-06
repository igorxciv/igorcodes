# Purge commercial fonts from git history

The fonts under `public/fonts/` (Wotfard by Atipo Foundry, and Dank Mono) are
**commercial, non-redistributable** fonts. Because this repository is public,
their binaries are downloadable from the raw git history — which is
redistribution and likely violates both licenses. Deleting the files in a normal
commit is **not** enough; they remain in every earlier commit.

This runbook rewrites history to remove them. It is **destructive** and requires
a **force-push** — coordinate with anyone else who has a clone before running it,
and take a backup first.

## 1. Back up

```bash
git clone --mirror . ../igorcodes-backup.git
```

## 2. Rewrite history

Uses [git-filter-repo](https://github.com/newren/git-filter-repo)
(`brew install git-filter-repo`). This removes both the live `public/fonts/`
binaries and the already-deleted root `__fonts/` directory from all history:

```bash
git filter-repo --path public/fonts --path __fonts --invert-paths
```

## 3. Re-supply the fonts for builds (they are no longer in git)

After the purge, the build has no fonts. Choose one:

- **Serve from a non-tracked deployment artifact.** Fetch the licensed `.woff2`
  files into `public/fonts/` during the deploy/build step (e.g. from a private
  bucket or a Vercel-stored artifact), and add `public/fonts/` to `.gitignore`
  so they are never re-committed. `app/assets/css/*.css` already expects them at
  `/fonts/...`.
- **Replace with open-licensed fonts.** Swap Wotfard → a libre grotesque and
  Dank Mono → JetBrains Mono in `noncritical-fonts.css` /
  `personal-site-critical.css`. This is a visual change.

## 4. Force-push

```bash
git push --force-with-lease origin main
```

Everyone else must then re-clone (their old clones still contain the binaries).

> Alternative to all of the above: make the repository private. Then serving and
> tracking the fonts is fine and no history rewrite is needed.
