# A realistic procedural scarecrow in three.js r187 on a ~6 kB brotli budget

Scope: the autumn hero's scene character (about 2.3 world units tall, about
15 units from a 30° FOV camera). Everything here is procedural geometry plus
GLSL, built on `MeshStandardMaterial`/`MeshPhysicalMaterial` with
`onBeforeCompile` (the repo's `extendShader`) and instancing. There are no
model files and no image textures.

Sources are listed at the end and cited inline as [S#]. Claims marked
**(measured)** come from my own runs against the repo's rolldown, three
0.187.0 and node zlib brotli at quality 11. The repo's `scene-budget.mjs`
uses the same settings.

---

## 0. Summary of the recommended plan

1. **Fix the silhouette first. It costs almost no bytes, only numbers.**
   Shrink the head to about 1/6 of figure height. Make the sleeves droop
   below the bar. Hang limp trouser legs with the post visible beneath
   them. Use a floppy wide-brim hat instead of a top hat. Tilt the head 10–15°
   and give the whole figure some asymmetry. Let straw break the outline at
   the cuffs, ankles, collar and under the brim.
2. **Build every cloth part from one ~25-line "lathe on a cylinder"
   helper.** Remap a `CylinderGeometry` (already in the bundle, so no library
   cost) with a `shape(t, angle)` function. That function returns radius,
   height and offset, plus a `fold` value that the shader uses as cheap
   ambient occlusion. Do pinches (neck tie, cuff ties, waist), gravity sag
   (sleeves over the bar), lengthwise drape folds, compression wrinkles near
   ties and jagged frayed hems on the CPU, at build time.
3. **Use one shared cloth shader on `MeshPhysicalMaterial`** with
   `sheen` (Charlie, from Estevez & Kulla) and `diffuseRoughness` (EON).
   `MeshPhysicalMaterial` is already bundled through `GLTFLoader`, so it
   costs 0 bytes **(measured: −40 B)**. A uniform picks the fabric:
   - **Plaid flannel** is the only weave pattern you can actually resolve at
     this size. Make it from analytically box-filtered stripe pulses averaged
     50/50 between warp and weft, which matches how real tartan blends.
   - **Burlap** threads are always sub-pixel here. Render the average colour
     (yarn mixed with straw showing through the gaps) plus anisotropic
     "slub" streak noise. Draw the real weave only when `fwidth` says it is
     larger than about 2 px.
   - **Denim and felt** are flat colour plus weathering.
   - **Weathering** for all fabrics: sun-fading on up-facing surfaces, grime
     towards hems, stain tide lines, and one sewn-on patch.
4. **Paint the face in the sack's fragment shader.** Use SDF eyes and an SDF
   stitched grin, antialiased with `fwidth`. Make them bolder than life,
   because the eyes are what sell the pointer-following head turn.
5. **Straw: about 300–400 instanced tapered ribbons** (3 triangles each) in
   one shared geometry and material, split across 3–4 `InstancedMesh`es
   parented to the parts that move (body, head, each loose sleeve). Give each
   instance its own colour (pale gold to grey-brown), darken the roots, curl
   the strands towards world-down, and add a cheap backlit translucency term.
   Skip Kajiya-Kay highlights, alpha cards and `GL_LINES`.
6. **Wind:** keep the CPU sleeve rotation driven by `gustAt()`, which
   already matches the leaves. Pass the gust in as a uniform and add only a
   small GLSL flutter on loose edges. Do not re-implement the gust formula
   in GLSL.
7. **Byte cost:** a representative sketch of items 2–5 (materials, tube
   builder, four part shapes, straw builder and all GLSL) is **4.2 kB
   minified and +1.29 kB marginal brotli (measured)**. A complete version
   (legs, hat band, bandana, patch, animation tweaks, theme colours) should
   land around **2.5–3.5 kB brotli**. The old scarecrow is 2.7 kB minified
   and 0.73 kB marginal brotli **(measured)**, so the net growth is about
   +2–3 kB, inside the 6 kB headroom.
8. **Skip:** cloth simulation, `TubeGeometry` + `CatmullRomCurve3`
   (+2.6 kB), `BatchedMesh` (+3.5 kB), `mergeGeometries` (+0.7 kB), weave
   normal or bump perturbation, twill detail, Kajiya-Kay, alpha-tested straw
   cards, and a `customDepthMaterial` for vertex animation (the shadow map is
   static per layout anyway).

---

## 1. Byte-budget calibration (measured)

All numbers are brotli q11 **marginal** sizes, meaning the size of
(bundle + X) minus the size of the bundle. That is what the transfer budget
sees, because brotli reuses context from three.js and from the existing
shaders.

| Item | Raw | Marginal brotli |
|---|---|---|
| Current scarecrow (`createStraw` … `createScarecrow`, minified) | 2,713 B | **728 B** |
| Existing ground `LITTER_GLSL` (verbatim GLSL) | 1,683 B | 540 B |
| Existing leaf vertex shader (verbatim GLSL) | 1,886 B | 481 B |
| My sketch (cloth + straw GLSL, `cloth()`, `tube()`, torso/sleeve/sack/hat shapes, straw tuft builder) | 4,212 B min | **1,293 B** |
| …of which GLSL only, formatted normally | 2,051 B | 639 B |
| …the same GLSL with whitespace stripped | 1,678 B | **740 B (worse)** |

Library additions, measured by bundling a test entry against three r187 with
the repo's rolldown, compared to a baseline that already holds the classes
the scene imports plus `GLTFLoader` and `mergeVertices`:

| Import | Marginal brotli |
|---|---|
| `MeshPhysicalMaterial` | **≈0** (−40 B; already pulled in by `GLTFLoader`) |
| `ConeGeometry` | 17 B (a thin subclass of `CylinderGeometry`) |
| `RingGeometry` | 231 B |
| `LatheGeometry` | 347 B |
| `CapsuleGeometry` | 408 B |
| `mergeGeometries` (BufferGeometryUtils) | 735 B |
| `TubeGeometry` + `CatmullRomCurve3` | 2,606 B |
| `BatchedMesh` | 3,452 B |

What follows from these numbers:

- **Minified JS compresses to roughly 0.27–0.3 of its size, and GLSL to
  roughly 0.3.** So 6 kB of brotli headroom is about 20 kB of new minified
  code. A target of "6–10 kB of minified JS+GLSL" is about 2–3 kB brotli.
- **rolldown does not touch GLSL template literals.** Comments and
  indentation inside them ship verbatim (I checked the built bundle).
  Keep explanatory comments in JS, outside the template strings.
- **Do not whitespace-minify the GLSL.** In my test it made the marginal
  size *bigger* (740 B against 639 B), presumably because normally formatted
  GLSL matches three's own chunk text and the existing shaders. Write it in
  the same style as three's chunks.
- **Build lathes from `CylinderGeometry` vertex remaps (0 B) instead of
  `LatheGeometry` (347 B).** Also avoid `TubeGeometry`/curves and
  `mergeGeometries`. If you want merging, a hand-written concat of a few
  attributes is about 150–250 B minified, under 100 B brotli.

---

## 2. Reference anatomy: what real scarecrows are

### How they are built (primary how-to guides)

- **Frame.**
  - Hobby Farm Home (Gogerty) uses an 8 ft pole driven 2 ft into the ground,
    with a 5 ft crosspiece about 1 ft below the top. It notes that
    "Scarecrow arms don't bend", so the shirt goes straight onto the board
    [S1].
  - eHow uses a 30-inch crosspiece screwed on with "about 5 inches of post
    above the wood for the head" [S2].
  - RHS uses a 2 m stake with a 1 m crossbar about 15 cm from the top, plus a
    second short bar halfway down for the trousers: "Placing a shirt on the
    top crossbar and the trousers on the smaller bar is the standard
    scarecrow design" [S3].
  - So the arms are *straight and level at shoulder height*. The shoulders
    *are* the bar, the head sits directly on the post, and the pole runs
    "up its back" (Baum) [S4].
- **Clothes.**
  - eHow: a plaid shirt and bib overalls. The overall straps fasten over the
    shirt, the shirt is tucked into the overalls, and gloves are tucked into
    the sleeves, with "Tie some twine tightly around the ends of both pant
    legs" and cuffs tied shut [S2].
  - Hobby Farms: "Old shirts, jackets, jeans, dresses, and bib overalls are
    the basic garb", with a red bandana at the collar [S1].
  - Baum's archetype: "a blue suit of clothes, worn and faded, which had also
    been stuffed with straw" [S4].
- **Stuffing.** Straw or hay is packed into the chest, arms and legs. eHow:
  "Let some straw poke out between the buttons and from the neck" [S2]. RHS:
  "Push some straw under the hat and leave it dangling out to look like
  hair" [S3]. Arm and leg ends are tied with twine [S1][S3].
- **Head.**
  - eHow: a burlap rectangle of about 2 × 2.5 ft with straw in the centre,
    folded into a head and filled "until it's round and full enough". The
    extra burlap at the bottom is wrapped around the post, tied with twine,
    and "Tuck[ed] … into the shirt collar" [S2].
  - wikiHow and Hobby Farms describe the same gathered-and-tied sack. Hobby
    Farms also offers a gourd as an alternative [S1].
  - The face is drawn with permanent marker or paint [S2][S3]. Baum: "eyes,
    nose, and mouth painted on it to represent a face" [S4].
- **Hat.** A straw hat pinned on [S2]. Hobby Farms lists straw hats and seed
  caps [S1]. Baum's is "an old, pointed blue hat" [S4]. Floppy felt and wide
  straw brims are the common choices.
- **Sizes in scene units.** A burlap sheet of 2 × 2.5 ft stuffed round gives
  a head about 30 cm across, slightly larger than a human head. Against a
  figure of about 1.8–2 m including the hat, the head is about 1/6 of the
  height. The current head (r = 0.27, so about 0.58 tall with squash, out of
  2.3) is closer to 1/4. That proportion reads as cartoon, not as a real
  scarecrow.

### What makes one read as real (observations, backed where possible)

- **Gravity everywhere.** Stuffing settles, so sleeves sag between the
  shoulder and the cuff tie, and the cloth hangs *below* the bar: the bar
  sits at the top inside of the sleeve, so the sleeve's cross-section becomes
  a teardrop. Trousers hang limp. The shirt is fuller at the bottom than at
  the shoulders. The sack head slumps and tilts.
- **Pinches and ties.** Twine cinches at the neck, wrists, ankles and waist.
  The fabric gathers into radial pleats as it converges on each tie, and
  flares out *past* the tie: the sack's skirt below the neck tie, a cuff
  flare, a trouser hem. Straw spills from every opening.
- **Weathering.** Fabric fades in the sun, especially on top-facing
  surfaces. Hems get dirty and dark. There are water stains with tide lines,
  patches, frayed edges and a dull overall colour. Hessian has a
  "naturally non-shiny refraction and fuzzy texture" [S5].
- **Asymmetry.** The hat sits askew, one sleeve is lower, the head is
  tilted, and the straw is irregular. Perfect primitives are the main reason
  the current model looks "not natural": the cylinder shirt, the torus scarf,
  the top hat, cone-shaped straw tufts, and saturated flat colours.

### Silhouette cues that matter at 120–350 px

Valve's Team Fortress 2 paper (Mitchell, Francke and Eng) is the classic
primary source on characters that must read at a distance. It says
characters were "readily identifiable … even when viewed only in silhouette
with no internal shading at all". It also says "the clothing folds were
explicitly designed to echo silhouette shapes", that "High frequency detail
is omitted where possible", and that "Silhouettes are emphasized with rim
highlights rather than dark outlines" [S6]. The ranking below is mine,
ordered by how much each cue changes the silhouette:

1. **The cross/T silhouette with sagging sleeves and limp trouser legs, with
   the post showing below them.** This is what says "scarecrow on a pole"
   rather than "person" or "shirt on a stick".
2. **A wide, floppy, asymmetric hat brim.** It breaks the round head shape
   and gives a strong value contrast at the top.
3. **Straw fringes breaking the outline** at the cuffs, ankles, collar,
   waist and under the brim. The straw is light, irregular and dark at the
   roots.
4. **The pinched sack neck** with the burlap skirt tucked into the collar,
   plus the head tilt.
5. **Interior detail:** plaid (visible on desktop only), big dark eyes, fold
   shading, colour blocking between shirt, overalls and sack, and a sheen rim
   on fabric edges.

**Pixel maths.** The visible height at distance 15 with a 30° vertical FOV
is 2·15·tan(15°) = 8.04 units. A 2.3-unit figure at 250–350 CSS px therefore
means about 110–150 CSS px per unit on desktop. At pixelRatio 2 that is
about 220–300 drawing-buffer px per unit, and drawing-buffer pixels are what
`fwidth` measures. On a phone, 120 CSS px per figure is about 52 CSS px per
unit, or about 78 drawing-buffer px at pixelRatio 1.5. Assuming 1 unit is
about 0.8 m:

| Feature (real size) | Units | Desktop px (CSS) | Phone px (CSS) | Verdict |
|---|---|---|---|---|
| Burlap thread pitch (~10 threads/inch, ≈2.5 mm [S7]) | 0.003 | 0.4 | 0.16 | never resolved: fade to average |
| Flannel plaid repeat (≈6–8 cm) | 0.08–0.1 | 9–15 | 4–5 | the one pattern that reads (desktop) |
| Denim twill, felt, twine twist | <0.003 | <0.5 | — | plain colour |
| Straw stalk diameter (3–5 mm) | ~0.005 | 0.6 | 0.25 | must be widened to ≥1 px or it dashes |
| Painted eye (realistic 4 cm) | 0.05 | 6–7 | 2.5 | paint 0.07–0.09 units across |
| Hat brim width | 0.55–0.65 | 70–95 | 30 | primary silhouette |

### Palettes (sRGB albedo, faded; tune per theme)

- **Burlap:** natural jute is tan `#8d7a5a`; weathered towards grey
  `#7e735f`, with darker grime `#5e5240`.
- **Straw:** pale gold `#d9c38a`, wheat `#c4a25e`, ochre `#a8843f`,
  grey-brown (old) `#8a7a5c`, and the odd greenish-grey hay `#8f8a5e`.
- **Flannel, faded buffalo or tartan:** brick `#8a3b32` with charcoal
  `#2e2b2a` and a mustard line `#b08d4a`. An alternative is faded blue-grey
  `#56677a` with cream `#c9bfa6`.
- **Overalls or denim:** `#4a5a6e`, faded lighter at the knees and seat
  `#6b7a8a`.
- **Felt hat:** `#4a3c32` or `#3a3530`, sun-faded on top towards `#6a5c50`.
- **Twine:** `#a08a62`. **Weathered post:** `#6e675e`.
- **Accent:** the site accent on the bandana at the collar (Hobby Farms'
  "red bandana" [S1]) and on the hat band, as today.

---

## 3. Procedural cloth shading

### 3.1 Antialiasing first: box filtering and band-limiting with `fwidth`

The basic tools are:

- **Inigo Quilez's analytic box-filtered patterns** [S8][S9]. The filter
  width is `w = max(abs(dFdx(p)), abs(dFdy(p)))`, and the box filter of a
  periodic signal is (integral(p + w/2) − integral(p − w/2)) / w. His
  checkerboard article credits *Advanced RenderMan* (Apodaca and Gritz) for
  the idea.
- **Band-limiting** [S10]: fade any oscillation whose cycle is smaller than a
  pixel to its average. For noise, "blending it towards zero based on the
  ratio wavelength-to-filter-width". His cheap cosine:

  ```glsl
  float fcos(float x) { float w = fwidth(x); return cos(x) * smoothstep(6.2832, 0.0, w); }
  ```

  For noise: `noise(x) * smoothstep(1.0, 0.5, w)` [S10]. The repo's ground
  shader already does exactly this with
  `smoothstep(0.25, 0.6, fwidth(...))`.

**Exact box-filtered periodic pulse.** This is 1 on [a, b) of each unit and
the workhorse for plaid stripes. It needs no tuning, and when the pixel
covers many periods it converges to the mean (b − a) on its own:

```glsl
float pulse(float x, float a, float b) {
  float w = max(fwidth(x), 1e-4);
  #define P(t) (floor(t) * (b - a) + clamp(fract(t), a, b) - a)   // ∫ pulse
  return (P(x + 0.5 * w) - P(x - 0.5 * w)) / w;
}
```

Composite caveat (IQ [S10]): filtering each element separately and then
combining them is "slightly over-blurred" but stable, which is fine here.

### 3.2 Flannel plaid (tartan): the visible pattern

Tartan is woven with "the sequence of the warp colours … repeated in same
order and size in the weft". Where two different colours cross, the result
is "an equal admixture of the two colours alternating". It is "a tight,
staggered 2/2 twill" [S11], and twill steps by one thread per row to make
diagonal ribs [S12]. Flannel can be twill or plain weave, and its brushed nap
raises fibres that "often hide the weave" [S13]. At our scale the twill is
sub-pixel, so the **filtered tartan is simply the 50/50 average of the warp
stripe colour and the weft stripe colour**:

```glsl
vec3 sett(float x) {                 // one sett per unit: dark band + thin light line
  return mix(mix(uA, uB, pulse(x, 0.0, 0.42)), uC, pulse(x, 0.6, 0.66));
}
vec3 plaid(vec2 uv) { return 0.5 * (sett(uv.x) + sett(uv.y)); } // uv in setts
```

Where dark crosses dark you get the solid dark squares, where light crosses
light you get solid light, and the crossings blend. That is the
buffalo-check or tartan look, it antialiases exactly, and it costs about
200 B of GLSL. Add twill diagonals only if the camera ever gets close.

### 3.3 Burlap: hint at the weave, render the average

Hessian is plain-weave jute: "over one, then under the next" [S14]. Vendor
specs give about 10–11 threads per inch [S7]. With a pitch of about 0.4 px,
**the weave can never be resolved in this scene**, so it should cost
nothing. What reads instead:

- **Average colour, including the gaps.** Open-weave burlap shows what is
  behind it, which here is golden straw, not sky. So the
  average = mix(straw, yarn colour, coverage ≈ 0.8). Do not use transparency.
- **Slubs and streaks.** Jute yarn varies in thickness. Use anisotropic
  value noise stretched along the warp and weft, for example
  `vnoise(uv * vec2(4, 40))`, at a few centimetres. It resolves at 2+ px and
  reads as "woven, fibrous" without resolving a single thread.
- **Fuzz.** Use sheen (section 3.5) and the backlight term (section 3.7).
- **The true weave**, only where it is at least 2 px wide (close-ups, or if
  the hero is ever zoomed):

```glsl
// p in thread units. Visible yarn per cell alternates warp/weft (plain weave);
// yarn brightness varies per thread; gaps reveal the stuffing colour uC.
vec2 f = abs(fract(p) - 0.5), i = floor(p);
float up   = mod(i.x + i.y, 2.0);
float yarn = smoothstep(0.5, 0.3, mix(f.y, f.x, up))
           * (0.75 + 0.25 * hash(vec2(mix(i.y, i.x, up), up)));
float fine = smoothstep(0.6, 0.25, max(fwidth(p.x), fwidth(p.y)));
vec3 burlap = mix(mix(uC, uA, 0.8),            // filtered average
                  mix(uC, uA, yarn), fine);     // resolved weave
```

For the physically based version of woven-cloth reflectance (specular from
the fibres dominates cloth appearance), see Irawan and Marschner,
"Specular reflection from woven cloth" [S15]. It is overkill here, but it
supports the point that fibre sheen, not a weave texture, is what carries
the look at a distance.

### 3.4 Weathering (cheap, and the largest realism gain after silhouette)

Use object-space position and normal varyings:

```glsl
float n  = vnoise(vP.xy * 6.0 + vP.z * 4.0);                 // broad blotches
float tide = smoothstep(0.47, 0.5, n) - smoothstep(0.5, 0.53, n); // stain edge
c *= 0.82 + 0.3 * n;                                          // uneven fading
c *= 1.0 - 0.25 * tide;                                       // water-stain line
c  = mix(c, vec3(dot(c, vec3(0.3, 0.59, 0.11))) * 1.1,        // sun-bleach tops
         0.35 * max(vN.y, 0.0));
c *= mix(0.65, 1.0, smoothstep(0.0, 0.15, vEdge));            // grime toward hems/ties
c *= mix(0.6, 1.0, vFold);                                    // crease occlusion
```

`vFold` and `vEdge` are per-vertex attributes written by the geometry
builder (section 4), so the folds darken even with no shadow map in the
lighter form. **Add one sewn-on patch** to the shirt or overalls: a
rectangle SDF in uv with a contrasting fabric and dashed stitches. That is
about 150 B, and a patch is an iconic real-scarecrow detail.

### 3.5 Fabric sheen: `MeshPhysicalMaterial.sheen` (recommended)

- three r187's sheen is Charlie sheen: the `D_Charlie` and `V_Neubelt`
  functions in `lights_physical_pars_fragment`, citing "Estevez and Kulla
  2017, Production Friendly Microfacet Sheen BRDF" and Neubelt and Pettineo
  2013. IBL uses a curve fit (`IBLSheenBRDF`) and energy compensation scales
  down the diffuse [S16][S17].
- Filament explains why cloth needs this: "cloth is characterized by a softer
  specular lobe with a large falloff", and "the presence of fuzz lighting,
  caused by forward/backward scattering". Its cloth model drops Fresnel
  [S18].
- **Cost/benefit.**
  - *Bytes:* `sheen: 1, sheenRoughness: 0.8, sheenColor` is about 50 B, and
    the class is already bundled.
  - *GPU:* per direct light it adds one `pow`, two `exp` (the albedo scaling)
    and a normalize, plus an indirect term. The three.js docstring warns that
    `MeshPhysicalMaterial` "has a higher performance cost, per pixel… Most
    effects are disabled by default, and add cost as they are enabled" [S19].
    The scarecrow covers maybe 1–2% of the canvas, so the cost is negligible
    even in the 30 fps lighter form.
  - *Benefit:* a soft bright rim on grazing edges. Under the low warm sun
    that is exactly the "fabric, not plastic" cue, and the TF2 paper also
    emphasises silhouettes with rim highlights [S6].
- **Settings.** Burlap: `sheenColor` ≈ 0.35 × pale straw, `sheenRoughness`
  0.9. Flannel: 0.3 × a lighter tint of the base, roughness 0.6–0.7. Felt
  hat: 0.25 × a grey tint, roughness 0.8.
- **Also set `diffuseRoughness: 1`.** This is new in three's
  `MeshPhysicalMaterial`. It uses the EON energy-preserving rough diffuse
  model, which three describes as giving "the flatter appearance and enhanced
  backscattering of rough diffuse surfaces such as clay, concrete" [S19]
  [S20]. It costs about 20 B and suits jute, felt and brushed flannel.

### 3.6 Wrap lighting (optional; try after sheen)

- **GPU Gems ch.16:**
  `wrap_diffuse = max(0, (dot(L,N) + wrap) / (1 + wrap))`. The same section
  suggests a colour shift near the terminator [S21].
- **Filament cloth:** the energy-conserving form
  `saturate((NoL + w) / (1 + w)²)` with the wrap fixed at `w = 0.5`,
  multiplied by `saturate(subsurfaceColor + NoL)` [S18].
- **TF2's "Half Lambert"**, `(0.5·N·L + 0.5)²`, exists so characters don't
  lose "a sense of shape on the back side" [S6].
- **In three r187** you can add a tinted wrap term without rewriting the
  BRDF. Wrap `RE_Direct_Physical` and redefine the macro, appended to the
  `lights_physical_pars_fragment` chunk. Light is added only past the
  terminator:

```glsl
uniform vec3 uWrap;   // e.g. warm straw tint * 0.5
void RE_Direct_Cloth(const in IncidentLight l, const in vec3 p, const in vec3 n,
    const in vec3 v, const in vec3 c, const in PhysicalMaterial m,
    inout ReflectedLight r) {
  RE_Direct_Physical(l, p, n, v, c, m, r);
  float d = dot(n, l.direction);
  r.directDiffuse += l.color * uWrap * BRDF_Lambert(m.diffuseColor)
                   * max(0.0, (d + 0.5) / 2.25 - max(d, 0.0));
}
#undef RE_Direct
#define RE_Direct RE_Direct_Cloth
```

Caveat: `directLight.color` already includes the shadow-map term, so in the
full form the VSM self-shadow largely suppresses wrap on the dark side.
It shows mostly in the lighter form, which has no shadow map. That is about
350 B raw and 150 B brotli. EON plus sheen plus the hemisphere fill may
already be soft enough, so judge it visually.

### 3.7 Backlit translucency (cheap, high payoff with a low sun)

Straw and burlap fuzz glow when the low sun is behind them. Crysis'
vegetation shading uses translucency for leaves for the same reason [S22].
Add this after the lights are accumulated, at the `lights_fragment_end`
hook:

```glsl
#if NUM_DIR_LIGHTS > 0
  reflectedLight.directDiffuse += directionalLights[0].color * uGlowTint
    * pow(saturate(dot(-geometryViewDir, directionalLights[0].direction)), 4.0);
#endif
```

`directionalLights[0].direction` is in view space and points towards the
light, so this term peaks when the sun is behind the object. Use it on the
straw at full strength and faintly on the burlap.

---

## 4. Cloth geometry without simulation

### 4.1 A lathe on a cylinder (0 B library cost)

`CylinderGeometry(1, 1, 1, around, along, true, Math.PI)` gives a ring grid
with uv (u around, v from 0 at the bottom to 1 at the top). Starting at
`thetaStart = π` puts the seam at the back. Remap each vertex:

```js
function tube(around, along, shape) {
  const g = new CylinderGeometry(1, 1, 1, around, along, true, Math.PI);
  const p = g.attributes.position, uv = g.attributes.uv;
  const fold = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const a = uv.getX(i) * Math.PI * 2 + Math.PI, t = uv.getY(i);
    const [r, y, f = 1, x = 0, z = 0] = shape(t, a);
    p.setXYZ(i, Math.sin(a) * r + x, y, Math.cos(a) * r + z);
    uv.setXY(i, uv.getX(i) * 6.28 * r, y);      // uv in world units: patterns stay square
    fold[i] = f;                                // 0 = deep crease … 1 = open
  }
  g.setAttribute("fold", new BufferAttribute(fold, 1));
  g.computeVertexNormals();
  return g;
}
```

The open seam leaves a faint normal discontinuity at the back, which is
invisible at this size. `mergeVertices` won't weld it because the uvs
differ.

### 4.2 The shape vocabulary (all evaluated on the CPU, at build time)

| Effect | Formula idea (t along, a around) |
|---|---|
| **Pinch or tie** at t₀ | `r *= 1 - k * exp(-((t - t0)/0.04)²)`, with a darker `fold` and a twine colour band in the shader |
| **Flare past a tie** (sack skirt, cuff) | radius grows again beyond t₀, plus a jagged edge: `y += 0.02 * hash(column)` on the last ring |
| **Gathered pleats into a tie** | `r *= 1 + g(t) * 0.2 * sin(a*9 + 1.5*sin(t*9))`, where g peaks at the tie; set `fold = 0.5 + 0.5*sin(...)` so the pleat valleys darken |
| **Drape folds hanging from the shoulders** | `r *= 1 + 0.05*(1 - t) * sin(a*5 + φ)`, so vertical folds fade going up |
| **Sleeve sag over the bar** | the ring centre drops `0.04*sin(πt)` (stuffing settles mid-sleeve) and the bottom stretches: `y -= 0.02*(1 - cos a)` gives a teardrop section |
| **Compression wrinkles** near a tie or the armpit | high-frequency radial ripple `0.08*exp(-d/0.08)*sin(a*7 + noise)` that decays with distance d from the tie |
| **Stuffing settle** in the torso | radius larger low and smaller high; front-back squash `r *= 1 - 0.3*cos²a` |
| **Slump** | rotate whole parts a few degrees: head tilted 0.15–0.25 rad, bar tilted 2–4°, trousers swung slightly forward at the knees |

These come from the same reasoning as the Crysis vegetation and GPU Gems
grass work: bake the static shape, animate only a small residual [S22][S23].

### 4.3 Wind sway that matches the CPU gust

- **Keep the CPU rotation of the loose sleeve group** as it is. It uses
  `gustAt()`, which the leaf shader also evaluates, and needs zero shader
  bytes. Parent the sleeve's straw `InstancedMesh` to that group so the
  straw follows automatically.
- **Add only a small flutter in GLSL** on loose edges: shirt hem, sack
  skirt, trouser cuffs, bandana tail. Weight it by an edge attribute (or
  `1 - t`), and pass the CPU-computed gust strength as a uniform instead of
  duplicating the formula:

  ```glsl
  transformed += uGust * edge * edge * vec3(0.02 * sin(uTime * 6.0 + position.y * 9.0), 0.0, 0.008);
  ```

- **Per-vertex vs per-object phase.** GPU Gems ch.7 found that per-vertex
  displacement gives "a homogeneous look", while per-object phase (from each
  object's centre) avoids synchronised motion [S23]. For straw, seed the
  phase from `gl_InstanceID`.
- **Cheaper waves.** Crysis replaces sine with a smoothed triangle wave,
  `SmoothCurve(TriangleWave(x))`, and preserves length with
  `normalize(p) * length` [S22]. Neither is needed at these amplitudes.

### 4.4 Shadows and vertex animation (r187 behaviour)

- The shadow pass uses `object.customDepthMaterial` if one is set, and
  otherwise a shared `MeshDepthMaterial`. Your `onBeforeCompile` code does
  **not** run in the depth pass
  (`WebGLShadowMap.getDepthMaterial` [S24]).
- So **static drape must be in the geometry (CPU)**, not in the vertex
  shader, or the shadows won't match.
- The scene sets `shadowMap.autoUpdate = false` and redraws shadows once per
  layout. The head turn and sleeve sway aren't in the shadow today either, so
  there is no need for a `customDepthMaterial` for the flutter.

---

## 5. Straw

### Options at this scale

| Technique | Verdict |
|---|---|
| **Instanced tapered ribbons** (5 verts, 3 tris, curled in the vertex shader) | **Use.** Real geometry, lit and shadowed by the stock material, one draw call per parent, tiny code. |
| Kajiya-Kay or Scheuermann strand specular: `sin(T,H)^p`, tangent shift `T' = normalize(T + s·N)` for two highlights [S25][S26] | **Skip.** At 1–2 px wide the highlight cannot be resolved, and it needs an `RE_Direct` override. Backlight translucency gives more. |
| Alpha-tested cards (GPU Gems ch.7 star clusters [S23]) | **Skip.** They need a texture or procedural alpha, and alpha-test edges shimmer without MSAA (lighter form). `alphaToCoverage` needs MSAA. |
| `GL_LINES` | **Skip.** Always 1 px, no shading or shadows, looks different from the rest. |
| Open frayed cones (current) | **Replace.** They read as cones or skirts, which is the "not natural" complaint. |

### Recipe

- **Base strand.** A unit ribbon along +y (0→1) with x ∈ ±0.5, three rows
  (bottom, middle, tip). In `begin_vertex`, taper the width and curl it with
  a per-instance hash:

  ```glsl
  float t = position.y;
  vec4 h = fract(sin(float(gl_InstanceID) * vec4(12.9898, 78.233, 37.719, 4.581)) * 43758.5453);
  transformed.x *= 1.0 - 0.8 * t;                 // taper
  transformed.z += t * t * (0.3 + h.x) * 0.35;    // droop (curl toward local +z)
  vRoot = t;                                      // for root darkening
  ```

- **Orientation on the CPU.** For each strand in a tuft, pick a direction
  `d` inside the tuft's cone. Then build the instance matrix with
  `Matrix4.makeBasis(x, d, z)`, where `z = normalize(down − d·(d·down))` and
  `x = cross(d, z)`. That makes the local +z curl point towards world-down,
  so gravity is consistent. Put length in `scale.y` and droop in
  `scale.z ≈ length`.
- **Minimum width.** Straw is about 0.005 units, so widen it to
  **0.012–0.018 units at the root** (≥1 drawing-buffer px on desktop and
  about 1 px on phones). If you want a hard guarantee, clamp the width in the
  vertex shader to a pixel size,
  `max(w, uPixel * -mvPosition.z)` with `uPixel = 2·tan(fov/2)/bufferHeight`,
  the same idea as three's fat lines. That is about 100 B.
- **Normals.** Round them across the ribbon: in `beginnormal_vertex`,
  `objectNormal = normalize(vec3(position.x * 1.5, 0.0, 1.0))`. Use
  `side: DoubleSide`. This is the rounded-blade trick used for modern grass.
  GPU Gems ch.7 instead orients all normals uniformly for consistent
  lighting [S23].
- **Colour.** Use `setColorAt` with 4–5 swatches from pale gold to
  grey-brown, times a random factor of 0.8–1.15. The tree already does this.
  In `color_fragment`, `diffuseColor.rgb *= mix(0.45, 1.0, vRoot)`: dark roots
  sell "spilling out of a dark opening", which is what cones can't do.
- **Counts.** About 35–50 per cuff, 30–40 per ankle, 40 at the collar, 50–70
  at the waist or hem, and 60–90 under the brim. **About 300–400 total**,
  roughly 1.2k triangles. Set `mesh.count` to half in the lighter form.
  Instance matrices are built at runtime, so they cost no download bytes.
- **Draw calls.** Use one geometry and one material across 3–4
  `InstancedMesh`es:
  - the body (collar, waist, ankles)
  - the head group (hair under the hat turns with the head)
  - the left and right loose-sleeve groups (cuffs sway with the gust)

  The cost is 3–4 draw calls, plus the same again in the shadow pass on
  layout. `InstancedMesh` shadows work out of the box.
- **Tuft shape.** Real spills fan outward and then droop. Some strands stick
  out stiffly, a few long ones hang. Anchor strands on a *ring* at the
  opening (not a point), point the axis outward plus down, give each strand
  a random spread of ±35°, and use a long-tailed length distribution
  (`0.5 + r³`).

---

## 6. Head, face and hat

### 6.1 The sack

Build it with `tube()` using this profile, bottom to top:

- **t 0–0.12, the skirt below the tie:** radius flaring from 0.05 to about
  0.12, with a jagged lower edge and strong pleats. It tucks into the collar,
  so it can be short.
- **t ≈ 0.15, the tie:** radius about 0.04, `fold` low, and a twine colour
  band in the shader. A separate thin `TorusGeometry` (already bundled) is
  optional at about 4 px wide.
- **t 0.2–0.95, the bulb:** pear-shaped, widest around t ≈ 0.45 because the
  stuffing settles. Width about 0.36–0.4 units, height about 0.38–0.42.
  Squash it front to back (×0.9) and add 2–3 low-frequency lumps.
- **Pleats** converge into the tie and fade by mid-bulb (section 4.2).
- **Optional "sack corners".** A folded rectangle leaves two small points at
  the top corners. These are mostly hidden by the hat, so skip them unless
  the hat is removed.

Put a constant tilt on an inner group (0.15–0.25 rad sideways and a slight
forward droop) so the pointer-tracking yaw on the outer head group composes
with it. The hat and the head straw are children of the inner group.

### 6.2 The face, painted in the fragment shader

The guides call for marker or paint [S2][S3][S4]. Mesh stitches cost draw
calls and alias. Draw SDFs in object space on the front (`vP.z > 0`),
antialiased with `fwidth`, with a slightly ragged edge from noise (paint
soaking into burlap):

```glsl
float face(vec2 p) {
  float eyes = length(vec2(abs(p.x) - 0.075, p.y - 0.03)) - 0.032 - 0.006 * vnoise(p * 90.0);
  float arc  = abs(p.y + 0.06 - 1.6 * p.x * p.x);
  float grin = arc - 0.005;
  float ticks = max(abs(mod(p.x, 0.03) - 0.015) - 0.003, arc - 0.016); // cross-stitches
  float d = min(eyes, max(min(grin, ticks), abs(p.x) - 0.1));
  return 1.0 - smoothstep(-fwidth(d), fwidth(d), d);
}
// color_fragment: c = mix(c, ink, face(vP.xy) * step(0.0, vP.z));
```

- **Size for the phone.** Eyes about 0.07 units across (3–4 px at 120 px
  figure height) and a mouth line at least 0.012 units wide. The pointer
  tracking only reads if the eyes do.
- **Option: triangle eyes** (classic painted look), using
  `max(abs(p.x)*0.87 + p.y*0.5, -p.y) - r`.
- **Paint as dry-brush.** Multiply the ink by `0.75 + 0.25*noise`, and fade
  it where the burlap is in a pleat valley (`vFold`).

### 6.3 The hat: floppy brim via a displaced ring

Use one `tube()` whose profile runs from the outer brim edge inward along
the brim, then up the crown, then across the top. Use `side: DoubleSide` so
the underside renders.

- **Brim droop:**
  `y -= (rOuter - r)² * (0.25 + 0.2*sin(2a + φ) + 0.1*sin(3a))`. That gives
  two low lobes and one flipped-up side. Add a little `sin(5a)` waviness and
  a jagged, torn edge (hash on the last ring).
- **Crown:** slightly tapered, with a centre crease (pinch the top ring
  inward and down, "pork-pie" style) and a dent on one side. Darken
  `fold` in the crease.
- **Under-brim occlusion** for the lighter form, which has no shadow map:
  darken the sack where `vP.y` is high, for example
  `mix(0.7, 1.0, smoothstep(0.17, 0.05, vP.y))`. Darken the straw under the
  hat the same way.
- **Felt or straw?** Felt (dark, sun-faded on top, sheen) gives the best
  value separation from the beige burlap head and the straw hair at 120 px.
  A straw hat is more "farm" but risks a single beige blob; if you choose it,
  keep a dark (accent) band and strong under-brim shading.
- **Straw-hat weave**, if chosen: hats are made from plaited straw strips
  [S27], sewn in a spiral, which reads as concentric rings. Use a
  band-limited ring term on radius, `0.85 + 0.15 * fcos(r * 2π * 90)`. The
  plait width (about 1 cm, 1–1.5 px) fades out automatically. Skip the plait
  chevrons.

---

## 7. three.js r187 pitfalls specific to this repo

1. **The program cache key collision in `extendShader`.** three's default
   `Material.customProgramCacheKey()` returns
   `this.onBeforeCompile.toString()`. `extendShader` assigns the *same
   closure source* to every material, so two materials of the same type and
   flags with *different* injected GLSL share a single compiled program.
   Whichever compiles first wins (`WebGLPrograms.getProgramCacheKey` and
   `acquireProgram` [S28]).
   - Today the ground (transparent) and the pumpkin skin (opaque) avoid this
     only because `opaque` is part of the key.
   - Any new opaque `MeshStandardMaterial` extended with different GLSL
     would collide with the Halloween pumpkin.
   - **Fix it once inside `extendShader`**, for example
     `material.customProgramCacheKey = () => JSON.stringify([vertex, fragment])`,
     or give each a distinct `defines` entry (defines are in the key).
   - The in-progress scarecrow code already sets `customProgramCacheKey` per
     cloth pattern, which is correct.
   - Alternatively, use **one shared cloth GLSL with a `uKind` uniform
     branch**. That compiles one program for every fabric, means less compile
     jank at mount and fewer bytes, and uniform branches are coherent and
     cheap.
2. **`onBeforeCompile` doesn't affect the shadow depth pass** (section 4.4).
3. **`MeshPhysicalMaterial` wants an environment map** "for best results"
   [S19]. The scene already has a PMREM environment.
4. **`gl_InstanceID` is available** (WebGL2). Per-strand randomness can come
   from it instead of an extra instanced attribute. `InstancedMesh` already
   provides matrices and colours.
5. **The lighter form** has no MSAA and pixelRatio 1.5. Everything above is
   driven by `fwidth`, so it degrades gracefully. Halve the straw count, and
   rely on `fold` and under-brim darkening in place of shadows.
6. **Draw calls.** The current scarecrow is about 26 meshes (each stitch is a
   mesh). The plan is about 12–16:
   - post and bar: 2
   - torso, plus the trousers with pelvis: 2–3
   - sleeves (static upper plus loose part): 4
   - sack and hat: 2
   - bandana: 1
   - straw: 3–4

   Merging the static cloth into one geometry with a hand-written concat
   (all on one material, using `uKind` as a vertex attribute instead of a
   uniform) gets this to about 8–10.

---

## 8. Concrete plan with byte estimates

Marginal brotli. "Measured" means taken from the sketch. The other rows are
extrapolated at the same ratio.

| Part | What | Est. brotli |
|---|---|---|
| Shared cloth GLSL | hash, value noise, `pulse`, plaid, burlap average and slub (optional resolved weave), weathering (fade, tide, grime, fold AO), face SDF, backlight | ~550–700 (sketch GLSL incl. straw: 639, measured) |
| `cloth()` material factory | `MeshPhysicalMaterial` + sheen + `diffuseRoughness` + uniforms | ~100 |
| `tube()` builder + `crease()` helper | section 4.1 | ~150 |
| Part shapes | torso, 2 sleeve parts, pelvis/overall, 2 legs, sack, hat, bandana; pinches, flares, jagged hems | ~450–650 |
| Straw | ribbon geometry, tuft builder (makeBasis), vertex curl and root chunk, 8–10 tuft definitions | ~350–450 |
| Assembly + animation | parenting, tilt group, flutter uniform, lighter-form straw count | ~200–300 |
| Theme hooks | palette per theme (sheen and glow tints) | ~100–150 |
| **Total** | | **≈ 2.0–2.6 kB** for the sketch's scope; **≈ 2.5–3.5 kB** fully finished |
| Minus the old scarecrow | | −0.73 kB |
| **Net growth** | | **≈ +1.8–2.8 kB of the ~6 kB headroom** |

**Order of work, by visible payoff per byte:**

1. Proportions, slump, asymmetry, floppy hat, hanging trousers. This is
   mostly constants.
2. `tube()` with pinches, sag, pleats, jagged hems and the `fold` attribute.
3. Instanced straw at every opening, with root darkening and colour
   variation.
4. The cloth shader on `MeshPhysicalMaterial`: filtered plaid, burlap
   average, weathering, sheen and EON.
5. The painted face.
6. Backlight translucency, the patch and the bandana.
7. Optional: tinted wrap lighting, the resolved weave for close-ups, gloves
   (reuse `createLumpyBall`: a drooping, flattened lump at the cuffs, about
   100 B).

**Skip entirely:** cloth simulation or morph targets, `TubeGeometry` and
curves, `BatchedMesh`, `mergeGeometries`, `LatheGeometry` (fine at +347 B,
but the cylinder remap is free), weave-based normal perturbation, twill and
denim detail, Kajiya-Kay, alpha cards, `GL_LINES`, `customDepthMaterial`, a
separate twine torus, and mesh stitches.

---

## Sources

- [S1] R. Gogerty, "How To Make A Scarecrow From Farm Materials", *Hobby Farm Home* (Sept/Oct 2010; web 2012). https://www.hobbyfarms.com/?p=8080
- [S2] eHow, "How to Make a Scarecrow" (frame, plaid shirt and overalls, twine ties, burlap head tied to post, straw at buttons and neck, pinned straw hat, marker face). https://www.ehow.com/how_3981_make-scarecrow.html
- [S3] Royal Horticultural Society, "Make a scarecrow" (two-bar frame, ties at wrists, ankles and neck, straw under hat as hair). https://www.rhs.org.uk/education-learning/children-young-people/family-activities/do-it/make-a-scarecrow
- [S4] L. Frank Baum, *The Wonderful Wizard of Oz* (1900), ch. 3, Project Gutenberg #55. https://www.gutenberg.org/cache/epub/55/pg55.txt
- [S5] Wikipedia, "Hessian fabric" (jute, coarse, "naturally non-shiny refraction and fuzzy texture"). https://en.wikipedia.org/wiki/Hessian_fabric
- [S6] J. Mitchell, M. Francke, D. Eng, "Illustrative Rendering in Team Fortress 2", NPAR 2007 / SIGGRAPH 2007 course. https://www.cs.princeton.edu/courses/archive/fall07/cos597B/papers/mitchell-team-fortress.pdf
- [S7] Dharma Trading Co., "Bengal Burlap Bleached" spec (11 × 10 threads per inch). https://dharmatrading.com/html/eng/15187520-AA.shtml (vendor spec; heavier sacking is similar or coarser)
- [S8] I. Quilez, "Filtering the checkerboard pattern" (2017). https://iquilezles.org/articles/checkerfiltering/
- [S9] I. Quilez, "Filterable procedurals". https://iquilezles.org/articles/filterableprocedurals/
- [S10] I. Quilez, "Band limiting" (2020). https://iquilezles.org/articles/bandlimiting/
- [S11] Wikipedia, "Tartan" (sett, warp and weft admixture, 2/2 twill). https://en.wikipedia.org/wiki/Tartan
- [S12] Wikipedia, "Twill". https://en.wikipedia.org/wiki/Twill
- [S13] Wikipedia, "Flannel" (twill or plain; napping raises fibres). https://en.wikipedia.org/wiki/Flannel
- [S14] Wikipedia, "Plain weave". https://en.wikipedia.org/wiki/Plain_weave
- [S15] P. Irawan, S. Marschner, "Specular Reflection from Woven Cloth", ACM TOG 31(1), 2012. https://www.cs.cornell.edu/~srm/publications/TOG12-cloth.html
- [S16] A. Estevez, C. Kulla, "Production Friendly Microfacet Sheen BRDF", SIGGRAPH 2017 PBS course. https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_sheen.pdf
- [S17] three.js r187 source, `src/renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js` (`D_Charlie`, `V_Neubelt`, `BRDF_Sheen`, `IBLSheenBRDF`, `BRDF_EON`, `RE_Direct_Physical`, macro definitions). Local: `node_modules/three/src/...`; upstream https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js
- [S18] Google Filament, "Physically Based Rendering in Filament", Cloth model section (Charlie sheen, Neubelt visibility, no Fresnel, wrapped diffuse with w = 0.5). https://google.github.io/filament/Filament.md.html
- [S19] three.js r187 source, `src/materials/MeshPhysicalMaterial.js` (class docstring on cost and env map; `sheen*`, `diffuseRoughness` docs). Example: https://threejs.org/examples/webgl_loader_gltf_sheen.html
- [S20] J. Portsmouth et al., "EON: A Practical Energy-Preserving Rough Diffuse BRDF", JCGT 14(1), 2025. https://jcgt.org/published/0014/01/06/
- [S21] S. Green, "Real-Time Approximations to Subsurface Scattering", *GPU Gems* ch. 16 (wrap lighting). https://developer.nvidia.com/gpugems/gpugems/part-iii-materials/chapter-16-real-time-approximations-subsurface-scattering
- [S22] T. Sousa, "Vegetation Procedural Animation and Shading in Crysis", *GPU Gems 3* ch. 16. https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-16-vegetation-procedural-animation-and-shading-crysis
- [S23] K. Pelzer, "Rendering Countless Blades of Waving Grass", *GPU Gems* ch. 7. https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass
- [S24] three.js r187 source, `src/renderers/webgl/WebGLShadowMap.js` (`getDepthMaterial`, `customDepthMaterial`).
- [S25] J. Kajiya, T. Kay, "Rendering Fur with Three Dimensional Textures", SIGGRAPH 1989.
- [S26] T. Scheuermann, "Practical Real-Time Hair Rendering and Shading", SIGGRAPH 2004 sketch (shifted tangents `T' = normalize(T + s×N)`, two highlights, per-vertex AO). https://history.siggraph.org/wp-content/uploads/2022/12/2004-Talks-Scheuermann_Practical-Real-Time-Hair-Rendering-and-Shading.pdf
- [S27] Wikipedia, "Straw plaiting" (plaits braided into strips for hat makers). https://en.wikipedia.org/wiki/Straw_plaiting
- [S28] three.js r187 source, `src/materials/Material.js` (`customProgramCacheKey`), `src/renderers/webgl/WebGLPrograms.js` (`getProgramCacheKey`, `opaque` flag), `src/renderers/WebGLRenderer.js` (`onBeforeCompile` then `acquireProgram`).
- Photo references for proportions and slump: Wikimedia Commons, Category:Scarecrows. https://commons.wikimedia.org/wiki/Category:Scarecrows

### Measurement method (reproducible)

- Bundle marginal sizes: brotli q11 of (built `scene-autumn-ambient-*.js` +
  snippet) minus brotli q11 of the bundle.
- Library costs: rolldown 1.3.0 (`minify: true`) on test entries importing
  the scene's three r187 classes plus `GLTFLoader` and `mergeVertices`,
  compared with and without each addition.
- The sketch used for the estimate is a scratch file outside the repo
  (`/tmp/scr/sketch.js`).
