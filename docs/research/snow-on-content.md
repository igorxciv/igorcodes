# Techniques for snow that rests on page content

Research for [issue #13](https://github.com/igorxciv/igorcodes/issues/13), part
of the map in [issue #11](https://github.com/igorxciv/igorcodes/issues/11).
Researched 2026-11-09. Nothing here was prototyped; every claim is either
quoted from a source or marked as a reading of this repo's code. The
"Not verified" section lists what still needs a browser.

## Answer

Draw resting snow as content accents in CSS/SVG, attached to the elements
themselves. Keep the three.js ambient layer unaware of where content is, or at
most give it a coarse, cached list of "ledges" for a cosmetic effect that the
page does not depend on. Do not try to make canvas flakes pile up on DOM
elements as the way snow "rests": every working example of that pattern either
lags behind native scrolling or takes over scrolling to hide the lag.

| Need | Technique | Layer |
| --- | --- | --- |
| Snow sitting on a card, a heading, a timeline dot | Pseudo-element or inline SVG cap anchored to the element's top edge | Content accents |
| Snow cap that follows the theme | Shape as a mask, colour from `light-dark()` tokens | Content accents |
| Falling flakes, snowman, trees | Fixed, non-interactive canvas behind `main` | Ambient layer |
| Flakes that vanish at content edges (optional) | Cached document-space rects fed to the particle update | Ambient layer |
| Snow that visibly accumulates over time on DOM boxes | Not recommended; see "Canvas synced to DOM rects" | Neither |

## What the accents attach to (this repo)

Read from `app/_includes/partials/personal-site-page.njk`,
`app/assets/css/personal-site.css` and `app/assets/css/tokens.css` at commit
`3fb2162`.

- **Cards** (`.fm-card`): a box with `border: 1px solid var(--fm-border)`,
  `border-radius: 0.75rem`, `padding: 1rem`, no `overflow` clipping and no
  pseudo-elements in use. On hover it moves (`transform: translateY(-2px)`) and
  gains a shadow. This is the easiest target: a real top edge, free `::before`
  and `::after`, and room above (grid `gap: 0.9rem`).
- **Section headings** (`.fm-section-head h2`) and **hero name** (`.fm-name`):
  block boxes with `text-wrap: balance`. The box is as wide as the container,
  not as wide as the words, and the box top is the line box top, not the top of
  the capitals. A cap on the block box floats above the text and runs past its
  end. See "Headings" below.
- **Timeline** (`.fm-timeline-item`): unboxed text plus `.fm-timeline-dot` (an
  `aria-hidden` span) and the `.fm-timeline-line` / `.fm-timeline-progress`
  spans. The dot and line are the natural ledges; `.fm-timeline-progress::after`
  is already taken.
- **Sections** (`.fm-section`): `content-visibility: auto` with
  `contain-intrinsic-block-size: auto 960px`. This matters twice (see pitfalls):
  anything painted outside a section's box is clipped, and measuring elements in
  a skipped section forces its layout.
- **Reveal** (`.fm-enhanced .fm-reveal`): elements start at `opacity: 0;
  transform: translateY(16px)` and transition for 0.5s when they scroll in.
  Timeline copy and dots have their own `translateX` transitions.
- **Stacking**: `main` is `position: relative; z-index: 1`; the theme toggle is
  `position: fixed; z-index: 30`.
- **Existing layout reads**: `personal-site.js` already calls
  `timeline.getBoundingClientRect()` on every `scroll` event.
- **Build targets**: `app/_tools/browser-targets.js` pins Chrome/Edge 125,
  Firefox 126, Safari 17.5; lightningcss lowers newer syntax but cannot polyfill
  missing rendering features.

## Content accents: CSS/SVG snow caps

### Why this fits

A pseudo-element or child SVG is part of the element's own box tree, so the
browser keeps it attached for free. It follows scroll on the compositor, moves
with the card's hover transform, fades in with `.fm-reveal`, reflows on resize
and font load, and needs no JavaScript, no layout reads and no observers. It
also survives when the ambient layer never loads, which the glossary requires of
content accents ("remain when the ambient layer is not running").

### Shape and colour

Three ways to draw the cap, in order of preference for this codebase:

1. **Mask plus background colour.** The pseudo-element gets
   `background: var(--fm-snow)` and the lumpy silhouette comes from
   `mask-image` (an SVG `url()` or layered `radial-gradient()`s). MDN lists
   `mask-image` as Baseline widely available since December 2023 and accepts
   "any type of image, including generated images such as CSS gradients"
   ([MDN mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask-image)).
   The colour stays a token, so it follows `light-dark()` and theme transitions
   like every other colour here. One SVG silhouette can be reused at several
   widths with `mask-size` / `mask-repeat`.
2. **Inline SVG rendered at build time**, the same way the `lucide` shortcode
   already inlines icons. Paths can use `fill: var(--fm-snow)` and a second path
   for the shaded underside. Costs markup per element, and the decorative SVG
   needs `aria-hidden="true"`.
3. **SVG as `background-image`.** Works, but an external or data-URI SVG cannot
   read the page's custom properties or `currentColor`, so each theme needs its
   own image. Avoid.

A fourth option, a displacement filter (`filter: url(#...)` with
`feTurbulence` / `feDisplacementMap`) to roughen a plain strip, is supported
syntax ([MDN filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/filter),
Baseline widely available) but MDN gives no performance guidance, and a filter
on a card would rasterise the whole card through the filter. Not recommended
without measuring.

### Contrast in both themes

Computed with the WCAG relative-luminance formula from the tokens in
`tokens.css`:

| Pair | Ratio |
| --- | --- |
| White snow on light page background `#f6f1e8` | 1.13:1 |
| White snow on light card surface (about `#fffbf4`) | 1.03:1 |
| White snow on light border `#d8cfc3` | 1.54:1 |
| White snow on dark page background `#0a0a0a` | 19.80:1 |
| White snow over dark-theme text `#e5e5e5` | 1.26:1 |
| White snow over dark-theme muted text `#9d9d9d` | 2.71:1 |
| White snow over light-theme text `#16130f` | 18.52:1 |

Two consequences:

- **Light theme: white snow is invisible.** The cream background and near-white
  card surface leave nothing to see. The cap has to be defined by a shaded
  underside or outline (a blue-grey around `#6e8296` reaches 3.52:1 on the light
  background) rather than by its fill. Declare the snow fill and the snow shade
  as two `light-dark()` tokens. `box-shadow` cannot follow a mask silhouette;
  use a second layer or `filter: drop-shadow()` on the cap only.
- **Dark theme: snow must never overlap glyphs.** White over `#e5e5e5` text is
  1.26:1, which erases the text. Caps go above the box edge or in padding, never
  across a line of text.

WCAG 2.2 SC 1.4.11 exempts the cap itself: a graphic needs 3:1 only when it is
"required to understand the content", and one that is "for aesthetic purposes
that does not require the user to see or understand it" is exempt
([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).
The obligation runs the other way: the accent must not lower the contrast of
text (SC 1.4.3) or of the card boundary where that boundary carries meaning.

### Forced colors

In forced colors mode with the default `forced-color-adjust: auto`
([CSS Color Adjustment 1, section 3.1](https://drafts.csswg.org/css-color-adjust-1/#forced-colors-properties),
[MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors)):

- `background-color` is forced to the system colour opposite the text colour,
  keeping its alpha, so a mask-plus-background cap turns into a `Canvas`
  coloured shape on a `Canvas` page: it disappears on its own.
- "`box-shadow` and `text-shadow` compute to `none`", so shadow-drawn snow
  disappears.
- "`background-image` computes to `none` unless the original value contains a
  `url()` function", so gradient-drawn snow disappears but a `url()` SVG
  background stays in its authored colours.
- SVG `fill` and `stroke` are forced, and the UA sheet gives `svg` elements
  `forced-color-adjust: preserve-parent-color`, so an inline SVG cap takes the
  text colour: it stays visible as a solid `CanvasText` blob.

MDN's guidance is to avoid a separate forced-colors design and only fix what
breaks. The simplest rule that follows: hide content accents under
`@media (forced-colors: active)` (the file already has such a block for the
theme toggle). Options 1 and 3 above behave differently by default, so an
explicit `display: none` is safer than relying on either.

### Pitfalls specific to this markup

- **Section clipping.** `content-visibility: auto` "turns on layout
  containment, style containment, and paint containment"
  ([MDN content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility)),
  and the spec notes these "persist even if the element is not skipped"
  ([CSS Containment 2](https://www.w3.org/TR/css-contain-2/#using-cv-auto)).
  Under paint containment "the contents of the element including any ink or
  scrollable overflow must be clipped to the overflow clip edge"
  ([CSS Containment 2, paint containment](https://www.w3.org/TR/css-contain-2/#containment-paint)).
  A cap may overflow its card or heading, but not its `.fm-section`. Section
  padding is at least 3.75rem, so caps of a few pixels to a rem are safe; a
  drift spilling from one section into the next is not possible without
  changing the containment.
- **Paint containment also makes each section a stacking context and a
  containing block for fixed and absolute descendants** (same spec section).
  An accent cannot use `position: fixed` or a `z-index` to escape its section.
- **Headings.** A `::before` on the `h2` or `h1` block spans the container
  width and sits at the line box top. Ways to get a cap that hugs the words:
  wrap the text in an inline element and decorate that (for a wrapped heading an
  inline box fragments per line, so the cap lands on the first or last fragment
  unless `box-decoration-break: clone` is set); or place a short fixed-width
  drift at the start of the heading and accept that it does not track the text
  width; or cap only single words chosen in the template. Aligning to the top of
  the capitals needs a font-metric offset (`cap` units or `text-box-trim`);
  support for those against the pinned targets was not checked. Wotfard loads as
  a webfont, so any em-based offset shifts when the fallback swaps out.
- **Hover and reveal.** Caps inside the card inherit its `translateY(-2px)`
  hover and the `.fm-reveal` fade, which is what we want. A cap placed outside
  the element (a sibling) would not.
- **Decoration and assistive tech.** Pseudo-elements with `content: ""` add
  nothing to the accessibility tree; inline SVG caps need `aria-hidden="true"`.
- **Reduced motion.** Still caps are not motion, so they can stay under
  `prefers-reduced-motion: reduce`, matching the map's decision that those
  visitors get content accents only.

### Prior art

No well-documented, maintained implementation of pure CSS/SVG snow caps on
arbitrary page elements turned up; what exists is one-off CodePen demos and CSS
art built on the same primitives (pseudo-elements, radial gradients, SVG
paths). The technique rests on the specs above rather than on a reference
implementation.

## Ambient layer: canvas synced to DOM rects

### How the working examples do it

- **three.js `webgl_multiple_elements` example**
  ([source](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_multiple_elements.html)).
  One canvas, many placeholder elements. Every animation frame it calls
  `element.getBoundingClientRect()` for each placeholder, skips those off
  screen, and sets the viewport and scissor to that rect. The canvas is
  `position: absolute` and every frame it is moved with
  ``canvas.style.transform = `translateY(${window.scrollY}px)` ``.
- **three.js manual, "Multiple Canvases Multiple Scenes"**
  ([page](https://threejs.org/manual/#en/multiple-scenes),
  [source](https://github.com/mrdoob/three.js/blob/dev/manual/pages/multiple-scenes.html))
  explains why. With a `position: fixed` canvas, "if your scenes are
  complicated or if for whatever reason it takes too long to render, the
  position of the scenes drawn into the canvas will lag behind the rest of the
  page." Switching to `position: absolute` plus the `translateY(scrollY)`
  transform is described as "a different method which has a different
  tradeoff": the drawing "will stick with the page as it scrolls even if we're
  too slow to render", and "only the edges of the window will show some
  un-rendered bits for a moment".
- **14islands `r3f-scroll-rig`**
  ([README](https://github.com/14islands/r3f-scroll-rig)), a production library
  for exactly this. It "tracks 'proxy' elements in the normal page flow and
  updates the WebGL scene positions to match them", and states the price: "In
  order to perfectly match WebGL objects and DOM content, the browser scroll
  position needs to be animated on the main thread", which it does with the
  Lenis smooth-scroll library. Its performance tips add: "Consider disabling
  SmoothScrollbar and all scrolling WebGL elements on mobile - it is usually
  laggy."
- **JQuery-Snowfall `collection` option**
  ([repo](https://github.com/loktar00/JQuery-Snowfall), last pushed January
  2019). The one widely used implementation of snow piling up on elements. It
  does not sync one canvas to rects. At start-up it reads
  `getBoundingClientRect()` once per matched element and appends a small 2D
  canvas (default 40px tall) to `body` just above each one; each flake is
  assigned one target canvas, and on reaching it writes a pixel into a
  per-column collision array and `fillRect`s the pile. The rects are never
  re-read: the source binds `resize` only to refresh the window size, so piles
  drift off their elements after any reflow, and elements whose top is within
  40px of the viewport top are skipped. It shows the idea works visually and
  that the bookkeeping is where it breaks.

### Why the lag is structural

Browsers scroll on a different thread from script. Chromium's architecture
notes say the compositor thread "processes input events, performs scrolling and
animations of web content" and that separating it from the main thread is
"critically important for performance isolation of animation and scrolling from
main thread work"
([RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)).
DOM content moves with the compositor; canvas pixels are produced by main-thread
script in `requestAnimationFrame`. Any snow drawn in a fixed canvas at a
position derived from a DOM rect is therefore positioned from a scroll offset
that may be a frame or more old. Flakes in mid-air hide that. A pile that is
supposed to touch a card's top border does not: a one-frame error at a normal
scroll speed is several pixels of visible sliding. The two known fixes are the
manual's absolute-canvas trick (which moves the whole canvas with the page, so
it is no longer a viewport-fixed ambient layer and needs a canvas as tall as the
viewport re-anchored each frame) and main-thread scrolling (r3f-scroll-rig),
which this site should not adopt for a decoration.

### Costs and pitfalls

- **Layout reads.** `getBoundingClientRect()`, `window.scrollY` and friends
  force style and layout if anything is dirty
  ([Paul Irish's list](https://gist.github.com/paulirish/5d52fb081b3570c81e3a):
  "Reflow only has a cost if the document has changed and invalidated the style
  or layout"). Reading rects every frame is cheap on a still page and expensive
  when something is animating, which here means during reveals, hover
  transitions and the theme transition. web.dev's guidance is to "batch your
  style reads and do them first" and warns that layout cost grows with DOM size
  ([web.dev](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)).
- **`content-visibility: auto` defeats cheap measuring.** For an element inside
  a skipped section, a layout read means "the user-agent cannot avoid rendering
  work and has to process any previously skipped rendering work in order to
  return a correct value"
  ([CSS Containment 2, examples](https://www.w3.org/TR/css-contain-2/#cv-examples)).
  Measuring every card on the page at start-up would lay out every section and
  cancel the optimisation. Before a section has rendered, its height is the
  960px estimate, so document-space positions of everything below it are wrong
  until it has been on screen once. Measure only elements in or near the
  viewport, and re-measure when sections render (the
  `contentvisibilityautostatechange` event exists for this, per MDN).
- **Transforms change the rect.** Client rects are computed after applying "the
  transforms that apply to the element and its ancestors"
  ([CSSOM View](https://drafts.csswg.org/cssom-view/#dom-element-getclientrects)).
  A rect read while `.fm-reveal` is mid-transition is up to 16px low; one read
  during card hover is 2px high. An unrevealed element has `opacity: 0` but a
  full-size rect, so flakes would land on nothing.
- **Scroll.** The rect is viewport-relative and its edges "change their values
  every time the scrolling position changes"
  ([MDN getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)).
  Cache in document space (`rect.top + window.scrollY`) and subtract the current
  scroll offset in the render loop, so scrolling costs one `scrollY` read per
  frame instead of one rect per element.
- **Resize and reflow.** Rects go stale on viewport resize, font swap, theme
  change if it moves anything, the writing list arriving with different
  content, and section render. `ResizeObserver` reports size changes of the
  observed element, not position changes caused by something above it, so it
  cannot be the only invalidation signal; a `ResizeObserver` on the page
  container plus `IntersectionObserver` for "near viewport" is the usual
  combination.
- **Device pixels.** DOM rects are in CSS pixels; the drawing buffer is scaled
  by the renderer's pixel ratio, and WebGL's origin is bottom-left (the three.js
  example computes `bottom = canvas.clientHeight - rect.bottom`). Rects can be
  fractional, so a pile edge and a border edge can differ by a device pixel.
- **Theme.** The canvas does not see CSS tokens. Flake colour has to be read
  from the theme and updated on toggle. The contrast table applies here too:
  white flakes are invisible on the light background and, drawn above `main`,
  would cross text at 1.26:1 in the dark theme. A canvas behind `main` (the
  existing `z-index: 1`) can never cover text; card surfaces are opaque in the
  dark theme and 84% opaque in the light theme, so flakes pass behind cards.
- **Forced colors.** Canvas pixels are not adjusted by forced colors mode
  (nothing in the forced-colors property list applies to bitmap content), so
  the ambient layer has to be turned off by script or CSS under
  `forced-colors: active`.
- **Input and assistive tech.** A canvas above content needs
  `pointer-events: none`; either way it needs `aria-hidden="true"`.

### What is reasonable for the ambient layer

- **Default: no DOM awareness.** A viewport-fixed canvas behind `main`, flakes
  falling through the whole viewport. No rects, no sync, nothing to go stale.
  Cards occlude flakes naturally because they paint above the canvas.
- **Optional refinement: flakes end at ledges.** Feed the particle update a
  short list of cached document-space rects for visible cards only, and retire
  or fade a flake when it reaches a top edge. Because the canvas is behind the
  content and nothing is drawn resting on the edge, a stale rect shows as a
  flake vanishing a few pixels early or late, which nobody can see. The resting
  snow itself is the CSS cap. This needs the measuring discipline above and
  should be dropped on phones (the map already calls for a lighter form there).
- **Not recommended: accumulation in the canvas.** It needs frame-exact rect
  sync, per-element pile state that survives resize and reflow, and a fix for
  scroll lag. The prior art either leaves these broken (JQuery-Snowfall) or
  takes over scrolling (r3f-scroll-rig).

If accents should appear to build up, that can be a CSS transition on the cap
(scale or mask position) triggered when the ambient layer starts, still with no
coupling between the two layers.

## Not verified

- Nothing was rendered. Cap appearance, the blue-grey edge colour, and how the
  84%-opaque light card surface looks with flakes behind it are for the winter
  look prototype.
- The white-on-light-surface ratio treats `rgb(255 251 244 / 0.84)` as opaque.
- Forced-colors behaviour comes from the spec and MDN, not from a Windows
  contrast theme. In particular, whether `filter: drop-shadow()` on a cap
  survives forced colors was not checked (the spec list names `box-shadow` and
  `text-shadow` only).
- Support for `text-box-trim` and `cap` units against the pinned browser
  targets was not checked.
- Scroll lag on a fixed canvas is documented by three.js and r3f-scroll-rig and
  explained by Chromium's threading model; it was not measured on this page, and
  Safari and Firefox threading was not sourced separately.
- The HTML-in-canvas proposal (`layoutsubtree`, `drawElementImage`;
  [WICG explainer](https://github.com/WICG/html-in-canvas)) would let WebGL draw
  real DOM content and remove the sync problem, but it is an experimental
  Chromium feature whose current trial status was only seen in secondary
  reports. Not usable here.
- JQuery-Snowfall behaviour is read from its source, not run.
