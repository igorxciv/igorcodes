// Functional acceptance probe for the winter scene, against production.
// Usage: node probe.mjs <chromium|firefox|webkit>
import { chromium, firefox, webkit } from "playwright";

const engines = { chromium, firefox, webkit };
const name = process.argv[2];
const BASE = process.env.BASE ?? "https://www.igorcodes.dev";
const PREVIEW = `${BASE}/?season=winter&occasion=christmas`;
const out = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs before every page script: CSP violations, "did a scene ever show",
// and a WebGL frame counter (a frame = a rAF tick that issued draw calls).
const INIT = () => {
  window.__csp = [];
  document.addEventListener("securitypolicyviolation", (e) =>
    window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
  );
  window.__sceneEver = false;
  window.__snowEver = false;
  new MutationObserver(() => {
    if (document.documentElement?.dataset.scene) window.__sceneEver = true;
    if (document.querySelector("[data-winter-snow]")) window.__snowEver = true;
  }).observe(document, { attributes: true, childList: true, subtree: true });
  window.__draws = 0;
  window.__frames = 0;
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue;
    for (const m of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
      const orig = C.prototype[m];
      if (!orig) continue;
      C.prototype[m] = function (...args) {
        window.__draws += 1;
        return orig.apply(this, args);
      };
    }
  }
  let last = 0;
  const tick = () => {
    if (window.__draws !== last) {
      window.__frames += 1;
      last = window.__draws;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const state = (page) =>
  page.evaluate(() => {
    const t = document.querySelector("[data-season-toggle]");
    const c = document.querySelector("[data-scene-slot] canvas");
    let gl = null;
    if (c) {
      const ctx = c.getContext("webgl2") || c.getContext("webgl");
      gl = ctx ? ctx.getContextAttributes() : null;
    }
    let stored = null;
    try {
      stored = localStorage.getItem("fm-scene");
    } catch {}
    return {
      scene: document.documentElement.dataset.scene ?? null,
      occasions: document.documentElement.dataset.occasions ?? null,
      ambient: document.documentElement.dataset.sceneAmbient ?? null,
      control: t ? (t.hidden ? "absent" : t.getAttribute("aria-checked")) : "none",
      busy: t?.hasAttribute("data-busy") ?? false,
      overlays: document.querySelectorAll("[data-winter-snow]").length,
      canvas: c ? `${c.width}x${c.height} opacity=${getComputedStyle(c).opacity}` : null,
      antialias: gl?.antialias ?? null,
      stored,
      csp: window.__csp,
    };
  });

const framesIn = async (page, ms = 1000) => {
  const a = await page.evaluate(() => [window.__frames, window.__draws]);
  await sleep(ms);
  const b = await page.evaluate(() => [window.__frames, window.__draws]);
  return { fps: ((b[0] - a[0]) * 1000) / ms, drawsPerSec: ((b[1] - a[1]) * 1000) / ms };
};

const waitAmbient = (page, ms = 20000) =>
  page
    .waitForFunction(() => document.documentElement.dataset.sceneAmbient, null, { timeout: ms })
    .then(() => true, () => false);

async function withPage(opts, fn) {
  const browser = await engines[name].launch(opts.launch ?? {});
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts.context });
  await context.addInitScript(INIT);
  if (opts.init) await context.addInitScript(opts.init);
  const page = await context.newPage();
  const errors = [];
  const ambientRequests = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text().slice(0, 160)}`));
  page.on("request", (r) => r.url().includes("scene-winter-ambient") && ambientRequests.push(r.url()));
  try {
    return await fn(page, { errors, ambientRequests, context });
  } finally {
    await browser.close();
  }
}

const step = async (label, fn) => {
  try {
    out[label] = await fn();
  } catch (e) {
    out[label] = { error: e.message.split("\n")[0] };
  }
};

await step("preview and toggle", () =>
  withPage({}, async (page, { errors }) => {
    const r = {};
    await page.goto(PREVIEW);
    await sleep(800);
    r.atLoad = await state(page);
    r.ambientMounted = await waitAmbient(page);
    await sleep(4000); // past the fade-in
    r.mounted = await state(page);
    r.drawing = await framesIn(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(600);
    r.heroOffscreen = await framesIn(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(600);
    r.heroBack = await framesIn(page);

    // Selection and find on headings with letter snow.
    r.headings = await page.evaluate(() =>
      [...document.querySelectorAll("[data-scene-accent]")].map((h) => {
        const range = document.createRange();
        range.selectNodeContents(h);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        const selected = sel.toString();
        sel.removeAllRanges();
        const text = h.textContent;
        return { text, selected, snow: !!h.querySelector("[data-winter-snow]") };
      }),
    );
    r.find = await page.evaluate(() => {
      const h = document.querySelector('[data-scene-accent="heading"]');
      const word = h.textContent.trim().split(/\s+/)[0];
      getSelection().removeAllRanges();
      return { word, found: typeof window.find === "function" ? window.find(word) : "no window.find" };
    });
    r.aria = await page.locator("main").ariaSnapshot();
    r.switchByRole = await page.getByRole("switch", { name: "Seasonal scene" }).count();

    // Translation: change one heading's text; its snow should go.
    r.translation = await page.evaluate(async () => {
      const h = document.querySelector('[data-scene-accent="heading"]');
      const before = !!h.querySelector("[data-winter-snow]");
      const tn = [...h.childNodes].find((n) => n.nodeType === 3 && n.data.trim());
      tn.data = "Übersetzter Abschnitt";
      await new Promise((r) => setTimeout(r, 500));
      return { before, after: !!h.querySelector("[data-winter-snow]") };
    });

    // Switch off, then on again.
    await page.click("[data-season-toggle]");
    await sleep(300);
    r.off = await state(page);
    await page.click("[data-season-toggle]");
    await sleep(100);
    r.onImmediately = await state(page);
    r.onRemounted = await waitAmbient(page, 15000);
    await sleep(500);
    r.on = await state(page);
    r.errors = errors;
    return r;
  }),
);

await step("preview stores nothing", () =>
  withPage({}, async (page) => {
    await page.goto(PREVIEW);
    await sleep(1500);
    const preview = await state(page);
    await page.goto(`${BASE}/`);
    await sleep(1500);
    const plain = await state(page);
    return { preview: { scene: preview.scene, stored: preview.stored }, plainNext: plain };
  }),
);

await step("plain site aria", () =>
  withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    await sleep(1000);
    return { aria: await page.locator("main").ariaSnapshot() };
  }),
);

await step("stored off: no flash", () =>
  withPage({ init: () => localStorage.setItem("fm-scene", "off") }, async (page, { ambientRequests }) => {
    await page.goto(PREVIEW);
    await sleep(6000);
    const s = await state(page);
    const ever = await page.evaluate(() => ({ sceneEver: window.__sceneEver, snowEver: window.__snowEver }));
    return { ...s, ...ever, ambientRequests: ambientRequests.length };
  }),
);

await step("three.js blocked", () =>
  withPage({}, async (page, { errors, context }) => {
    await context.route(/scene-winter-ambient-.*\.js/, (r) => r.abort());
    await page.goto(PREVIEW);
    await sleep(12000);
    return { ...(await state(page)), errors };
  }),
);

const noWebGL = {
  chromium: { args: ["--disable-webgl", "--disable-3d-apis"] },
  firefox: { firefoxUserPrefs: { "webgl.disabled": true } },
  webkit: null,
}[name];
if (noWebGL) {
  await step("WebGL disabled", () =>
    withPage({ launch: noWebGL }, async (page, { errors, ambientRequests }) => {
      await page.goto(PREVIEW);
      await sleep(12000);
      return { ...(await state(page)), ambientRequests: ambientRequests.length, errors };
    }),
  );
}

await step("reduced motion", () =>
  withPage({ context: { reducedMotion: "reduce" } }, async (page, { ambientRequests }) => {
    await page.goto(PREVIEW);
    await sleep(10000);
    return { ...(await state(page)), ambientRequests: ambientRequests.length };
  }),
);

await step("forced colours (emulated)", () =>
  withPage({ context: { forcedColors: "active" } }, async (page, { ambientRequests }) => {
    await page.goto(PREVIEW);
    await sleep(6000);
    const matches = await page.evaluate(() => matchMedia("(forced-colors: active)").matches);
    return { emulated: matches, ...(await state(page)), ambientRequests: ambientRequests.length };
  }),
);

const phone =
  name === "firefox"
    ? { viewport: { width: 390, height: 844 }, hasTouch: true }
    : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 };
await step("phone: lighter form", () =>
  withPage({ context: phone }, async (page, { errors }) => {
    await page.goto(PREVIEW);
    const mounted = await waitAmbient(page);
    await sleep(4000);
    return { mounted, ...(await state(page)), drawing: await framesIn(page, 2000), errors };
  }),
);

console.log(JSON.stringify({ engine: name, ...out }, null, 1));
