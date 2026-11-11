// Spring scene, content accents: fallen petals. PROTOTYPE.
//
// A few petals rest on letter tops in the hero name, and about a quarter of
// the eligible letters in the section headings carry one. Drawn the way
// winter's letter snow is (letter measuring copied from winter): the heading
// text is never split or changed, each heading gets one aria-hidden overlay
// holding the petals, and nothing is drawn until the web font is confirmed.
// Styles live in accents.css.

const SVG = "http://www.w3.org/2000/svg";

// How many petals a heading gets, by template hook: a fixed few on the name,
// a share of eligible letters on a heading.
const NAME_PETALS = 4;
const HEADING_SHARE = 0.25;

// A petal needs a top to rest on: no tall narrow stems, no open or pointed
// tops, no dots.
const TALL_STEMS = /[bdfhkltijI1]/;
const OPEN_TOPS = /[uvwyxAVWYXKMN]/;
const RESTABLE = /[\p{L}\p{N}&]/u;
const QUOTES = /^["']|["']$/g;

// Petal geometry, as fractions of the heading's font size. A petal lying on
// a letter is seen nearly edge-on: long and low.
const MIN_INK_WIDTH = 0.2;
const PETAL_WIDTH = 0.25;
const PETAL_WIDTH_VARIATION = 0.06;
const PETAL_ASPECT = 11 / 24;
// Clear space between a petal and the glyph, so its contour never overlaps
// the letter.
const PETAL_GAP = 0.025;
const MAX_TILT_DEG = 9;

// One petal on its side, base at the left, notched tip at the right, with a
// blush of pink at the base. viewBox 0 0 24 10.
const PETAL_PATH =
  "M1.2 6.4C4.6 3.2 11.6 1 18.6 1.3c2.8.1 4.4 1.3 3.6 2.9 1.3.9.9 3-1.8 3.8C14.2 9.9 5.6 9.4 1.2 6.4Z";
const BLUSH_PATH = "M1.2 6.4C4 4 9 3 13 4.4 10.4 7.8 5 8.4 1.2 6.4Z";

const attached = new Map();
let measureContext = null;

// Small seeded generator (Park-Miller), so a heading keeps the same petals
// every time it is redrawn.
function createRandom(text) {
  let state = 7;
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
    webFont: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} "${family}"`,
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

const isRestable = (char) =>
  RESTABLE.test(char) && !TALL_STEMS.test(char) && !OPEN_TOPS.test(char);

// Which letters (by index into the heading's text) carry a petal. Every
// letter draws the same number of random values, so the choice does not
// shift when the text wraps differently.
function choosePetals(text, hook, random) {
  const candidates = [];
  const rolls = new Map();
  Array.from(text).forEach((char, index) => {
    const roll = [random(), random(), random(), random(), random()];
    if (isRestable(char)) {
      candidates.push(index);
      rolls.set(index, roll);
    }
  });

  let chosen;
  if (hook === "name") {
    // A few, spread along the name: one from each stretch of candidates.
    const count = Math.min(NAME_PETALS, candidates.length);
    chosen = Array.from({ length: count }, (_, slot) => {
      const from = Math.floor((slot * candidates.length) / count);
      const to = Math.floor(((slot + 1) * candidates.length) / count);
      const pick =
        from + Math.floor(rolls.get(candidates[from])[0] * (to - from));
      return candidates[Math.min(pick, to - 1)];
    });
  } else {
    chosen = candidates.filter((index) => rolls.get(index)[0] < HEADING_SHARE);
    // Every heading gets at least one.
    if (chosen.length === 0 && candidates.length > 0) {
      chosen = [
        candidates[Math.floor(rolls.get(candidates[0])[1] * candidates.length)],
      ];
    }
  }
  return chosen.map((index) => ({ index, rolls: rolls.get(index) }));
}

function measurePetal(petal, char, rect, metrics) {
  const { size, ascent, descent } = metrics;
  const ink = measureContext.measureText(char);
  const inkWidth = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
  if (inkWidth <= size * MIN_INK_WIDTH) {
    return null;
  }

  const [, widthRoll, offsetRoll, tiltRoll, flipRoll] = petal.rolls;
  const width = size * (PETAL_WIDTH + widthRoll * PETAL_WIDTH_VARIATION);
  const height = width * PETAL_ASPECT;
  const inkLeft = rect.left - ink.actualBoundingBoxLeft;
  // Resting on the top, overhanging an edge at most a little.
  const left = inkLeft + (inkWidth - width) * (0.15 + offsetRoll * 0.7);
  const baseline = rect.top + (rect.height * ascent) / (ascent + descent);
  const inkTop = baseline - ink.actualBoundingBoxAscent;

  return {
    left,
    top: inkTop - height - size * PETAL_GAP,
    width,
    height,
    tilt: (tiltRoll * 2 - 1) * MAX_TILT_DEG,
    flip: flipRoll < 0.5,
  };
}

// Measures every chosen letter where it really sits (wrapping, kerning,
// letter-spacing and zoom included) and returns one petal per letter,
// positioned relative to the heading's box.
function measurePetals(heading, hook) {
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
  const text = heading.textContent;
  const chosen = new Map(
    choosePetals(text, hook, createRandom(text)).map((petal) => [
      petal.index,
      petal,
    ]),
  );
  const range = document.createRange();
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const petals = [];
  let offset = 0;

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    // The overlay holds no text, so offsets match heading.textContent.
    for (let index = 0; index < node.data.length; index++) {
      const petal = chosen.get(offset + index);
      if (!petal) {
        continue;
      }
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const [rect] = range.getClientRects();
      const box = rect?.width
        ? measurePetal(petal, node.data[index], rect, metrics)
        : null;
      if (box) {
        petals.push({
          ...box,
          left: box.left - origin.left,
          top: box.top - origin.top,
        });
      }
    }
    offset += node.data.length;
  }

  return petals;
}

function renderPetals(overlay, petals) {
  overlay.replaceChildren(
    ...petals.map((petal) => {
      const svg = document.createElementNS(SVG, "svg");
      svg.setAttribute("viewBox", "0 0 24 10");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.style.left = `${petal.left.toFixed(2)}px`;
      svg.style.top = `${petal.top.toFixed(2)}px`;
      svg.style.width = `${petal.width.toFixed(2)}px`;
      svg.style.height = `${petal.height.toFixed(2)}px`;
      svg.style.setProperty(
        "--spring-petal-tilt",
        `${petal.tilt.toFixed(1)}deg`,
      );
      svg.style.setProperty("--spring-petal-flip", petal.flip ? "-1" : "1");
      for (const [part, path] of [
        ["petal", PETAL_PATH],
        ["blush", BLUSH_PATH],
      ]) {
        const shape = document.createElementNS(SVG, "path");
        shape.setAttribute("d", path);
        shape.dataset.part = part;
        svg.append(shape);
      }
      return svg;
    }),
  );
}

function attach(heading, hook) {
  const originalText = heading.textContent;
  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.springPetals = "";

  let isDetached = false;

  const draw = () => {
    if (isDetached || !isWebFontLoaded(fontOf(heading), originalText)) {
      return;
    }
    renderPetals(overlay, measurePetals(heading, hook));
    if (!overlay.isConnected) {
      heading.append(overlay);
      requestAnimationFrame(() => {
        overlay.dataset.settled = "";
      });
    }
  };

  const resizeObserver = new ResizeObserver(draw);
  // If the text itself changes (a translation tool), the measurements no
  // longer mean anything: take the petals off this heading for good.
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
  document.fonts.load(fontOf(heading).webFont, originalText).then(draw, () => {
    // The font failed to load: no petals.
  });

  return detach;
}

export function apply() {
  for (const heading of document.querySelectorAll("[data-scene-accent]")) {
    const hook = heading.dataset.sceneAccent;
    if ((hook === "name" || hook === "heading") && !attached.has(heading)) {
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
