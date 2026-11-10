// Autumn scene, content accents: fallen leaves resting on letter tops.
//
// The hero name gets three or four leaves and each section heading one or
// two, each at a slight tilt. Which letters carry a leaf is seeded by the
// heading's text, so the placement is the same on every visit.
//
// The heading text is never split or changed: each heading gets one
// aria-hidden overlay holding the leaves, positioned from measurements taken
// in the browser. A leaf never overlaps a glyph. Styles live in accents.css.

const SVG = "http://www.w3.org/2000/svg";
const QUOTES = /^["']|["']$/g;

// How many leaves a heading gets, by template hook: [fewest, most].
const COUNTS = { name: [3, 4], heading: [1, 2] };

// No leaf on tall narrow stems: there is nothing for it to rest on.
const TALL_STEMS = /[bdfhkltijI1]/;
const RESTS_LEAF = /[\p{L}\p{N}&]/u;

// Leaf geometry, as fractions of the heading's font size.
const MIN_INK_WIDTH = 0.3;
const LEAF_WIDTH = 0.34;
const LEAF_WIDTH_VARIATION = 0.08;
// Height to width of a leaf seen lying almost flat.
const LEAF_ASPECT = 0.4;
// Clear space between a leaf and any glyph.
const LEAF_GAP = 0.03;
const MAX_TILT_DEG = 7;
// A leaf keeps this many pixels clear of the viewport's edges, where the
// section box would clip it.
const VIEW_MARGIN = 2;
const TONES = 4;

// Leaf outlines in a 100 x 40 box, lying on their lower edge, each with its
// veins. Drawn by hand: a beech-like lens, a lobed oak leaf and a curled
// teardrop.
const SHAPES = [
  {
    outline: "M4 31C18 15 56 8 96 20C66 34 28 39 4 31Z",
    veins: "M6 31Q48 23 92 20",
  },
  {
    outline:
      "M3 29Q10 21 18 23Q22 14 32 17Q38 9 48 13Q56 7 64 12Q74 9 78 16Q90 15 96 22Q86 28 78 29Q72 36 62 33Q54 38 46 35Q36 38 30 34Q18 37 14 32Q8 34 3 29Z",
    veins: "M5 29Q50 23 92 22",
  },
  {
    outline:
      "M3 33Q14 30 22 24C34 8 72 4 95 15C82 24 70 36 40 37C26 38 14 35 3 33Z",
    veins: "M5 33Q20 30 30 27Q60 18 92 15",
  },
];

const attached = new Map();
let measureContext = null;

// Small seeded generator (Park-Miller), so a heading keeps the same leaves
// every time it is redrawn and on every visit.
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

// Every visible character of the heading where it really sits (wrapping,
// kerning, letter-spacing and zoom included), with the box of its ink.
function measureGlyphs(heading) {
  const font = fontOf(heading);
  measureContext ??= document.createElement("canvas").getContext("2d");
  measureContext.font = font.rendered;
  const fontBox = measureContext.measureText("Hg");
  const ascent = fontBox.fontBoundingBoxAscent;
  const descent = fontBox.fontBoundingBoxDescent;

  const range = document.createRange();
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const glyphs = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (let index = 0; index < node.data.length; index++) {
      const char = node.data[index];
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const [rect] = range.getClientRects();
      if (!rect?.width || !char.trim()) {
        continue;
      }
      const ink = measureContext.measureText(char);
      // The range rect spans the font's ascent and descent, which places
      // the baseline; the ink box then comes from the glyph's own metrics.
      const baseline = rect.top + (rect.height * ascent) / (ascent + descent);
      glyphs.push({
        char,
        left: rect.left - ink.actualBoundingBoxLeft,
        right: rect.left + ink.actualBoundingBoxRight,
        top: baseline - ink.actualBoundingBoxAscent,
        bottom: baseline + ink.actualBoundingBoxDescent,
      });
    }
  }

  return { glyphs, size: font.size };
}

// Letters wide enough at the top to hold a leaf, as indexes into glyphs.
function candidatesIn(glyphs, size) {
  const candidates = [];
  glyphs.forEach((glyph, index) => {
    const isWide = glyph.right - glyph.left >= size * MIN_INK_WIDTH;
    if (isWide && RESTS_LEAF.test(glyph.char) && !TALL_STEMS.test(glyph.char)) {
      candidates.push(index);
    }
  });
  return candidates;
}

// Seeded shuffle: the order in which letters are offered a leaf.
function shuffled(items, random) {
  const order = [...items];
  for (let index = order.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  return order;
}

const overlaps = (first, second) =>
  first.left < second.right &&
  second.left < first.right &&
  first.top < second.bottom &&
  second.top < first.bottom;

// The leaf for one letter, or null when it would touch a glyph or leave the
// viewport. The box it is checked with covers the leaf at its tilt plus the
// clear space, so the drawn leaf stays clear of every glyph.
function leafOn(glyph, rolls, glyphs, size) {
  const [widthRoll, offsetRoll, tiltRoll, shapeRoll, toneRoll] = rolls;
  const inkWidth = glyph.right - glyph.left;
  const width = Math.min(
    size * (LEAF_WIDTH + widthRoll * LEAF_WIDTH_VARIATION),
    inkWidth * 1.05,
  );
  const height = width * LEAF_ASPECT;
  const tilt = (tiltRoll * 2 - 1) * MAX_TILT_DEG;
  const gap = size * LEAF_GAP;
  // Extra extent from the tilt, around the leaf's centre. The leaf is lifted
  // by it, so its lowest tilted corner stays the gap above the letter.
  const turn = Math.abs((tilt * Math.PI) / 180);
  const growX = (width * (Math.cos(turn) - 1) + height * Math.sin(turn)) / 2;
  const growY = (height * (Math.cos(turn) - 1) + width * Math.sin(turn)) / 2;
  const left = glyph.left + (inkWidth - width) * (0.25 + offsetRoll * 0.5);
  const top = glyph.top - gap - growY - height - 0.5;
  const reach = {
    left: left - growX - gap,
    right: left + width + growX + gap,
    top: top - growY - gap,
    bottom: top + height + growY + gap,
  };

  const viewWidth = document.documentElement.clientWidth;
  if (reach.left < VIEW_MARGIN || reach.right > viewWidth - VIEW_MARGIN) {
    return null;
  }
  if (glyphs.some((other) => overlaps(reach, other))) {
    return null;
  }

  return {
    left,
    top,
    width,
    height,
    tilt,
    shape: Math.floor(shapeRoll * SHAPES.length),
    tone: Math.floor(toneRoll * TONES),
  };
}

// Picks this heading's leaves: a seeded count, offered to letters in a
// seeded order, never two on neighbouring letters.
function chooseLeaves(heading, hook) {
  const { glyphs, size } = measureGlyphs(heading);
  const random = createRandom(heading.textContent);
  const [fewest, most] = COUNTS[hook];
  const count = fewest + Math.floor(random() * (most - fewest + 1));
  const leaves = [];
  const taken = [];

  for (const index of shuffled(candidatesIn(glyphs, size), random)) {
    // The same number of random values for every letter, so that one leaf
    // does not depend on whether another found room.
    const rolls = [random(), random(), random(), random(), random()];
    if (leaves.length === count) {
      break;
    }
    if (taken.some((other) => Math.abs(other - index) < 2)) {
      continue;
    }
    const leaf = leafOn(glyphs[index], rolls, glyphs, size);
    if (leaf) {
      leaves.push(leaf);
      taken.push(index);
    }
  }
  return leaves;
}

function createPart(tag, part, d) {
  const element = document.createElementNS(SVG, tag);
  element.dataset.part = part;
  element.setAttribute("d", d);
  return element;
}

function renderLeaf(leaf, origin) {
  const shape = SHAPES[leaf.shape];
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 100 40");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("focusable", "false");
  svg.dataset.tone = String(leaf.tone);
  svg.style.left = `${(leaf.left - origin.left).toFixed(2)}px`;
  svg.style.top = `${(leaf.top - origin.top).toFixed(2)}px`;
  svg.style.width = `${leaf.width.toFixed(2)}px`;
  svg.style.height = `${leaf.height.toFixed(2)}px`;
  svg.style.rotate = `${leaf.tilt.toFixed(1)}deg`;
  svg.append(
    createPart("path", "leaf", shape.outline),
    createPart("path", "veins", shape.veins),
  );
  return svg;
}

function attach(heading, hook) {
  const originalText = heading.textContent;
  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.autumnLeaves = "";

  let isDetached = false;

  const draw = () => {
    // The font may finish loading after the leaves were taken off.
    if (isDetached || !isWebFontLoaded(fontOf(heading), originalText)) {
      return;
    }
    const origin = heading.getBoundingClientRect();
    overlay.replaceChildren(
      ...chooseLeaves(heading, hook).map((leaf) => renderLeaf(leaf, origin)),
    );
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
  // longer mean anything: take the leaves off this heading for good.
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
  // If the font never loads there are no leaves.
  document.fonts.load(fontOf(heading).webFont, originalText).then(draw, () => {
    // The font failed to load: no leaves.
  });

  return detach;
}

export function apply() {
  for (const heading of document.querySelectorAll("[data-scene-accent]")) {
    const hook = heading.dataset.sceneAccent;
    if (COUNTS[hook] && !attached.has(heading)) {
      attached.set(heading, attach(heading, hook));
    }
  }
}

export function remove() {
  for (const detach of attached.values()) {
    detach();
  }
  attached.clear();
}
