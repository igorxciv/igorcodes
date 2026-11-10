// Winter scene, content accents: letter snow.
//
// Snow rests on letter tops in the hero name and the section headings. The
// heading text is never split or changed: each heading gets one aria-hidden
// overlay holding the caps, positioned from measurements taken in the
// browser. Styles live in accents.css.

// Share of eligible letters that get snow, by template hook.
const DENSITY = { name: 1, heading: 0.6 };

// No snow on tall narrow stems; the caps look wrong there.
const TALL_STEMS = /[bdfhkltijI]/;
// Letters with an open top keep it open: snow sits on one stem only.
const OPEN_TOPS = /[uvwyxUVWYXK]/;
const SNOWABLE = /[\p{L}\p{N}&]/u;
const QUOTES = /^["']|["']$/g;

// Cap geometry, as fractions of the heading's font size.
const MIN_INK_WIDTH = 0.08;
const CAP_HEIGHT = 0.085;
const CAP_HEIGHT_VARIATION = 0.05;
// Clear space between a cap and the glyph, so its contour never overlaps the
// letter.
const CAP_GAP = 0.03;
const MAX_TILT_DEG = 3;

const attached = new Map();
let measureContext = null;

// Small seeded generator (Park-Miller), so a heading keeps the same snow
// every time it is redrawn.
function createRandom(text) {
  let state = 1;
  for (const char of text) {
    state = (state * 31 + char.codePointAt(0)) % 2_147_483_647;
  }
  state = state || 1;

  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}

function fontOf(heading) {
  const style = getComputedStyle(heading);
  const family = style.fontFamily.split(",")[0].trim().replace(QUOTES, "");
  return {
    family,
    size: Number.parseFloat(style.fontSize),
    // For document.fonts: the web font alone, no fallbacks.
    webFont: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} "${family}"`,
    // For canvas measurement: exactly what the heading renders with.
    rendered: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
  };
}

// True only once the heading's web font has really loaded. fonts.check()
// alone also passes when no such font-face exists, and fonts.ready resolves
// when loading fails, so neither is proof on its own.
function isWebFontLoaded(font, text) {
  if (!document.fonts.check(font.webFont, text)) {
    return false;
  }
  return Array.from(document.fonts).some(
    (face) =>
      face.status === "loaded" &&
      face.family.replace(QUOTES, "") === font.family,
  );
}

function capFor(char, random) {
  // Draw the same number of random values for every letter, so that snow on
  // one letter does not depend on which other letters were skipped.
  const rolls = [random(), random(), random(), random(), random()];
  if (!SNOWABLE.test(char) || TALL_STEMS.test(char)) {
    return null;
  }
  return { isOpenTop: OPEN_TOPS.test(char), rolls };
}

function measureCap(cap, char, rect, metrics) {
  const { size, ascent, descent } = metrics;
  const ink = measureContext.measureText(char);
  const inkWidth = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
  if (inkWidth <= size * MIN_INK_WIDTH) {
    return null;
  }

  const [, heightRoll, widthRoll, offsetRoll, tiltRoll] = cap.rolls;
  const height = size * (CAP_HEIGHT + heightRoll * CAP_HEIGHT_VARIATION);
  const width = cap.isOpenTop
    ? inkWidth * 0.34
    : inkWidth * (0.62 + widthRoll * 0.3);
  const inkLeft = rect.left - ink.actualBoundingBoxLeft;
  const left = cap.isOpenTop
    ? inkLeft - width * 0.1
    : inkLeft + (inkWidth - width) * (0.3 + offsetRoll * 0.4);
  // The range rect spans the font's ascent and descent, which places the
  // baseline; the ink top then comes from the glyph's own metrics.
  const baseline = rect.top + (rect.height * ascent) / (ascent + descent);
  const inkTop = baseline - ink.actualBoundingBoxAscent;

  return {
    left,
    top: inkTop - height - size * CAP_GAP,
    width,
    height,
    tilt: (tiltRoll * 2 - 1) * MAX_TILT_DEG,
  };
}

// Measures every letter of the heading where it really sits (wrapping,
// kerning, letter-spacing and zoom included) and returns one cap per snowy
// letter, positioned relative to the heading's box.
function measureCaps(heading, density) {
  const font = fontOf(heading);
  measureContext ??= document.createElement("canvas").getContext("2d");
  measureContext.font = font.rendered;
  const fontBox = measureContext.measureText("Hg");
  const metrics = {
    size: font.size,
    ascent: fontBox.fontBoundingBoxAscent,
    descent: fontBox.fontBoundingBoxDescent,
  };

  const origin = heading.getBoundingClientRect();
  const random = createRandom(heading.textContent);
  const range = document.createRange();
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const caps = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (let index = 0; index < node.data.length; index++) {
      const char = node.data[index];
      const cap = capFor(char, random);
      if (!cap || cap.rolls[0] >= density) {
        continue;
      }

      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const [rect] = range.getClientRects();
      const box = rect?.width ? measureCap(cap, char, rect, metrics) : null;
      if (box) {
        caps.push({
          ...box,
          left: box.left - origin.left,
          top: box.top - origin.top,
        });
      }
    }
  }

  return caps;
}

function renderCaps(overlay, caps) {
  overlay.replaceChildren(
    ...caps.map((cap) => {
      const element = document.createElement("span");
      element.style.left = `${cap.left.toFixed(2)}px`;
      element.style.top = `${cap.top.toFixed(2)}px`;
      element.style.width = `${cap.width.toFixed(2)}px`;
      element.style.height = `${cap.height.toFixed(2)}px`;
      element.style.setProperty(
        "--winter-snow-tilt",
        `${cap.tilt.toFixed(1)}deg`,
      );
      return element;
    }),
  );
}

function attach(heading, density) {
  const originalText = heading.textContent;
  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.winterSnow = "";

  let isDetached = false;

  const draw = () => {
    // The font may finish loading after the snow was taken off.
    if (isDetached || !isWebFontLoaded(fontOf(heading), originalText)) {
      return;
    }
    renderCaps(overlay, measureCaps(heading, density));
    if (!overlay.isConnected) {
      heading.append(overlay);
      // Next frame, so the opacity transition has a start state to run from.
      requestAnimationFrame(() => {
        overlay.dataset.settled = "";
      });
    }
  };

  // Redraw whenever the heading's box changes: resize, zoom, text spacing,
  // or the web font swapping in.
  const resizeObserver = new ResizeObserver(draw);
  // If the text itself changes (a translation tool), the measurements no
  // longer mean anything: take the snow off this heading for good.
  const textObserver = new MutationObserver(() => {
    if (heading.textContent !== originalText) {
      detach();
    }
  });

  function detach() {
    isDetached = true;
    resizeObserver.disconnect();
    textObserver.disconnect();
    document.fonts.removeEventListener("loadingdone", draw);
    overlay.remove();
  }

  resizeObserver.observe(heading);
  textObserver.observe(heading, {
    characterData: true,
    childList: true,
    subtree: true,
  });
  document.fonts.addEventListener("loadingdone", draw);
  // If the font never loads there is no letter snow.
  document.fonts.load(fontOf(heading).webFont, originalText).then(draw, () => {
    // The font failed to load: no letter snow.
  });

  return detach;
}

export function apply() {
  for (const heading of document.querySelectorAll("[data-scene-accent]")) {
    const density = DENSITY[heading.dataset.sceneAccent];
    if (density && !attached.has(heading)) {
      attached.set(heading, attach(heading, density));
    }
  }
}

export function remove() {
  for (const detach of attached.values()) {
    detach();
  }
  attached.clear();
}
