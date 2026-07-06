// Single source of truth for the licensed font files.
//
// Wotfard (Atipo Foundry) and Dank Mono are commercial, non-redistributable
// fonts, so their `.woff2` binaries are NOT committed to this (public) repo.
// They live in a private Vercel Blob store and are fetched into `public/fonts/`
// at build time. Paths below are relative to `public/` and double as the blob
// pathnames in the store.
export const FONT_FILES = [
  "fonts/wotfard/wotfard-light-webfont.woff2",
  "fonts/wotfard/wotfard-regular-webfont.woff2",
  "fonts/wotfard/wotfard-medium-webfont.woff2",
  "fonts/wotfard/wotfard-semibold-webfont.woff2",
  "fonts/wotfard/wotfard-bold-webfont.woff2",
  "fonts/dank-mono/DankMono-Regular.woff2",
];
