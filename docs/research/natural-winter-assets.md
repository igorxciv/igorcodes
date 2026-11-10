# Free assets and techniques for a natural-looking snowman, trees and snowfall

Research for [issue #19](https://github.com/igorxciv/igorcodes/issues/19), part
of the map in [issue #11](https://github.com/igorxciv/igorcodes/issues/11).
Researched and measured 2026-11-09. Nothing in the site was changed and no
dependency or asset was added; downloads, conversions, bundles and a look test
ran in a scratch directory outside the repo. Byte figures build on the bundle
research for [#12](https://github.com/igorxciv/igorcodes/issues/12)
([findings](https://github.com/igorxciv/igorcodes/blob/research/threejs-bundle-cost/docs/threejs-bundle-cost.md)).

## Answer

Go stylised-but-polished, not photoreal. Most of what looked wrong in the
first prototype is lighting, and the lighting fixes cost no bytes: the
renderer chunk already contains shadow maps, PMREM, fog and tone mapping.

Recommended set for the next prototype round:

| Part | Choice | Licence | Shipped |
| --- | --- | --- | ---: |
| Conifers | Quaternius "Pine" ([poly.pizza/m/79gmlLnweB](https://poly.pizza/m/79gmlLnweB)), one mesh reused at several scales and rotations, snow added in the shader | CC0 1.0 | 50.6 kB geometry-only `.glb` (2,021 triangles) |
| Foliage mask and bark | The two base-colour textures from that model, resized to 256 px WebP, as separate same-origin files | CC0 1.0 | 5.6 kB + 2.8 kB |
| Snowman | Procedural: three noise-displaced, welded icospheres with smooth normals, plus procedural hat, scarf, nose, coal and twig arms | none needed | 0 kB |
| Ground | Procedural displaced plane | none needed | 0 kB |
| Falling snow | Instanced quads with a procedural irregular-flake shader, no texture | none needed | about 1 kB of shader |
| Environment light | Gradient sky sphere filtered with `PMREMGenerator.fromScene`, no HDRI file | none needed | 0 kB |

Budget: **about 59 kB of assets** on top of **about 131 kB brotli of script**
(109 kB three.js scene chunk from #12, 17.6 kB `GLTFLoader`, a few kB of scene
code). Cap the ambient layer at **250 kB transferred** in total, with at most
100 kB of that for models and textures.

CSP: **no change to `vercel.json`**, as long as the `.glb` holds geometry only,
textures are separate same-origin files, and no Draco, KTX2 or meshopt
decoder is used. A scratch page with exactly this setup, served with the
site's CSP header, produced 0 violations in headless Chrome 157.

No free model made the snowman better than procedural geometry can: the CC0
snowmen found are toy-like or oddly rigged, and a snowman is three lumpy
snowballs, which a noise-displaced sphere reproduces directly.

## Versions and method

| Tool | Version |
| --- | --- |
| three | 0.187.0 (r187) |
| rolldown | 1.3.0 (the version pinned in this repo) |
| `@gltf-transform/cli` | 4.5.1 (with its `meshoptimizer` and `sharp`) |
| Node | 24.18.0 on the scratch machine |
| Chrome | 157.0.8103.50 headless |

Gzip is level 9 and brotli is quality 11 from `node:zlib`, as in #12. Each
download went into its own empty directory and was only parsed
(glTF-Transform, sharp, `GLTFLoader`), never executed.

## Photoreal or stylised

Stylised, for four reasons.

1. **The free photoreal trees cannot ship.** Poly Haven's conifers are scans
   for offline rendering. Its API reports `fir_tree_01` at 7,853,731
   polygons, `pine_tree_01` at 17,427,094, and the smallest, `fir_sapling`, at
   433,021 with a 25.4 MB glTF at the lowest (1k) texture size
   ([api.polyhaven.com/info/fir_sapling](https://api.polyhaven.com/info/fir_sapling),
   [files](https://api.polyhaven.com/files/fir_sapling)). Reaching the budget
   here means decimating by 100x or more and rebuilding the foliage as alpha
   cards, which is authoring work, not a download. None of them carries snow.
2. **No free photoreal snowman was found.** Poly Haven has none (521 models
   checked through the API). Sketchfab's search API returned no CC0 results
   at all for "snowman", "snowy pine tree", "pine tree snow" or "christmas
   tree" under 20,000 faces; the CC-BY results are stylised.
3. **Photoreal sets a bar the rest of the page cannot meet.** A scanned tree
   behind flat UI text, next to CSS snow caps on cards (#13), reads as a
   photo pasted behind the page. It also has to survive two themes, and a
   photoreal night scene on a cream background is not a coherent picture.
4. **The look test below shows where the realism comes from.** The same
   models went from "primitives" to "a scene" when shadows, a sky fill light,
   fog and uneven ground were switched on. Shape quality mattered second.

"Natural" is reachable inside stylised: organic silhouettes (branch cards
rather than stacked cones), smooth lumpy snow, soft blue shadows, depth haze.

## Look test

One scratch page rendered both candidate directions side by side, in both
themes, with and without the lighting techniques (1400x700, headless Chrome,
site CSP header applied):

- Left: Kenney Holiday Kit trees, decorated tree and snowman, baked to vertex
  colours.
- Right: three instances of the Quaternius Pine with shader snow, and a
  procedural snowman.

Observations:

- With lighting off (one hemisphere and one directional light, no shadows),
  both halves look like the first prototype: objects float, snow is a flat
  grey-blue.
- With lighting on, the right half reads as a natural stylised scene: layered
  branch silhouettes, snow sitting on the upper side of each branch, long soft
  shadows across uneven ground. The Kenney half still reads as toys, because
  the shapes are chunky and faceted by design.
- Dark theme works with little tuning: a cool key light as moonlight gives
  blue-white snow against the near-black page.
- Light theme needs its own tuning. White snow on a cream page has almost no
  contrast, and the snow-covered pines nearly disappear. Use less shader snow
  on the trees, a visible blue shadow tint, fog that fades to the page colour,
  and grey-blue flakes instead of white. This matches the #13 finding that
  white snow needs a shaded edge in the light theme.

Limits of the test: one camera angle, still frames only, desktop GPU, my own
quick art direction, and a harness bug that sank the Kenney snowman into the
ground and dropped one Kenney tree. It compares directions; it is not a
design.

## Models

### Candidates measured

Triangle counts and sizes are from the downloaded files (`gltf-transform`
API), not from the listing pages.

| Asset | Source | Licence | Download | Triangles | Textures | Verdict |
| --- | --- | --- | ---: | ---: | --- | --- |
| Pine (Quaternius) | [poly.pizza/m/79gmlLnweB](https://poly.pizza/m/79gmlLnweB) | CC0 1.0 | 2,221,932 B `.glb` | 3,370 | 3 embedded PNG, 1024 px: bark colour, bark normal, foliage colour with alpha | **Recommended** |
| Pine Trees, 5 variants (Quaternius) | [poly.pizza/m/w8ZaiYjK8C](https://poly.pizza/m/w8ZaiYjK8C) | CC0 1.0 | 2,675,812 B | 10,366 | 3 embedded PNG, 1024 px | Sparse needles, 108 kB brotli of geometry; too heavy for five variants |
| Pine Tree with Snow (Quaternius) | [poly.pizza/m/17vQv2X5rh](https://poly.pizza/m/17vQv2X5rh) | CC0 1.0 | 95,448 B | 1,695 | none (3 flat materials) | Faceted low-poly, bent trunk; same look problem as the prototype |
| Bush Snow (Quaternius) | [poly.pizza/m/H4IEAwYl1z](https://poly.pizza/m/H4IEAwYl1z) | CC0 1.0 | 21,036 B | 338 | none | Optional filler, 12.3 kB quantized |
| Holiday Kit 2.0 (Kenney), 100 models | [kenney.nl/assets/holiday-kit](https://kenney.nl/assets/holiday-kit) | CC0 1.0 | 4,482,244 B zip | snowman 446, snowman-hat 555, tree-snow-a 378, tree-snow-b 374, tree-snow-c 234, tree-decorated-snow 810, lights-colored 760 | one shared 512x512 palette PNG, 12,777 B, referenced externally | Coherent and tiny, but toy-like. Fallback, and a source of Christmas props |
| Snowman (Polygonal Mind) | [poly.pizza/m/UBldLFdI7l](https://poly.pizza/m/UBldLFdI7l) | CC0 1.0 | 959,048 B | 4,940 | 1 embedded PNG, 512 px | T-pose with long legs; not usable |
| Fir Sapling (Poly Haven) | [polyhaven.com/a/fir_sapling](https://polyhaven.com/a/fir_sapling) | CC0 | 25.4 MB glTF at 1k | 433,021 | 7 files | Not shippable without re-authoring |

Licence sources: the Kenney zip's own `License.txt` ("License: (Creative
Commons Zero, CC0)"); Poly Pizza's per-model `Licence: CC0 1.0` field, with
Quaternius as creator, and Quaternius's own pack pages, which state CC0
([Stylized Nature MegaKit](https://quaternius.com/packs/stylizednaturemegakit.html));
Poly Haven: "Our assets are all licensed as CC0"
([polyhaven.com/license](https://polyhaven.com/license)); ambientCG: "All
ambientCG assets are provided under the Creative Commons CC0 1.0 Universal
License" ([docs.ambientcg.com/license](https://docs.ambientcg.com/license/)).
CC0 needs no attribution; a credits line for Quaternius is a courtesy.

Not measured, listed for completeness: Sketchfab CC-BY results such as
"Snowman" by alixor22 (8,892 faces, 2.46 MB `.glb`, 3 textures at 1024 px,
[model](https://sketchfab.com/3d-models/7d683ce4a9c54f158cc73d65a16a9a29)) and
"Pine Tree" by andreorla (10,476 faces, 1.5 MB, 2 textures at 1024 px,
[model](https://sketchfab.com/3d-models/69fed9e43a324d529da20391cfcd42ae)).
Those figures come from the Sketchfab search API. Downloading needs an
account, so none was inspected, and CC-BY would need a visible credit.

### Processing the recommended pine

The Pine is alpha-card foliage: a trunk with twigs plus layered branch cards
that use one flat-green silhouette texture as a mask. That gives an organic
outline for 3,370 triangles.

Steps, all with glTF-Transform
([functions](https://gltf-transform.dev/functions)):

1. Extract the three textures. Drop the bark normal map (invisible at hero
   size). Resize the other two to 256 px WebP.
2. Remove all textures and tangents from the `.glb`, drop `COLOR_0`, weld.
3. `simplify` to ratio 0.6, then `quantize` (14-bit positions, 8-bit normals,
   12-bit UVs), which writes `KHR_mesh_quantization`. `GLTFLoader` reads that
   extension with no decoder.
4. In the scene, load the two WebP files with `TextureLoader` and assign them:
   foliage with `alphaTest: 0.5` and `side: DoubleSide`.

Measured results for the geometry-only `.glb`:

| Variant | Triangles | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: | ---: |
| Quantized, with `COLOR_0` | 3,370 | 87,872 | 47,490 | 36,682 |
| Quantized, no `COLOR_0` | 3,370 | 75,812 | 46,525 | 36,408 |
| Simplified to 0.6, quantized | 2,021 | 50,584 | 30,796 | 24,524 |
| `EXT_meshopt_compression` | 3,370 | 55,500 | 44,353 | 41,534 |

Textures after resizing (WebP quality 80):

| Texture | Original | 512 px | 256 px |
| --- | ---: | ---: | ---: |
| Foliage colour with alpha | 33,660 B PNG, 1024 px | 11,736 B | 5,590 B |
| Bark colour | 959,943 B PNG, 1024 px | 8,374 B | 2,846 B |
| Bark normal (dropped) | 1,061,891 B PNG, 1024 px | 11,298 B | 4,052 B |

The look test used the unsimplified quantized geometry and the 256 px
textures. The simplified variant was measured but not rendered.

Notes:

- **Count the raw size, not the brotli size.** Vercel compresses only an
  allowlist of MIME types, and `model/gltf-binary` is not on the published
  list, which Vercel calls "not exhaustive"
  ([Vercel CDN compression](https://vercel.com/docs/how-vercel-cdn-works/compression)).
  Assume a `.glb` travels uncompressed until a deployment proves otherwise.
- **meshopt compression is not worth it here.** It saves 20 kB raw on this
  mesh, the decoder adds 6.1 kB brotli of script, and the decoder is
  WebAssembly (`WebAssembly.instantiate` in
  [`meshopt_decoder.module.js`](https://github.com/mrdoob/three.js/blob/r187/examples/jsm/libs/meshopt_decoder.module.js)),
  which the current `script-src` blocks without `'wasm-unsafe-eval'`.
- **A later saving.** Converting the geometry to a JS module at build time
  (base64 in an `export default`, parsed with `GLTFLoader.parse`) puts it
  under Vercel's JavaScript compression: 32.1 kB brotli for the simplified
  pine instead of 50.6 kB raw. Dropping `GLTFLoader` for a hand-written
  typed-array reader would save a further 17.5 kB (a raw-buffer reader
  measured +84 B). Both are production optimisations; the prototype round
  should use plain `GLTFLoader` and a `.glb`.

### The Kenney fallback

If the toy look turns out to be acceptable, the whole Kenney set is cheaper
than one pine. Seven models (both snowmen, three snowy trees, the decorated
snowy tree, a snow pile; 2,929 triangles) merged into one file:

| Variant | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Merged, palette texture embedded (needs `blob:` in `img-src`) | 305,064 | 69,097 | 42,993 |
| Palette baked to vertex colours, float32 | 179,328 | 33,041 | 20,193 |
| Vertex colours + `KHR_mesh_quantization` | 63,276 | 25,418 | 17,318 |
| Vertex colours + `EXT_meshopt_compression` | 44,956 | 24,988 | 22,900 |

Baking samples the palette at each vertex. The palette swatches are vertical
gradients, so vertex interpolation approximates them rather than copying them
exactly (563 of 2,929 triangles sample a single flat colour). The quantized,
vertex-colour file loaded and rendered in the look test.

The kit is still useful for the Christmas occasion window (1 Dec to 7 Jan):
`tree-decorated-snow`, `lights-colored`, `present-*` and `wreath` are small
CC0 props in one style.

## Textures and materials

Photo-scanned PBR sets are the wrong scale for this scene. Poly Haven's
`snow_02` at 1k is 1.08 MB for the normal map alone and 3.9 MB as a glTF set
([files](https://api.polyhaven.com/files/snow_02)); ambientCG's snow
materials are 6.4 to 9.8 MB per 1K-JPG zip
([API](https://ambientcg.com/api/v2/full_json?q=snow&type=Material&include=downloadData)).
At hero size, behind text, almost none of that detail is visible.

What is needed:

| Surface | Maps needed | Resolution | Cost |
| --- | --- | --- | ---: |
| Snow (ground, snowman, tree snow) | none: colour, roughness and sheen are material constants | n/a | 0 |
| Snow, optional grain and glints | one tiling normal map, e.g. Poly Haven [`snow_02`](https://polyhaven.com/a/snow_02) `nor_gl` (CC0) | 256 px | 4,770 B (WebP q60) to 10,242 B (q80); 512 px is 29,682 to 56,356 B |
| Needles | the model's own foliage texture, used as an alpha mask | 256 px | 5,590 B |
| Bark | the model's own base colour | 256 px | 2,846 B |
| Scarf and hat fabric | none: a saturated colour with `MeshPhysicalMaterial` sheen | n/a | 0 |

No roughness, AO, displacement or metalness maps. The optional snow normal map
is the first thing to add if the snow looks like plastic in the prototype, and
the first to cut on phones. No specific fabric texture was verified; if the
scarf needs weave, ambientCG's Fabric category is the place to look.

No HDRI file. Poly Haven has suitable ones (`snowy_forest`, `winter_evening`
and about 40 more tagged snow or winter), but `HDRLoader` costs 3.2 kB brotli
plus a file of hundreds of kB, and a canvas with a transparent background
never shows the sky. A two-colour gradient sphere passed through
`PMREMGenerator.fromScene`
([docs](https://threejs.org/docs/pages/PMREMGenerator.html)) gives the same
soft image-based fill for no bytes, and the two colours can follow the theme.

## Techniques, ordered by payoff per kB

Costs are brotli deltas against a baseline scene in the same ES-module build
as #12 (baseline 107,679 B; differences under 100 B are compression noise).

| # | Technique | Cost | Source |
| --- | --- | ---: | --- |
| 1 | Soft shadows from one directional light | 0 | [`LightShadow`](https://threejs.org/docs/pages/LightShadow.html), [webgl_shadowmap_vsm](https://threejs.org/examples/#webgl_shadowmap_vsm) |
| 2 | Light rig per theme, tone mapping | 0 | [`HemisphereLight`](https://threejs.org/docs/pages/HemisphereLight.html), [`WebGLRenderer.toneMapping`](https://threejs.org/docs/pages/WebGLRenderer.html) |
| 3 | Gradient environment through PMREM | 0 | [`PMREMGenerator`](https://threejs.org/docs/pages/PMREMGenerator.html), [webgl_pmrem_test](https://threejs.org/examples/#webgl_pmrem_test) |
| 4 | Fog to the page background colour | +0.1 kB | [`FogExp2`](https://threejs.org/docs/pages/FogExp2.html) |
| 5 | Uneven ground and lumpy snowballs (vertex displacement in JS) | 0 | [webgl_geometry_terrain](https://threejs.org/examples/#webgl_geometry_terrain), `mergeVertices` in [`BufferGeometryUtils`](https://threejs.org/docs/pages/module-BufferGeometryUtils.html) |
| 6 | Authored pine, instanced | +17.6 kB loader, +59 kB assets | [`GLTFLoader`](https://threejs.org/docs/pages/GLTFLoader.html), [webgl_instancing_scatter](https://threejs.org/examples/#webgl_instancing_scatter) |
| 7 | Snow on the trees in the shader | 0 | [`Material.onBeforeCompile`](https://threejs.org/docs/pages/Material.html) |
| 8 | Snow sheen | +0.6 kB | [`MeshPhysicalMaterial`](https://threejs.org/docs/pages/MeshPhysicalMaterial.html), [webgl_loader_gltf_sheen](https://threejs.org/examples/#webgl_loader_gltf_sheen) |
| 9 | Sparkle glints, optional detail normal map | 0, or 4.8 to 10.2 kB | `onBeforeCompile` |
| 10 | Contact shadow or blob under the snowman | 0 to +0.25 kB | [webgl_shadow_contact](https://threejs.org/examples/#webgl_shadow_contact) |

Details:

1. **Shadows.** This is the largest single change. Enable
   `renderer.shadowMap`, set `castShadow` on the key light, and give the
   ground `receiveShadow`. Use a 1024 px map on desktop and 512 px on phones,
   with `shadow.radius` around 4 to 6. In r187 the choice is `PCFShadowMap` or
   `VSMShadowMap`: `PCFSoftShadowMap` is marked "deprecated since r186. Use
   `PCFShadowMap` instead" in
   [`constants.js`](https://github.com/mrdoob/three.js/blob/r187/src/constants.js)
   and the renderer logs a warning and substitutes PCF. The look test used VSM
   with `radius` 5 and `blurSamples` 16. The models do not move, so set
   `renderer.shadowMap.autoUpdate = false` and `needsUpdate = true` once;
   the shadow pass then costs nothing per frame. Tune `bias` and `normalBias`
   against acne on the low-angle light.
2. **Light rig.** Snow looks real when lit surfaces are warm or neutral and
   shadows are blue, because shadowed snow is lit only by the sky. Use a low
   key light for long shadows and a `HemisphereLight` with a blue sky colour.
   Dark theme: cool, dim key as moonlight. Light theme: warm key as low sun.
   Add `ACESFilmicToneMapping` so bright snow rolls off instead of clipping.
3. **Environment.** `scene.environment` from a gradient sphere fills the
   shadow side of every object with soft directional colour, which removes
   the flat look that a lone hemisphere light leaves.
4. **Fog.** `FogExp2` in the exact page background colour makes far trees fade
   into the page instead of ending at a hard horizon. It is also what lets
   the canvas sit behind text without competing with it.
5. **Shapes.** Displace the ground plane with a few octaves of noise.
   Build each snowball from `IcosahedronGeometry` at detail 5, delete `uv`
   and `normal`, `mergeVertices`, displace along the radius, squash slightly,
   then `computeVertexNormals`. Icospheres are non-indexed, so without the
   merge the normals come out faceted. Sink every object a few centimetres
   into the ground so nothing sits on a visible edge.
6. **Pine.** Load once, clone or instance three to five times with varied
   scale, rotation and lean. `alphaTest` foliage casts correct cut-out
   shadows with no extra material.
7. **Shader snow.** In `onBeforeCompile`, pass the world-space normal's Y to
   the fragment shader and mix the base colour towards snow white where it
   faces up. The same pine can then be bare, dusted or loaded, and the amount
   can differ by theme. Worked in the look test on both foliage and bark.
8. **Sheen.** `MeshPhysicalMaterial` with `sheen: 1`, a pale blue
   `sheenColor` and high roughness gives snow a soft rim at grazing angles,
   which stands in for subsurface scattering. Real transmission or
   subsurface is not worth it: `transmission` adds a second scene render.
9. **Sparkle.** A hash of world position, thresholded and gated by view
   angle, added to emissive in `onBeforeCompile`. Not tested here. Keep it
   sparse and static, or it reads as noise behind text.
10. **Grounding.** The shadow map already anchors the objects. If the phone
    tier drops shadow maps, a radial-gradient `CanvasTexture` blob under each
    object is the zero-byte replacement.

Skip for this scene:

| Technique | Why |
| --- | --- |
| `GTAOPass` ambient occlusion | +7.5 kB brotli, full-screen passes every frame through `EffectComposer`, and a transparent canvas complicates the composite. Sinking objects into the ground and the shadow map cover the same need |
| `BokehPass` depth of field | +2.6 kB and full-screen passes; per-flake blur in the snow shader does the visible part for free |
| PCSS shadows | The official example ([webgl_shadowmap_pcss](https://threejs.org/examples/#webgl_shadowmap_pcss)) patches internal shader chunks, which is fragile across releases; VSM with a radius is close enough |
| HDRI environment | See above |
| Draco, KTX2, meshopt | CSP changes, see below |
| Baked AO maps | Needs a UV-unwrapped bake per model and another texture; not visible at this size |

## Falling snow

### What makes it read as real

At hero scale nobody sees six-armed crystals. Falling snow in a photo or
through a window is irregular pale clumps: aggregates of crystals, a few
millimetres across, falling at roughly 0.5 to 2 m/s. Drawn star shapes read
as clip art, and uniform soft discs read as bokeh or dust. In rough order of
importance:

1. **Depth range.** Most flakes are far, tiny and dim; a few are close, large
   and blurred. Uniform size is the main thing that makes discs look fake.
   Real perspective in a 3D volume gives size, speed and parallax together,
   so separate "layers" are unnecessary.
2. **Defocus on near flakes.** A near flake should be a large, faint, soft
   blob, not a large sharp one. Grow the quad by a circle of confusion based
   on distance from a focus plane and reduce alpha by the area ratio, so a
   blurred flake is no brighter overall than a sharp one.
3. **Irregular outline.** A slightly lumpy, asymmetric blob, different per
   flake. Low-frequency lobes only; sharp lobes look like confetti (the first
   shader attempt here did).
4. **Motion that is not a sine.** Each flake needs its own fall speed and a
   drift built from two or three sines with unrelated frequencies, plus one
   slow shared gust that leans the whole field. A single sine sway makes
   flakes swing in step like pendulums.
5. **Tumbling.** Rotate each flake at its own rate and vary its apparent
   width over time, as a flat clump turning edge-on would.
6. **Streak.** Stretch each quad slightly along its direction of travel in
   proportion to its screen speed. It should be subtle: snow is slow, and
   long streaks read as rain.
7. **Density and brightness.** Fewer flakes than feels natural while
   building it; the canvas sits behind text. Start near 600 to 900 on
   desktop and 250 to 400 on phones, with most of them small.
8. **Theme colour.** White flakes with normal alpha blending on the dark
   theme; grey-blue flakes on the cream theme, where white is invisible.
   Additive blending does nothing on a light background.

### Shapes: sprites or procedural

| Option | Licence | Bytes | Notes |
| --- | --- | ---: | --- |
| Procedural outline in the fragment shader | none | about 1 kB of GLSL | Infinite variation from a per-flake seed, blur is one `smoothstep` width. **Recommended** |
| Atlas drawn at runtime to a `CanvasTexture` | none | 0 transferred, a little JS | Four to eight hand-drawn blobs; CSP-safe (no request). Fallback if the shader shapes look too regular |
| three.js example sprites `snowflake1.png` to `snowflake5.png` | repository is MIT; the images' own origin is not stated | 466 to 738 B each | Used by [webgl_points_sprites](https://threejs.org/examples/#webgl_points_sprites) ([files](https://github.com/mrdoob/three.js/tree/r187/examples/textures/sprites)). Crystal shapes, which is the wrong look at this scale |
| Kenney Particle Pack | CC0 | 80 files at 512 px | [kenney.nl/assets/particle-pack](https://kenney.nl/assets/particle-pack). Contents not inspected |

### Recommended approach

One `Mesh` with `InstancedBufferGeometry` (a unit `PlaneGeometry` plus one
`vec4` seed per instance) and a `ShaderMaterial`, on `WebGLRenderer`, one
draw call, animated entirely in the vertex shader from a time uniform.

- Vertex shader: position from seed inside a box, wrapped with `mod` so
  flakes recycle; per-flake fall speed; drift from incommensurate sines plus
  a shared gust; billboard by adding the quad corner in view space; size from
  a base radius plus circle of confusion; alpha scaled by base area over
  blurred area; rotation and a width wobble for tumbling; a small stretch
  along the fall direction.
- Fragment shader: radius compared with an edge that varies with angle
  (three low-frequency sines keyed to the seed), through a `smoothstep` whose
  width grows with blur. Colour is a theme uniform.
- `transparent: true`, `depthWrite: false`, `frustumCulled = false`.

Cost: +0.2 kB brotli for instancing over the prototype's `Points` setup, plus
the shader text. No texture, no request, no CSP effect. A 900-flake version
of this shader compiled and rendered in the look test under the site's CSP.

Why quads instead of `Points`: a point sprite cannot be stretched or given a
non-square footprint, its size is clamped to a driver-dependent maximum, and
a point is dropped as soon as its centre leaves the view, so large blurred
near flakes would pop at the screen edges. The clamp and the clipping rule
are from memory of the OpenGL ES specification and were not re-read.

Sources for the building blocks:
[webgl_buffergeometry_instancing_billboards](https://threejs.org/examples/#webgl_buffergeometry_instancing_billboards)
(instanced camera-facing quads with a custom shader),
[webgl_custom_attributes_points](https://threejs.org/examples/#webgl_custom_attributes_points)
(per-particle attributes),
[webgl_points_sprites](https://threejs.org/examples/#webgl_points_sprites)
(the classic layered sprite snowfall, for comparison),
[`InstancedBufferGeometry`](https://threejs.org/docs/pages/InstancedBufferGeometry.html),
[`ShaderMaterial`](https://threejs.org/docs/pages/ShaderMaterial.html). Full
depth of field exists as
[webgl_postprocessing_dof2](https://threejs.org/examples/#webgl_postprocessing_dof2)
but costs full-screen passes; the per-flake version above is the cheap
equivalent. There is no official three.js example that combines these into
realistic snowfall on `WebGLRenderer`, so the shader is new work for the
prototype.

## Budget

| Item | Transfer |
| --- | ---: |
| three.js scene chunk (from #12) | 109 kB brotli |
| `GLTFLoader` | 17.6 kB brotli |
| Scene code, shaders, lighting techniques (estimate) | 4 kB brotli |
| Pine geometry, simplified, quantized `.glb` | 50.6 kB (assumed uncompressed) |
| Foliage mask and bark, 256 px WebP | 8.4 kB |
| **Total** | **about 190 kB** |
| Optional snow detail normal map, 256 px | 4.8 to 10.2 kB |
| Optional Kenney Christmas props for the occasion window | 10 to 25 kB |

Recommended ceilings for the spec: 100 kB for models and textures, 250 kB for
the whole ambient layer. Phones load the same files and save on GPU work
instead: 512 px shadow map or blob shadows, fewer flakes, a device-pixel-ratio
cap, three trees instead of five.

## CSP consequences

None for the recommended set. The scratch page (quantized geometry-only
`.glb` files through `GLTFLoader`, two WebP textures through `TextureLoader`,
VSM shadows, PMREM environment, instanced flakes) was served from loopback
with the exact `Content-Security-Policy` value from `vercel.json`, minus
`upgrade-insecure-requests`, and reported 0 `securitypolicyviolation` events
in headless Chrome 157 in both themes.

What keeps it that way:

- **No images inside the `.glb`.** `GLTFLoader` turns an embedded image into
  a `blob:` URL (`URL.createObjectURL` in
  [`GLTFLoader.js`](https://github.com/mrdoob/three.js/blob/r187/examples/jsm/loaders/GLTFLoader.js)),
  which `img-src 'self' data:` blocks. Every candidate download above embeds
  its textures, so stripping them is a required step, not an optimisation.
- **No `EXT_meshopt_compression`, Draco or KTX2.** All three decoders are
  WebAssembly, and Draco and KTX2 also start `blob:` workers (#12).
  `KHR_mesh_quantization` needs no decoder.
- **Same-origin files only.** Copy the assets into the site; do not hotlink
  Poly Pizza, Poly Haven or Kenney.

## Not verified

- **Phones.** Nothing was run on a phone. Frame cost of VSM shadows,
  alpha-tested foliage overdraw and 250 to 900 flakes on mobile GPUs is
  unknown; the flake counts and shadow sizes above are starting points.
- **Motion.** The snow shader was judged from still frames. Turbulence, gust
  and tumble quality need a moving prototype.
- **Simplified pine.** The 2,021-triangle variant was measured but not
  rendered; simplification can tear alpha cards. Fall back to the
  3,370-triangle file (75.8 kB) if it does.
- **Vercel and `.glb`.** That `.glb` responses go uncompressed is inferred
  from the published allowlist, which is "not exhaustive". Not tested on a
  deployment.
- **Poly Pizza as source.** The Quaternius files came from Poly Pizza, which
  lists them as CC0 with Quaternius as creator. Which Quaternius pack the
  Pine belongs to was not confirmed, and it was not downloaded from
  quaternius.com (its downloads go through external hosts).
- **Sketchfab models.** Listed from API metadata only; not downloaded.
- **Kenney Particle Pack contents** and the origin of three.js's snowflake
  sprite images.
- **Snowfall physics.** The 0.5 to 2 m/s fall speed is from search-result
  summaries of NCAR and NOAA-hosted papers (for example Schmitt et al. 2019,
  "The fall speed variability of similarly sized ice particle aggregates"),
  not from the full texts; the catalogue link returned 404 when rechecked.
- **Point-sprite limits** (size clamp, centre clipping): from memory, the
  specification text was not retrieved.
- **Sparkle shader, contact shadows, detail normal map.** Bundle cost was
  measured; the look was not tested.
- **Other browsers.** The CSP run was Chrome only.
- **Node version.** Scratch work ran on Node 24, not the repo's Node 26.
- **Hat and scarf.** Described as procedural; not built in the look test.
