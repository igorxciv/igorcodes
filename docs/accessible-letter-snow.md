# Accessible techniques for snow on individual letters

Research for [issue #20](https://github.com/igorxciv/igorcodes/issues/20), part
of the map [Seasonal scenes: winter first](https://github.com/igorxciv/igorcodes/issues/11).
Planning research only; no production code. Date: 2026-11-09.

## Question

How can snow be placed on individual letters of a heading without harming
assistive technology or readability?

## Short answer

Do not split the heading. Leave its text node exactly as authored and draw the
snow in one `aria-hidden`, `pointer-events: none` overlay inside the heading.
Position each cap from two numbers per glyph: its horizontal position on the
line and its ink top. Both can come from a table generated at build time from
the font files, and the browser can supply the horizontal positions itself with
`Range.getClientRects()`. Show letter snow only once the web font is confirmed
loaded. Hide it in forced-colors mode.

## How to read this document

Each claim is marked:

- **Verified**: I ran it. Headless Chrome 157 on macOS, driven over the
  DevTools protocol, with the site's real `wotfard-medium-webfont.woff2` and
  fontkit 2.x in a scratch directory outside the repo.
- **Read**: taken from the cited source, not reproduced by me.
- **Not verified**: listed again under [What I could not verify](#what-i-could-not-verify).

No real screen reader, no Firefox or Safari, and no real translation run were
used. Everything about those is **Read** or **Not verified**.

## 1. What splitting a heading into per-letter elements does

The prototype (`letterSnow()` in `app/assets/prototype/winter-prototype.js` on
`prototype/winter-look`) empties the heading, sets `aria-label` to the text,
and rebuilds it as `aria-hidden` word spans containing one
`display: inline-block` span per letter. Each cap is a `::before` on a letter
span.

### Test results (Verified, Chrome 157)

Five `<h1>` variants of the same name, same font and size:

| Variant | Accessible name in Chrome's tree | Children exposed | `window.find("Cheliadinski")` | Copy / `innerText` |
| --- | --- | --- | --- | --- |
| Plain text node | `Igor Cheliadinski` | 1 text node | found | intact |
| Prototype: inline-block letters, `aria-label` + `aria-hidden` | `Igor Cheliadinski` | none | **not found** | intact |
| Inline-block letters, no ARIA | **`I g o r C h e l i a d i n s k i`** | 16 single-letter nodes | **not found** | intact |
| Inline (not inline-block) letter spans, no ARIA | `Igor Cheliadinski` | 17 single-character nodes | found | intact |
| Plain text node + `aria-hidden` absolutely positioned overlay | `Igor Cheliadinski` | 1 text node | found | intact |

What this shows:

- Inline-block letter spans change the heading's computed name to letters
  separated by spaces. The `aria-label` in the prototype is the only thing
  hiding that.
- Text search stops matching the word once each letter is its own inline-block.
  `window.find()` is a non-standard API and may not share every code path with
  the Ctrl/Cmd+F find bar, so treat this as strong evidence, not proof, for the
  find bar itself.
- Selection, copy and `innerText` survived every variant in Chrome.
- Plain inline spans keep the name and search intact, but still expose one
  accessibility node per letter.
- The overlay variant is indistinguishable from the plain heading in every
  measure taken.

Splitting also changes the rendering. Wotfard has a `kern` feature, and kerning
does not apply across inline-block boundaries. Measured with fontkit, kerning
shortens four of the six current headings ("Career Journey", "Selected Work",
"Writing & Notes", "Get in Touch"); the name and "Experiments" have no kerned
pairs. In Chrome, "Writing & Notes" at 40px is 294.2px wide as plain text and
296.3px when split into inline-block letters. So the prototype pattern makes
the winter headings slightly different from the plain-site headings. (Verified.)

### What the specs and guides say (Read)

- `aria-label` on a heading is allowed but discouraged. The ARIA Authoring
  Practices Guide says of roles named from content: "content contained in the
  element and its descendants is hidden from assistive technology users", and
  "It is strongly recommended to avoid using aria-label to override content of
  one of these elements except in rare circumstances where hiding content from
  assistive technology users is beneficial." Its heading entry reads "Warning!
  Using aria-label or aria-labelledby will hide descendant content from
  assistive technologies" and says headings are "Ideally named by visible,
  descendant content."
  [APG: Providing Accessible Names and Descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)
- The same guide: "When a user interface is translated into multiple languages,
  ensure that aria-label values are translated." The HTML standard's list of
  translatable attributes (`alt`, `title`, `placeholder` and so on) does not
  include `aria-label`; it only notes that another spec could add it ("For
  example, ARIA would define the `aria-label` attribute as translatable").
  Whether a given browser's page translation touches `aria-label` is therefore
  tool-specific.
  [HTML: the translate attribute](https://html.spec.whatwg.org/multipage/dom.html#the-translate-attribute)
- GSAP's SplitText, the best-known splitting library, ships the prototype's
  pattern as its default ("adds an aria-label to the parent element and then
  hides the child elements with aria-hidden") and documents its limit: "it
  won't surface the functionality and meaning of nested elements (like links)
  to screen readers." It also says of search engines: "Without these your split
  heading may appear in google search results in it's composite parts", and of
  fonts: "If you split before your web fonts are ready, the layout may shift or
  misalign."
  [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- Secondary sources, not primary and not reproduced here: Axess Lab reports
  that VoiceOver on iOS treats text split across inline elements as separate
  swipe stops ([Text splitting causes screen reader problems](https://axesslab.com/text-splitting/)),
  and a WebKit bug describes VoiceOver splitting words at a span
  ([bug 246524](https://bugs.webkit.org/show_bug.cgi?id=246524)). This is the
  reason plain inline spans are not a safe fix either.

### Translation

Browser translation rewrites the page's text nodes. With the prototype pattern
the visible text is sixteen one-letter nodes, which gives a translator single
letters to work with, while the real string sits in an attribute it may or may
not translate. With an unsplit heading the translator sees the whole phrase.
The cost of the overlay pattern is different: after translation the heading
text is a different string, so caps placed for the original letters are in the
wrong places. The overlay has to be removed or recomputed when the heading's
text changes (a `MutationObserver` on the heading's character data and child
list covers it). (Reasoned from the specs above; not verified against a real
translation run.)

### Markup patterns compared

| Pattern | Screen readers | Find / select / copy | Translation | Rendering |
| --- | --- | --- | --- | --- |
| A. Unsplit text + `aria-hidden` overlay | Unchanged heading | Unchanged | Whole phrase translated; overlay must be dropped or redone | Identical to plain site |
| B. Inline-block letters + `aria-label` (prototype) | Name correct, but APG advises against; nested content hidden | Search breaks in Chrome | Visible text is single letters; label may not translate | Kerning lost |
| C. Inline letter spans, no ARIA | Name correct in Chrome; reports of per-span reading in VoiceOver | Works in Chrome | Single-letter nodes | Kerning likely kept within a run, not verified |
| D. Duplicate: visually hidden real text + `aria-hidden` split copy | Correct | Search hits the hidden copy, selection hits the visible one; copy can yield both | Two copies to keep in step | Kerning lost |

Pattern A is the only one with no known cost to assistive technology, search,
selection or rendering.

## 2. Positioning without splitting the text

Yes, this works, and the numbers line up exactly.

- `Range.getClientRects()` on a one-character range of the heading's text node
  returns that character's box. CSSOM View specifies that for a partially
  selected text node the rectangle covers only "the part that is selected, not
  the whole line box". `Range.getClientRects()` is Baseline widely available
  since July 2015. (Read:
  [CSSOM View, Extensions to the Range interface](https://drafts.csswg.org/cssom-view/#extensions-to-the-range-interface),
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Range/getClientRects).)
- Verified: for "Igor Cheliadinski" at 96px, each one-character range returned
  exactly one rect. Its left edge and width matched the letter's inline-block
  span in the split variant to 0.01px, and matched fontkit's cumulative
  advances to 0.01px.
- The range rect is the font's line box for that character (ascent plus
  descent, 118px tall here for every letter), not the ink. It gives the
  horizontal position and the baseline, not the top of the letter. The ink top
  has to come from the font: either `measureText()` in the browser or a
  build-time table.
- `CanvasRenderingContext2D.measureText()` returns `actualBoundingBoxAscent`,
  "the distance from the horizontal line indicated by the `textBaseline`
  attribute to the top of the bounding rectangle used to render the text", plus
  `actualBoundingBoxLeft` and `actualBoundingBoxRight`. `TextMetrics` is
  Baseline widely available, with MDN's caveat that "some parts of this feature
  may have varying levels of support". (Read:
  [MDN TextMetrics](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics).)
  The prototype already relies on these.
- Range rects follow real layout, so they stay right through line wrapping,
  kerning, `letter-spacing`, text zoom and a fallback font. Canvas measurement
  of single characters does not know about kerning or wrapping. For horizontal
  position, prefer the range.
- The overlay needs a positioned ancestor. A heading that wraps onto two lines
  is handled by the range rects (each character reports its own line), provided
  the overlay is positioned against the heading's box and recomputed on resize
  (`ResizeObserver` on the heading).

The scene contract ([#17](https://github.com/igorxciv/igorcodes/issues/17))
already allows this: `accents.js` adds and removes the overlay, and
`accents.css` styles it under `data-scene`. The template hook
(`data-scene-accent`) stays on the unsplit heading.

## 3. Measuring glyphs at build time

Feasible, and it reproduces the browser's numbers.

- fontkit reads WOFF2 directly. Its README lists "WOFF2" among supported
  formats and documents `font.unitsPerEm`, `font.layout(string)` (glyphs plus
  positions with `xAdvance`), `glyph.advanceWidth`, and `glyph.bbox`, "the
  rectangle that encloses the glyph outline as tightly as possible". (Read:
  [fontkit README](https://github.com/foliojs/fontkit/blob/master/README.md).)
- opentype.js exposes the same data (`Glyph.getBoundingBox()`, `advanceWidth`,
  `font.unitsPerEm`, `getKerningValue`) but does not read WOFF2; its README
  says to decompress the font first with a tool such as wawoff2. That is an
  extra dependency for this site, whose fonts are WOFF2 only. (Read:
  [opentype.js README](https://github.com/opentypejs/opentype.js/blob/master/README.md).)
- Verified with fontkit on the site's files: Wotfard Medium opens (2048 units
  per em, ascent 2017, descent -501, x-height 1026 from glyph tops, `kern`
  present), and Dank Mono Regular opens (1200 units per em). For every letter
  of the name at 96px, `glyph.bbox.maxY / unitsPerEm * 96` equals Chrome's
  `actualBoundingBoxAscent` to 0.01px, `bbox.minX`/`maxX` equal
  `actualBoundingBoxLeft`/`Right`, and `layout()` advances equal the range rect
  widths.
- The table is small. Six headings use about 30 distinct characters. Stored as
  em fractions (ink top, ink left, ink right, advance) it is a few hundred
  bytes, and it contains metrics only, no outlines, so the licensed font data
  is not redistributed in any usable form.
- The tall-stem rule could be derived from the same data instead of the
  prototype's hard-coded letter list (`/[bdfhkltijI]/`): a glyph whose ink top
  is well above the x-height and whose ink is narrow is a tall narrow stem. In
  Wotfard Medium the x-height letters top out at 1026 units, ascenders at 1485,
  capitals at 1434 to 1464. (Verified numbers; the rule itself is a suggestion.)
- Build wiring: the fonts are already in `public/fonts/` by the time assets
  build (`pnpm build` runs `fonts:fetch` first). A scene's build step can read
  them there. Local `pnpm dev` without fonts would need the step to skip
  quietly. fontkit would be a new dev dependency.

### What each approach costs under a fallback font

The site declares `font-display: swap`. MDN: `swap` "gives the font face an
extremely small block period and an infinite swap period", so text paints in
the fallback font first and switches when Wotfard arrives. Only the medium
weight is preloaded. (Read:
[MDN font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display).)

Measured in Chrome on macOS at 96px (Verified):

| Font | Width of the name | Ink top of "o" | Ink top of "C" |
| --- | --- | --- | --- |
| Wotfard Medium | 729.5px | 48.1px | 68.6px |
| system-ui | 684.9px | 50.2px | 68.8px |
| Arial | 709.7px | 50.9px | 69.9px |

So under a fallback, a Wotfard table puts caps about 2 to 3px too low at 96px
(inside the letter, which #13 forbids: snow "must never overlap glyphs") and
drifting sideways by up to 45px by the end of the name if advances also come
from the table.

| Approach | Before the web font loads / if it never loads | After it loads |
| --- | --- | --- |
| Build-time table for everything (ink top and x positions) | Wrong vertically and horizontally. Must be hidden until the font is confirmed. | Exact in Chrome. Ignores wrapping unless line breaks are also modelled. |
| Build-time ink top + runtime `Range` x positions | Horizontal correct for whatever font renders; vertical off by a few px. Still should be hidden until the font is confirmed. | Exact, follows wrapping and kerning. |
| All runtime (`Range` + `measureText`), as the prototype measures | Correct for whatever font renders, if measured after it settles and again on swap. | Exact. Needs canvas text metrics and a re-measure when fonts change. |

Font readiness (Read: [MDN FontFaceSet](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet)):
`document.fonts.ready` is a promise "which resolves once font loading and
layout operations have completed"; `document.fonts.check()` returns "whether a
font is loaded, but doesn't initiate a load when it isn't"; `loadingdone` fires
when a set finishes loading. `ready` resolves when loading settles, including
when it fails, so on its own it does not say Wotfard is in use. The prototype
awaits `ready` and then measures whatever `font-family` resolves to in canvas,
which is right only if canvas and the page agree on the font. A build-time
table needs an explicit `document.fonts.check()` for the heading's weight and
size before any cap is shown, and no letter snow if it returns false.

Fallback metric overrides (`size-adjust`, "all metrics associated with this
font are scaled by the given percentage", Baseline since September 2023, per
[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust))
can bring a fallback's overall width close to Wotfard's but cannot make each
glyph's ink top and advance match. They do not make a Wotfard table valid for
a fallback font.

Per #17, `accents.js` loads "as soon as the site script starts" and letter snow
"may arrive a moment later", so waiting for the font costs nothing the contract
has not already accepted.

## 4. Forced-colors mode

What the platform does (Read:
[CSS Color Adjustment Level 1](https://www.w3.org/TR/css-color-adjust-1/),
[MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)):

- Author colours are replaced from the user's palette: `color`,
  `background-color`, `border-color`, `outline-color`, SVG `fill` and `stroke`
  and others.
- "box-shadow and text-shadow compute to none."
- "background-image computes to none unless the original value contains a
  url() function", so gradients disappear.
- `forced-color-adjust: none` opts an element out; the spec says "Authors
  should only use this value when they are themselves adjusting the colors".
- MDN: the media feature is for "small tweaks to improve usability or
  legibility when the default application of forced colors does not work well",
  and the mode "is often essential for some users to be able to read or use a
  given website".
- `forced-colors` is Baseline widely available since September 2022.

Verified in Chrome with the media feature emulated: a cap styled like the
prototype's (white `background`, `box-shadow` edge) reported computed
`background-color: rgb(0, 0, 0)` and `box-shadow: none`. The white fill is
replaced by the page background colour and the shaded edge is gone, so the cap
is either invisible or, where it touches a letter, a background-coloured notch
in it. Emulation did not visibly repaint the screenshot, so the rendered result
on a real Windows contrast theme is not verified.

The snow is decoration and its meaning is its colour and shading, both of which
forced colours removes. Recommended handling: hide letter snow under
`@media (forced-colors: active)`, as the prototype already does. Do not use
`forced-color-adjust: none` to keep white snow; that puts author colours back
on a page the user asked to recolour. This matches the glossary: content
accents "never reduce readability".

## Recommendation

1. Use pattern A: leave heading text unsplit; `accents.js` adds one
   `aria-hidden` overlay with `pointer-events: none` (and `user-select: none`)
   inside each hooked heading, holding the caps. No `aria-label`, no letter
   spans.
2. Take horizontal positions and the baseline from `Range.getClientRects()` at
   run time. Take each glyph's ink top, ink width and the tall-stem decision
   from a small table generated at build time with fontkit from the files in
   `public/fonts/`. This drops canvas measurement from the client and keeps
   wrapping and kerning correct.
3. Show letter snow only when `document.fonts.check()` confirms the web font
   for that heading; otherwise show none. Recompute on heading resize, and
   remove the overlay if the heading's text changes (translation).
4. Hide letter snow in forced-colors mode.

If adding fontkit and a build step is judged too much for the first build, the
all-runtime variant (`Range` for position, `measureText` for ink top) with the
same overlay markup is an equally accessible fallback; the accessibility result
comes from not splitting the text, not from where the numbers are computed.

## What I could not verify

- Real screen reader output (VoiceOver macOS/iOS, NVDA, JAWS, TalkBack) for any
  pattern. Chrome's accessibility tree is what they are given, not what they
  say. The per-span reading in VoiceOver is from secondary reports.
- The browser find bar itself, and anything in Firefox or Safari.
  `window.find()` in Chrome was the proxy.
- Real page translation (Chrome, Safari, Edge): how it treats single-letter
  nodes, whether it translates `aria-label`, and what DOM it leaves behind.
- Rendered appearance under a real forced-colors theme. Only computed styles
  under Chrome's emulation were checked.
- Whether Chrome, Firefox and Safari agree on `actualBoundingBoxAscent` and on
  rounding of the font ascent. Chrome reported a font ascent of 95px where the
  font's value is 94.55px at 96px, so the baseline can sit up to half a pixel
  from the build-time figure; taking the baseline from the range rect rather
  than from the table avoids depending on this, but cross-browser agreement was
  not checked.
- Only the medium Wotfard weight and the name's glyphs were compared between
  fontkit and the browser. Other weights, Dank Mono in the browser, and
  non-Latin or accented glyphs were not.
- Phones: nothing here was run on a mobile browser.
- Whether the Wotfard and Dank Mono licences permit shipping derived glyph
  metrics. The table holds no outlines, but the licence text was not read.
