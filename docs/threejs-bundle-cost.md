# three.js bundle cost and leanest import path

Research for [#12](https://github.com/igorxciv/igorcodes/issues/12), part of
the seasonal scenes map [#11](https://github.com/igorxciv/igorcodes/issues/11).
Measured 2026-11-09. Nothing in the site was changed; all builds ran in a
scratch directory outside the repo.

## Answer

A minimal snowfall scene costs about **109 kB brotli / 134 kB gzip / 544 kB
minified** with `WebGLRenderer`, and almost all of that is the renderer: the
scene itself adds about 2.4 kB brotli on top of an empty renderer. The site's
whole current script is 0.9 kB brotli, so three.js is roughly 120 times the JS
the home page ships today. It has to be a lazy chunk.

Recommended setup:

1. `import { ... } from "three"` with named imports and `WebGLRenderer`. Not
   `three/webgpu`.
2. Build the scene as its own content-hashed ES module and load it with
   `import()` from the main script after idle or on a season-control action.
3. Leave the CSP in `vercel.json` as it is. It already permits this setup.

## Versions measured

| Package | Version | Note |
| --- | --- | --- |
| three | 0.187.0 (r187, published 2026-10-30) | npm `latest` on the day |
| rolldown | 1.3.0 | the version pinned in this repo's `package.json` |
| Node | 24.18.0 | scratch machine; the repo pins 26, which does not affect bundle output size |
| Chrome | 157.0.8103.50 headless | CSP check only |

Bundles used the same options as `buildJs()` in
`app/_tools/build-assets.mjs`: default input options, `minify: true`. Gzip is
level 9 and brotli is quality 11 from `node:zlib`.

## Sizes

The test scene: 1500 snowflakes, a runtime-drawn `CanvasTexture` sprite (no
image request), a snowman from three `SphereGeometry` meshes, three trees from
`ConeGeometry` and `CylinderGeometry`, `MeshLambertMaterial`, one ambient and
one directional light, a resize handler.

`format: "iife"`, single file, bytes:

| Bundle | Minified | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Empty: `WebGLRenderer` + `Scene` + `PerspectiveCamera` | 528,301 | 128,621 | 105,423 |
| Snowfall as `Points` + `PointsMaterial`, lit meshes | 540,375 | 131,646 | 107,813 |
| Same, unlit (`MeshBasicMaterial`, no lights) | 535,444 | 130,647 | 107,096 |
| Snowfall as `InstancedMesh` of planes, lit meshes | 541,371 | 132,029 | 108,120 |
| `Points` scene imported from `three/src/Three.js` | 546,207 | 136,021 | 111,184 |
| `Points` scene on `three/webgpu` (`WebGPURenderer`) | 826,960 | 219,104 | 177,159 |
| Whole `three` (`import *`, kept alive on `window`) | 748,374 | 185,744 | 150,490 |
| Whole `three/webgpu` | 1,128,465 | 301,080 | 241,068 |
| Current `personal-site.js` | 2,177 | 1,008 | 885 |
| Current `not-found.js` | 1,521 | 701 | 570 |

`format: "es"` (what a lazy chunk needs), bytes:

| Bundle | Minified | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Empty renderer | 531,616 | 130,679 | 106,678 |
| `Points` scene | 543,648 | 133,732 | 108,967 |
| `InstancedMesh` scene | 544,646 | 134,101 | 109,314 |
| `Points` scene + `GLTFLoader` | 627,904 | 155,408 | 126,619 |
| `Points` scene on `three/webgpu` | 832,140 | 224,058 | 179,530 |

Reading the numbers:

- **The renderer is the cost.** The empty renderer is 105 kB brotli; a full
  scene is 108 kB. Geometry, material and light choices move the total by
  about 1 kB.
- **Points versus instancing is a wash for size** (0.3 kB brotli apart). Choose
  on looks and performance, not bytes.
- **`GLTFLoader` adds about 17.7 kB brotli** (84 kB minified), before any
  model file. Procedural geometry adds close to nothing. This bears on the
  open "procedural geometry or authored models" question in #11.
- **`WebGPURenderer` adds about 70 kB brotli** over `WebGLRenderer` for the
  same scene (179.5 versus 109.0 kB, +65%).
- These are best-case compression levels. The same ES `Points` bundle is
  123.7 kB at brotli quality 5 and 134.3 kB at gzip level 6. Vercel serves
  brotli when the client accepts it and compresses `javascript` responses
  automatically ([Vercel CDN compression](https://vercel.com/docs/how-vercel-cdn-works/compression)),
  but the docs do not state the quality level, so expect 109 to 124 kB on the
  wire.

## Tree-shaking

It works, but the floor is high. Importing three names from `three` produces
a bundle 30% smaller than the whole library (105.4 versus 150.5 kB brotli),
and `import * as THREE` with only three members used produces a byte-identical
bundle to named imports (528,301 bytes both ways), so rolldown shakes namespace
imports too. Named imports are still the safer habit.

The floor exists because `WebGLRenderer` statically references the shader
library for every built-in material, shadow maps, PMREM, WebXR and the rest,
so those survive whatever the scene uses. The package splits into `build/three.core.js` (shared) and `build/three.module.js`
(WebGL renderer), with `three/webgpu` and `three/tsl` as separate entries; the
`exports` map and `"sideEffects": ["./src/nodes/**/*"]` are in
[`package.json` at r187](https://github.com/mrdoob/three.js/blob/r187/package.json).

Importing from `three/src/Three.js` instead of the prebuilt entry made the
bundle larger (111.2 versus 107.8 kB brotli), so there is no gain in bypassing
`build/`.

## WebGLRenderer versus WebGPURenderer

Use `WebGLRenderer`.

- WebGL 2 is Baseline widely available (high since 2024-03-20). WebGPU is not
  Baseline at all: `web-features` 3.45.0 lists Chrome/Edge 144, Chrome Android
  121 and Safari 26, with no Firefox entry
  ([web-features](https://github.com/web-platform-dx/web-features), keys
  `webgl2` and `webgpu`). The repo's own targets in
  `app/_tools/browser-targets.js` (Chrome 125, Firefox 126, Safari 17.5) all
  predate WebGPU support in that data.
- `WebGPURenderer` "tries to use a WebGPU backend if the browser supports
  WebGPU. If not, `WebGPURenderer` falls backs to a WebGL 2 backend"
  ([WebGPURenderer docs](https://threejs.org/docs/pages/WebGPURenderer.html);
  the fallback import is in
  [`src/renderers/webgpu/WebGPURenderer.js`](https://github.com/mrdoob/three.js/blob/r187/src/renderers/webgpu/WebGPURenderer.js)).
  So it would work everywhere, but every visitor pays the extra 70 kB and many
  would run the fallback path anyway.
- A few thousand particles and a handful of low-poly meshes need nothing
  WebGPU offers.

## Lazy loading with content-hashed chunks

Rolldown does this, but not in the format the build uses today.

- With `format: "iife"` (current `buildJs()`), a dynamic `import()` is
  **inlined**: the entry came out as one 544,341-byte file with no separate
  chunk. That would put three.js in the main script.
- With `format: "es"` plus `entryFileNames` / `chunkFileNames` set to
  `"[name]-[hash].js"`, the same source produced an 84-byte entry
  (`(window.requestIdleCallback??setTimeout)(()=>import("./t-webgl-scene-DkdDriT6.js"))`)
  and a 540 kB hashed scene chunk. Code splitting is on by default
  ([rolldown `codeSplitting`](https://rolldown.rs/reference/OutputOptions.codeSplitting)).

Consequences for `build-assets.mjs` when this is implemented:

- `buildJs()` reads only `output[0].code` and hashes it itself. A split build
  returns several chunks, and the entry embeds the chunk's file name, so every
  chunk must be written under the name rolldown gave it.
- An ES entry needs `<script type="module">`. The alternative that leaves the
  main script untouched: build the scene as a second standalone entry with its
  own hashed name, add its URL to `assets-manifest.json`, hand it to the page
  (for example a `data-` attribute), and call `import(url)` from the existing
  IIFE. Dynamic `import()` is legal in classic scripts.
- Give the scene module at least one `export`. `package.json` has no `"type"`
  field, and a `.js` file with no exports was treated as CommonJS by rolldown:
  the lazy entry grew from 84 to about 900 bytes of interop helpers. An
  `export {}` or a real `export function start()` removes it.
- Chunks written to `app/assets/build/` are already covered by the
  `Cache-Control: public, max-age=31536000, immutable` rule in `vercel.json`.
- `requestIdleCallback` is not Baseline (no Safari in `web-features` 3.45.0),
  and `navigator.connection` is not either (only Chrome Android is listed),
  so both need the
  fallbacks shown above (`?? setTimeout`, optional chaining).

## Content-Security-Policy

The current policy permits the recommended setup unchanged.

Checked by serving the lazy ES build from a local server with the exact
`Content-Security-Policy` value from `vercel.json` (minus
`upgrade-insecure-requests`, which is meaningless on plain-HTTP loopback) and
loading it in headless Chrome 157 with a `securitypolicyviolation` listener:

| Page | Canvas created | Backend | CSP violations | JS errors |
| --- | --- | --- | --- | --- |
| `WebGLRenderer` lazy chunk | yes | WebGL 2 | 0 | 0 |
| `WebGPURenderer` lazy chunk | yes | WebGPU | 0 | 0 |

Why it passes, directive by directive:

- `script-src 'self'`: the lazy chunk is a same-origin script. A scan of the
  minified WebGL and WebGPU bundles found no `eval(`, `new Function(`,
  `new Worker(`, `createObjectURL`, `importScripts`, `WebAssembly` or `fetch(`,
  so `'unsafe-eval'`, `'wasm-unsafe-eval'`, `worker-src` and `blob:` are not
  needed. Shaders are compiled by the GPU driver through WebGL calls, which CSP
  does not govern.
- `style-src`: three.js sets `canvas.style.display`, `.width` and `.height` as
  individual properties
  ([`src/utils.js`](https://github.com/mrdoob/three.js/blob/r187/src/utils.js),
  [`WebGLRenderer.js`](https://github.com/mrdoob/three.js/blob/r187/src/renderers/WebGLRenderer.js)).
  Per MDN, properties "set directly on the element's `style` property will not
  be blocked"
  ([style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src)),
  so this would survive even a future removal of `'unsafe-inline'`.
- `img-src 'self' data:` and `connect-src 'self'`: a `CanvasTexture` makes no
  request. `TextureLoader` uses an `<img>` (governed by `img-src`) and
  `FileLoader` / `ImageBitmapLoader` use `fetch` (governed by `connect-src`);
  same-origin files pass both.

What would require a CSP change, so the scene spec can avoid it or plan for it:

| Feature | Why | Change needed |
| --- | --- | --- |
| `DRACOLoader`, `KTX2Loader` | Build a worker from a `blob:` URL and run WebAssembly ([DRACOLoader.js](https://github.com/mrdoob/three.js/blob/r187/examples/jsm/loaders/DRACOLoader.js), [KTX2Loader.js](https://github.com/mrdoob/three.js/blob/r187/examples/jsm/loaders/KTX2Loader.js)) | `worker-src blob:` and `'wasm-unsafe-eval'` in `script-src` |
| `GLTFLoader` with textures embedded in a `.glb` | Embedded images are loaded through `URL.createObjectURL` ([GLTFLoader.js](https://github.com/mrdoob/three.js/blob/r187/examples/jsm/loaders/GLTFLoader.js)) | `blob:` in `img-src`, and possibly `connect-src` |
| Assets from another origin | Not `'self'` | That host in `img-src` / `connect-src` |

Without a `worker-src` directive, workers fall back to `child-src`, then
`script-src`, then `default-src`
([worker-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src)),
and `'self'` does not cover `blob:`. A geometry-only `.glb` with no embedded
textures and no Draco or KTX2 compression avoids all three rows.

## Not verified

- **Runtime cost.** Parse, compile and frame time for a 540 kB script on a
  phone was not measured. Only transfer size was.
- **Other browsers.** The CSP run was Chrome only. Firefox and Safari were not
  run; the conclusion for them rests on the bundle scan and the MDN text.
- **WebGPU frames.** In the headless run the WebGPU backend initialised and
  created its canvas with no errors, but the frame counter read 0 inside
  Chrome's virtual-time window, so rendering on that backend was not confirmed.
  The WebGL run rendered.
- **Vercel's compression level.** The docs confirm brotli is used but not at
  what quality; the 109 to 124 kB range brackets it.
- **`import()` under `script-src`.** Confirmed by the Chrome run, not by a
  quoted spec sentence: the MDN `script-src` page does not mention dynamic
  import, and the relevant CSP3 section was not retrieved.
- **IIFE inlining.** Observed in rolldown 1.3.0; the rolldown docs for
  `format` and `codeSplitting` do not state it.
- **The `blob:` rows for `GLTFLoader`.** Taken from reading the loader source,
  not from a run with a real `.glb`.
- **Firefox and WebGPU.** `web-features` 3.45.0 has no Firefox version for
  WebGPU; Firefox's per-platform rollout was not looked up separately.
- **Node version.** Bundles were built on Node 24, not the repo's Node 26.
- `GLOSSARY.md`, which #11 says to read, does not exist in the repository at
  commit `3fb2162`.
