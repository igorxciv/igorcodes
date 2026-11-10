// Simulated hidden tab: override document.hidden and fire visibilitychange.
import { chromium, firefox, webkit } from "playwright";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    window.__draws = 0;
    for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      for (const m of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
        const o = C.prototype[m];
        C.prototype[m] = function (...a) {
          window.__draws += 1;
          return o.apply(this, a);
        };
      }
    }
  });
  const page = await context.newPage();
  await page.goto("https://www.igorcodes.dev/?season=winter");
  await page.waitForFunction(() => document.documentElement.dataset.sceneAmbient, null, { timeout: 30000 });
  await sleep(3000);
  const count = () => page.evaluate(() => window.__draws);
  const setHidden = (hidden) =>
    page.evaluate((h) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => h });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (h ? "hidden" : "visible") });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  await setHidden(true);
  await sleep(300);
  const b = await count();
  await sleep(2000);
  const hiddenDraws = (await count()) - b;
  await setHidden(false);
  await sleep(500);
  const c = await count();
  await sleep(1000);
  console.log(name, JSON.stringify({ hiddenDraws2s: hiddenDraws, visibleDraws1s: (await count()) - c }));
  await browser.close();
}
