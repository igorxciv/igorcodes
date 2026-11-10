// Laptop performance in real Chrome (headed, GPU), plus the second frame-rate
// step-down in slow headless Chromium.
import { chromium } from "playwright";
const BASE = "https://www.igorcodes.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const INIT = () => {
  window.__long = [];
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__long.push([Math.round(e.startTime), Math.round(e.duration)]);
    }).observe({ type: "longtask", buffered: true });
  } catch {}
  window.__frames = 0;
  window.__draws = 0;
  window.__gap = 0;
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    for (const m of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
      const o = C.prototype[m];
      C.prototype[m] = function (...a) {
        window.__draws += 1;
        return o.apply(this, a);
      };
    }
  }
  let last = 0;
  let prev = 0;
  const tick = (now) => {
    if (window.__draws !== last) {
      window.__frames += 1;
      last = window.__draws;
    }
    if (prev && document.visibilityState === "visible") window.__gap = Math.max(window.__gap, now - prev);
    prev = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new MutationObserver(() => {
    const amb = document.documentElement?.dataset.sceneAmbient;
    if (amb && !window.__mountedAt) window.__mountedAt = Math.round(performance.now());
    if (!amb && window.__mountedAt && !window.__removedAt) window.__removedAt = Math.round(performance.now());
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-scene-ambient"] });
};

const fps = async (page, ms) => {
  const a = await page.evaluate(() => [window.__frames, window.__draws]);
  await sleep(ms);
  const b = await page.evaluate(() => [window.__frames, window.__draws]);
  return { fps: +(((b[0] - a[0]) * 1000) / ms).toFixed(1), draws: b[1] - a[1] };
};

const out = {};
{
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  for (const occ of ["", "&occasion=christmas"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await context.addInitScript(INIT);
    const page = await context.newPage();
    let ambientRequestAt = null;
    page.on("request", (r) => {
      if (r.url().includes("scene-winter-ambient")) ambientRequestAt = Date.now();
    });
    const t0 = Date.now();
    await page.goto(`${BASE}/?season=winter${occ}`);
    await page.waitForFunction(() => window.__mountedAt, null, { timeout: 30000 });
    await sleep(6000); // fade-in done
    const r = {};
    r.renderer = await page.evaluate(() => {
      const c = document.querySelector("[data-scene-slot] canvas");
      const gl = c.getContext("webgl2");
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        canvas: `${c.width}x${c.height}`,
        antialias: gl.getContextAttributes().antialias,
        gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "?",
        hz: null,
      };
    });
    r.full10s = await fps(page, 10000);
    r.stillFull = await page.evaluate(
      () => document.querySelector("[data-scene-slot] canvas").getContext("webgl2").getContextAttributes().antialias,
    );
    r.mountedAtMs = await page.evaluate(() => window.__mountedAt);
    r.ambientRequestedAfterMs = ambientRequestAt ? ambientRequestAt - t0 : null;
    r.longTasks = await page.evaluate(() => window.__long);
    r.maxRafGapMs = await page.evaluate(() => Math.round(window.__gap));
    // Background tab: open another tab in front.
    const other = await context.newPage();
    await other.goto("about:blank");
    await other.bringToFront();
    await sleep(800);
    r.hiddenState = await page.evaluate(() => document.visibilityState);
    r.hidden2s = await fps(page, 2000);
    await page.bringToFront();
    await sleep(800);
    r.visibleAgain = await fps(page, 2000);
    out[`laptop chrome${occ ? " christmas" : ""}`] = r;
    await context.close();
  }
  await browser.close();
}
{
  // Slow software GL in headless Chromium stands in for a device too slow
  // for the lighter form.
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  await context.addInitScript(INIT);
  const page = await context.newPage();
  await page.goto(`${BASE}/?season=winter&occasion=christmas`);
  await page.waitForFunction(() => window.__mountedAt, null, { timeout: 30000 });
  const at = await fps(page, 3000);
  await page.waitForFunction(() => window.__removedAt, null, { timeout: 40000 }).catch(() => {});
  out["slow lighter form"] = {
    fpsWhileRunning: at,
    ...(await page.evaluate(() => ({
      mountedAt: window.__mountedAt,
      removedAt: window.__removedAt ?? null,
      canvas: !!document.querySelector("[data-scene-slot] canvas"),
      overlays: document.querySelectorAll("[data-winter-snow]").length,
      control: document.querySelector("[data-season-toggle]").getAttribute("aria-checked"),
      stored: localStorage.getItem("fm-scene"),
    }))),
  };
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
