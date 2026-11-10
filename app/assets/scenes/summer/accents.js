// Summer scene, content accents: meadow growth at the foot of the text.
//
// A tuft is a few thin grass blades and an occasional small daisy, growing up
// from the text baseline. The hero name gets one at each end and one in the
// gap between its words; each section heading gets one, at its start or its
// end. Tufts stand only beside text and in word gaps, never across a glyph.
//
// The heading text is never split or changed: each heading gets one
// aria-hidden overlay holding the tufts, positioned from measurements taken
// in the browser. Styles live in accents.css.

const SVG = "http://www.w3.org/2000/svg";
const QUOTES = /^["']|["']$/g;
const SPACE = /\s/;

// Tuft geometry, as fractions of the heading's font size. (Stroke widths
// in accents.css are in pixels.)
const TUFT_WIDTH = 0.36;
const TUFT_HEIGHT = 0.52;
// Clear space between a tuft and the ink of the nearest glyph.
const CLEARANCE = 0.07;
const GAP_CLEARANCE = 0.035;
// A word gap narrower than this, after clearance, gets no tuft.
const MIN_GAP_WIDTH = 0.09;
const BLADE_HALF_WIDTH = 0.017;
const DAISY_RADIUS = 0.062;
const DAISY_PETALS = 8;
// A tuft keeps this many pixels clear of the viewport's edges, where the
// section box would clip it.
const VIEW_MARGIN = 2;

// Which tufts a heading gets, by template hook: a list of tufts, each a
// list of places in order of preference. The first place with room wins.
const PLACES = {
  name: () => [["start"], ["gap"], ["end"]],
  heading: (random) => [random() < 0.5 ? ["start", "end"] : ["end", "start"]],
};
// Share of end tufts that carry a daisy, by template hook. A tuft in a word
// gap is too narrow for one.
const DAISY_SHARE = { name: 0.5, heading: 0.4 };

const attached = new Map();
let measureContext = null;

// Small seeded generator (Park-Miller), so a heading keeps the same tufts
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

// Every visible character of the heading where it really sits (wrapping,
// kerning, letter-spacing and zoom included): the horizontal extent of its
// ink, its line's baseline, and whether a space follows it.
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
  let isAfterSpace = false;

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (let index = 0; index < node.data.length; index++) {
      const char = node.data[index];
      if (SPACE.test(char)) {
        isAfterSpace = glyphs.length > 0;
        continue;
      }

      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const [rect] = range.getClientRects();
      if (!rect?.width) {
        continue;
      }
      const ink = measureContext.measureText(char);
      glyphs.push({
        inkLeft: rect.left - ink.actualBoundingBoxLeft,
        inkRight: rect.left + ink.actualBoundingBoxRight,
        // The range rect spans the font's ascent and descent, which places
        // the baseline.
        baseline: rect.top + (rect.height * ascent) / (ascent + descent),
        startsWord: isAfterSpace,
      });
      isAfterSpace = false;
    }
  }

  return { glyphs, size: font.size };
}

// A box has room when it lies inside the viewport: the sections clip
// anything that overflows them.
function hasRoom(box) {
  return (
    box.left >= VIEW_MARGIN &&
    box.left + box.width <= document.documentElement.clientWidth - VIEW_MARGIN
  );
}

// The box a tuft may draw in: beside the first or last glyph, or inside the
// first word gap whose two words share a line (a name that wraps between
// its words has no such gap). Null when there is no room.
function boxFor(place, glyphs, size) {
  const box = measureBox(place, glyphs, size);
  return box && hasRoom(box) ? box : null;
}

function measureBox(place, glyphs, size) {
  const width = size * TUFT_WIDTH;
  const clearance = size * CLEARANCE;

  if (place === "start") {
    const first = glyphs[0];
    return {
      left: first.inkLeft - clearance - width,
      width,
      baseline: first.baseline,
    };
  }
  if (place === "end") {
    const last = glyphs.at(-1);
    return { left: last.inkRight + clearance, width, baseline: last.baseline };
  }

  const gapClearance = size * GAP_CLEARANCE;
  for (let index = 1; index < glyphs.length; index++) {
    const before = glyphs[index - 1];
    const after = glyphs[index];
    if (!after.startsWord || Math.abs(after.baseline - before.baseline) > 1) {
      continue;
    }
    const left = before.inkRight + gapClearance;
    const gapWidth = after.inkLeft - gapClearance - left;
    return gapWidth >= size * MIN_GAP_WIDTH
      ? { left, width: gapWidth, baseline: before.baseline }
      : null;
  }
  return null;
}

// One blade: a tapered, slightly curved shape from two points on the ground
// to a tip. Coordinates are in the tuft's own box, y down, ground at height.
function bladePath(blade, height) {
  const { foot, halfWidth, tipX, tipY, bow } = blade;
  const midY = (height + tipY) / 2;
  const point = (x, y) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  return [
    `M${point(foot - halfWidth, height)}`,
    `Q${point(foot - halfWidth + bow, midY)} ${point(tipX, tipY)}`,
    `Q${point(foot + halfWidth + bow, midY)} ${point(foot + halfWidth, height)}`,
    "Z",
  ].join("");
}

// Lays out one tuft inside its box. Every blade and the daisy stay within
// the box, so nothing can reach a glyph.
function designTuft(box, size, random, hasDaisy) {
  const { width } = box;
  const height = size * TUFT_HEIGHT;
  const halfWidth = size * BLADE_HALF_WIDTH;
  const inset = halfWidth * 1.2;
  const span = width - inset * 2;
  // About one blade per tenth of an em, between two and five.
  const count = Math.max(2, Math.min(5, Math.round(width / (size * 0.085))));

  const blades = Array.from({ length: count }, (_, index) => {
    const foot =
      inset + (span * (index + 0.5 + (random() - 0.5) * 0.5)) / count;
    const reach = 0.42 + random() * 0.5;
    const lean = (random() - 0.5) * size * 0.2;
    const tipX = Math.max(inset, Math.min(width - inset, foot + lean));
    return {
      foot,
      halfWidth: halfWidth * (0.8 + random() * 0.4),
      tipX,
      tipY: height * (1 - reach),
      bow: (tipX - foot) * 0.25,
      isDeep: random() < 0.45,
    };
  });

  // The daisy's head sits at the top of the box, one pixel in from its
  // edges so that the petal contour is inside too. One roll places the head
  // and turns its petals; it is drawn whether or not there is a daisy, so
  // the blades above do not depend on it.
  let daisy = null;
  const placement = random();
  if (hasDaisy) {
    const reach = size * DAISY_RADIUS + 1;
    const x = reach + placement * (width - reach * 2);
    daisy = {
      x,
      y: reach,
      radius: size * DAISY_RADIUS,
      foot: Math.max(inset, Math.min(width - inset, x + (placement - 0.5) * 4)),
      turn: placement * 360,
    };
  }

  return { blades, daisy, width, height };
}

function createPart(tag, part, attributes) {
  const element = document.createElementNS(SVG, tag);
  element.dataset.part = part;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function renderDaisy(daisy, height) {
  const { x, y, radius, foot, turn } = daisy;
  const parts = [
    createPart("path", "stem", {
      d: `M${foot.toFixed(2)} ${height.toFixed(2)}Q${foot.toFixed(2)} ${(height * 0.5).toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`,
    }),
  ];
  for (let index = 0; index < DAISY_PETALS; index++) {
    parts.push(
      createPart("ellipse", "petal", {
        cx: x.toFixed(2),
        cy: (y - radius * 0.58).toFixed(2),
        rx: (radius * 0.27).toFixed(2),
        ry: (radius * 0.42).toFixed(2),
        transform: `rotate(${(turn + (index * 360) / DAISY_PETALS).toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})`,
      }),
    );
  }
  parts.push(
    createPart("circle", "heart", {
      cx: x.toFixed(2),
      cy: y.toFixed(2),
      r: (radius * 0.34).toFixed(2),
    }),
  );
  return parts;
}

function renderTuft(tuft, box, origin) {
  const { blades, daisy, width, height } = tuft;
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`);
  svg.setAttribute("focusable", "false");
  svg.style.left = `${(box.left - origin.left).toFixed(2)}px`;
  svg.style.top = `${(box.baseline - height - origin.top).toFixed(2)}px`;
  svg.style.width = `${width.toFixed(2)}px`;
  svg.style.height = `${height.toFixed(2)}px`;

  svg.append(
    ...blades.map((blade) =>
      createPart("path", blade.isDeep ? "blade-deep" : "blade", {
        d: bladePath(blade, height),
      }),
    ),
    ...(daisy ? renderDaisy(daisy, height) : []),
  );
  return svg;
}

// Measures the heading and returns its tufts as SVG elements, positioned
// relative to the heading's box.
function drawTufts(heading, hook) {
  const { glyphs, size } = measureGlyphs(heading);
  if (glyphs.length === 0) {
    return [];
  }

  const origin = heading.getBoundingClientRect();
  const random = createRandom(heading.textContent);
  const tufts = [];
  for (const places of PLACES[hook](random)) {
    // Draw the same number of random values for every tuft, so that one
    // tuft does not depend on whether another found room.
    const daisyRoll = random();
    for (const place of places) {
      const box = boxFor(place, glyphs, size);
      if (!box) {
        continue;
      }
      const hasDaisy = place !== "gap" && daisyRoll < DAISY_SHARE[hook];
      const tuftRandom = createRandom(`${heading.textContent}/${place}`);
      tufts.push(
        renderTuft(designTuft(box, size, tuftRandom, hasDaisy), box, origin),
      );
      break;
    }
  }
  return tufts;
}

function attach(heading, hook) {
  const originalText = heading.textContent;
  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.summerTufts = "";

  let isDetached = false;

  const draw = () => {
    // The font may finish loading after the tufts were taken off.
    if (isDetached || !isWebFontLoaded(fontOf(heading), originalText)) {
      return;
    }
    overlay.replaceChildren(...drawTufts(heading, hook));
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
  // longer mean anything: take the tufts off this heading for good.
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
  // If the font never loads there are no tufts.
  document.fonts.load(fontOf(heading).webFont, originalText).then(draw, () => {
    // The font failed to load: no tufts.
  });

  return detach;
}

export function apply() {
  for (const heading of document.querySelectorAll("[data-scene-accent]")) {
    const hook = heading.dataset.sceneAccent;
    if (PLACES[hook] && !attached.has(heading)) {
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
