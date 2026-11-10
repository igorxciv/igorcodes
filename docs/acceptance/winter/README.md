# Winter scene acceptance checks: evidence

Throwaway branch, never merged. Evidence for the ticket "Run the acceptance
checks on real devices" (#42) on the map "Build the winter scene" (#29). The
results and verdicts live in the ticket's comments; this folder holds what
they were judged from.

Run on 10 November 2026 against production (`https://www.igorcodes.dev`,
assets identical to a local build of `main` at `ae1b922`), from a MacBook Pro
(M1 Pro, 10 cores, 32 GB). Playwright 1.65.0: headless Chromium, Firefox and
WebKit, plus real Google Chrome headed with the GPU (ANGLE Metal).

## Files

- `results/out-{chromium,firefox,webkit}.json`: functional probe per engine
  (`scripts/probe.mjs`): preview, season control, stored "off", CSP,
  three.js blocked, WebGL disabled, reduced motion, emulated forced colours,
  selection, find, accessibility tree, translation, phone lighter form.
- `results/contrast-extremes.json`: hero text against the lightest and
  darkest pixel behind it over 16 frames (`scripts/look.mjs contrast`).
- `shots/behind-text-*.png`: what sits behind the hero copy, text hidden,
  text boxes outlined in red; per-pixel lightest (dark theme) or darkest
  (light theme) over 30 frames (`scripts/contrast2.mjs`). Only snowflakes
  cross the boxes.
- `shots/look-*.png`: production next to the prototype (`winter-look` B2 for
  dark, `winter-light-theme` L1 for light), desktop 1440x900 and phone
  390x844, with and without Christmas (`scripts/look.mjs look`).
- `shots/headings-with-margin.png`: letter snow on a section heading,
  production vs prototype, both themes (`scripts/heads.mjs`).
- `shots/pine-*.png`: the shipped simplified pine next to the unsimplified
  75,812-byte file, swapped in by request routing on the production page at
  2x (`scripts/look.mjs pine`).
- `scripts/mech.sh`: the build-failure and delete-the-folder checks.

## Numbers not in the JSON

Real Chrome, headed, 1440x900 at 2x (canvas 2880x1800), full form
(`scripts/perf.mjs`):

| | Winter | Winter + Christmas |
| --- | --- | --- |
| Frame rate over 10 s | 60.0 fps | 60.1 fps |
| Draw calls per frame | 30 | 114 |
| Ambient script requested | 2.3 s after navigation | 2.2 s |
| Long tasks (over 50 ms), load and mount | none | none |
| Longest gap between frames | 42 ms | 33 ms |

Slow software rendering (headless Chromium, phone viewport): full form
stepped down to the lighter form; the lighter form at 0.7 fps was removed
about 21 s after mount, accents stayed, the control stayed on, nothing was
stored.

Hidden tab, simulated by overriding `document.hidden` and firing
`visibilitychange` (`scripts/hidden2.mjs`): 0 draw calls in 2 s in Chromium,
Firefox and WebKit, drawing resumed when visible. Playwright keeps pages
"visible" even when the window is minimised (`scripts/hidden.mjs`), so a real
hidden tab was not produced.
