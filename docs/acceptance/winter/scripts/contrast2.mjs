// What sits behind hero text: per-pixel lightest (dark theme) or darkest
// (light theme) across frames, text hidden, text boxes outlined in red.
// Also: per box, the share of pixels that break the ratio.
import { chromium } from "playwright";
const [outDir] = process.argv.slice(2);
const BASE = "https://www.igorcodes.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "chrome", headless: false });
const VIEWS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const report = [];
for (const view of ["desktop", "phone"]) {
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext(VIEWS[view]);
    await context.addInitScript((t) => localStorage.setItem("fm-theme", t), theme);
    const page = await context.newPage();
    await page.goto(`${BASE}/?season=winter&occasion=christmas`);
    await page.waitForFunction(() => document.documentElement.dataset.sceneAmbient, null, { timeout: 30000 });
    await sleep(6000);
    const boxes = await page.evaluate(() => {
      const content = document.querySelector(".fm-hero-content");
      const w = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      const out = [];
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.data.trim() || n.parentElement.closest("[data-winter-snow]")) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        const cs = getComputedStyle(n.parentElement);
        out.push({
          text: n.data.trim().slice(0, 30),
          color: cs.color,
          isName: !!n.parentElement.closest('[data-scene-accent="name"]'),
          rects: [...r.getClientRects()].map((q) => [q.x, q.y, q.width, q.height]),
        });
      }
      return out;
    });
    await page.addStyleTag({
      content:
        ".fm-hero-content, .fm-hero-content * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; } [data-winter-snow] { visibility: hidden !important; }",
    });
    const frames = [];
    for (let i = 0; i < 30; i++) {
      frames.push((await page.screenshot()).toString("base64"));
      await sleep(250);
    }
    const dpr = VIEWS[view].deviceScaleFactor;
    const res = await page.evaluate(
      async ({ frames, boxes, dpr, theme }) => {
        const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
        const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const toRGB = (c) => {
          const x = new OffscreenCanvas(1, 1).getContext("2d");
          x.fillStyle = c;
          x.fillRect(0, 0, 1, 1);
          return x.getImageData(0, 0, 1, 1).data;
        };
        let comp = null;
        let W = 0;
        let H = 0;
        const boxStats = boxes.map((b) => {
          const [r, g, bl] = toRGB(b.color);
          return { L: lum(r, g, bl), need: b.isName ? 3 : 4.5, px: 0, bad: 0, badFrames: 0 };
        });
        for (const f of frames) {
          const img = new Image();
          img.src = `data:image/png;base64,${f}`;
          await img.decode();
          W = img.width;
          H = img.height;
          const cv = new OffscreenCanvas(W, H);
          const ctx = cv.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const d = ctx.getImageData(0, 0, W, H).data;
          if (!comp) comp = new Uint8ClampedArray(d);
          else
            for (let p = 0; p < d.length; p += 4) {
              const pick = theme === "dark" ? lum(d[p], d[p + 1], d[p + 2]) > lum(comp[p], comp[p + 1], comp[p + 2]) : lum(d[p], d[p + 1], d[p + 2]) < lum(comp[p], comp[p + 1], comp[p + 2]);
              if (pick) comp.set(d.subarray(p, p + 4), p);
            }
          boxes.forEach((b, i) => {
            let frameBad = 0;
            for (const [x0, y0, w0, h0] of b.rects) {
              const x = Math.max(0, Math.floor(x0 * dpr));
              const y = Math.max(0, Math.floor(y0 * dpr));
              const w = Math.min(W - x, Math.ceil(w0 * dpr));
              const h = Math.min(H - y, Math.ceil(h0 * dpr));
              for (let yy = y; yy < y + h; yy++)
                for (let xx = x; xx < x + w; xx++) {
                  const p = (yy * W + xx) * 4;
                  boxStats[i].px++;
                  if (ratio(boxStats[i].L, lum(d[p], d[p + 1], d[p + 2])) < boxStats[i].need) {
                    boxStats[i].bad++;
                    frameBad++;
                  }
                }
            }
            if (frameBad) boxStats[i].badFrames++;
          });
        }
        // Draw composite with outlines.
        const cv = new OffscreenCanvas(W, H);
        const ctx = cv.getContext("2d");
        ctx.putImageData(new ImageData(comp, W, H), 0, 0);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        for (const b of boxes) for (const [x, y, w, h] of b.rects) ctx.strokeRect(x * dpr, y * dpr, w * dpr, h * dpr);
        const blob = await cv.convertToBlob({ type: "image/png" });
        const buf = new Uint8Array(await blob.arrayBuffer());
        let s = "";
        for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return { png: btoa(s), boxStats };
      },
      { frames, boxes, dpr, theme },
    );
    const { writeFileSync } = await import("node:fs");
    writeFileSync(`${outDir}/behind-text-${view}-${theme}.png`, Buffer.from(res.png, "base64"));
    boxes.forEach((b, i) => {
      const s = res.boxStats[i];
      report.push({ view, theme, text: b.text, need: s.need, badPixelShare: +((s.bad / s.px) * 100).toFixed(3), framesWithBadPixels: `${s.badFrames}/30` });
    });
    await context.close();
  }
}
for (const r of report) console.log(JSON.stringify(r));
await browser.close();
