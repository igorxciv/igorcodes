// Real Chrome: minimise the window and count WebGL draws while hidden.
import { chromium } from "playwright";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "chrome", headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  window.__draws = 0;
  window.__vis = [];
  document.addEventListener("visibilitychange", () => window.__vis.push(document.visibilityState));
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
await sleep(4000);
const cdp = await context.newCDPSession(page);
const { windowId } = await cdp.send("Browser.getWindowForTarget");
const count = () => page.evaluate(() => window.__draws);
const a = await count();
await sleep(2000);
const visibleDraws = (await count()) - a;
await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "minimized" } });
await sleep(1500);
const state = await page.evaluate(() => document.visibilityState);
const b = await count();
await sleep(3000);
const hiddenDraws = (await count()) - b;
await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "normal" } });
await sleep(1500);
const c = await count();
await sleep(2000);
const againDraws = (await count()) - c;
console.log(JSON.stringify({ visibleDraws2s: visibleDraws, stateWhenMinimised: state, hiddenDraws3s: hiddenDraws, restoredDraws2s: againDraws, events: await page.evaluate(() => window.__vis) }));
await browser.close();
