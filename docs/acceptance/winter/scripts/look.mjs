// Look, pine and contrast checks for the winter scene.
// Usage: node look.mjs <look|pine|contrast> <outdir>
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const [mode, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const BASE = process.env.BASE ?? "https://www.igorcodes.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "chrome", headless: false });

const VIEWS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function open(view, theme, url, { routePine } = {}) {
  const context = await browser.newContext(VIEWS[view]);
  await context.addInitScript((t) => localStorage.setItem("fm-theme", t), theme);
  if (routePine) {
    await context.route(/scene-winter-pine-.*\.glb/, (r) =>
      r.fulfill({ body: readFileSync(routePine), contentType: "model/gltf-binary" }),
    );
  }
  const page = await context.newPage();
  await page.goto(url);
  return { context, page };
}

const prodReady = (page) =>
  page
    .waitForFunction(() => document.documentElement.dataset.sceneAmbient, null, { timeout: 25000 })
    .then(() => sleep(5000));

async function sideBySide(file, left, right, labels) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 600 } });
  const b64 = (buf) => `data:image/png;base64,${buf.toString("base64")}`;
  await page.setContent(`<body style="margin:0;background:#888;font:16px sans-serif;display:flex;gap:8px;padding:8px;width:max-content">
    ${[left, right].map((img, i) => `<figure style="margin:0"><figcaption style="color:#fff;padding:4px">${labels[i]}</figcaption><img src="${b64(img)}" style="display:block;max-height:${Math.max(600, 0)}px"></figure>`).join("")}</body>`);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}

if (mode === "look") {
  for (const view of ["desktop", "phone"]) {
    for (const theme of ["dark", "light"]) {
      for (const xmas of [false, true]) {
        const occ = xmas ? "&occasion=christmas" : "";
        const prod = await open(view, theme, `${BASE}/?season=winter${occ}`);
        await prodReady(prod.page);
        const prodShot = await prod.page.screenshot();
        let headShot = null;
        if (!xmas) {
          const h = prod.page.locator('[data-scene-accent="heading"]').first();
          await h.scrollIntoViewIfNeeded();
          await sleep(1500);
          headShot = await h.screenshot();
        }
        await prod.context.close();

        const protoUrl =
          theme === "dark"
            ? `http://localhost:8181/?variant=B2${occ}`
            : `http://localhost:8182/?variant=L1${occ}`;
        const proto = await open(view, theme, protoUrl);
        await sleep(10000);
        const protoShot = await proto.page.screenshot();
        let protoHead = null;
        if (!xmas) {
          const h = proto.page.locator("main h2").first();
          await h.scrollIntoViewIfNeeded();
          await sleep(1500);
          protoHead = await h.screenshot();
        }
        await proto.context.close();

        const tag = `${view}-${theme}${xmas ? "-christmas" : ""}`;
        await sideBySide(`${outDir}/look-${tag}.png`, prodShot, protoShot, [
          `production ${tag}`,
          `prototype ${theme === "dark" ? "winter-look B2" : "winter-light-theme L1"}`,
        ]);
        if (headShot) {
          await sideBySide(`${outDir}/heading-${view}-${theme}.png`, headShot, protoHead, [
            "production heading",
            "prototype heading",
          ]);
        }
        console.log("wrote", tag);
      }
    }
  }
}

if (mode === "pine") {
  const unsimplified = process.env.UNSIMPLIFIED;
  for (const theme of ["dark", "light"]) {
    const shots = [];
    for (const routePine of [null, unsimplified]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
      await context.addInitScript((t) => localStorage.setItem("fm-theme", t), theme);
      if (routePine) {
        await context.route(/scene-winter-pine-.*\.glb/, (r) =>
          r.fulfill({ body: readFileSync(routePine), contentType: "model/gltf-binary" }),
        );
      }
      const page = await context.newPage();
      await page.goto(`${BASE}/?season=winter`);
      await prodReady(page);
      // Hide falling snow is not possible from outside; take the tree areas.
      const left = await page.screenshot({ clip: { x: 0, y: 380, width: 560, height: 520 } });
      const right = await page.screenshot({ clip: { x: 980, y: 380, width: 460, height: 520 } });
      shots.push({ left, right });
      await context.close();
    }
    await sideBySide(`${outDir}/pine-${theme}-left.png`, shots[0].left, shots[1].left, [
      "simplified pine (shipped, 50,600 B)",
      "unsimplified pine (75,812 B)",
    ]);
    await sideBySide(`${outDir}/pine-${theme}-right.png`, shots[0].right, shots[1].right, [
      "simplified pine (shipped)",
      "unsimplified pine",
    ]);
    console.log("wrote pine", theme);
  }
}

if (mode === "contrast") {
  const results = [];
  for (const view of ["desktop", "phone"]) {
    for (const theme of ["dark", "light"]) {
      const { context, page } = await open(view, theme, `${BASE}/?season=winter&occasion=christmas`);
      await prodReady(page);
      // Text boxes of every hero text run, and its colour.
      const boxes = await page.evaluate(() => {
        const content = document.querySelector(".fm-hero-content");
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
        const out = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.data.trim()) continue;
          const el = n.parentElement;
          if (el.closest("[data-winter-snow]")) continue;
          // Skip text sitting on its own background (buttons, pills).
          let owner = el;
          let ownBg = false;
          while (owner && owner !== content) {
            const bg = getComputedStyle(owner).backgroundColor;
            if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") ownBg = true;
            owner = owner.parentElement;
          }
          const range = document.createRange();
          range.selectNodeContents(n);
          const rects = [...range.getClientRects()].map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height }));
          const cs = getComputedStyle(el);
          const isName = !!el.closest('[data-scene-accent="name"]');
          out.push({ text: n.data.trim().slice(0, 40), color: cs.color, size: cs.fontSize, isName, ownBg, rects });
        }
        return out;
      });
      // Hide the text (and the letter snow on it) so only what is behind shows.
      await page.addStyleTag({
        content: ".fm-hero-content, .fm-hero-content * { color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; } [data-winter-snow] { visibility: hidden !important; }",
      });
      const frames = [];
      for (let i = 0; i < 16; i++) {
        frames.push(await page.screenshot({ type: "png" }));
        await sleep(350);
      }
      // Decode the PNGs in the page: lightest and darkest luminance per box.
      const dpr = VIEWS[view].deviceScaleFactor;
      const stats = await page.evaluate(
        async ({ frames, boxes, dpr }) => {
          const lin = (c) => {
            c /= 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          };
          const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
          const result = boxes.map(() => ({ min: 1, max: 0 }));
          for (const f of frames) {
            const img = new Image();
            img.src = `data:image/png;base64,${f}`;
            await img.decode();
            const cv = new OffscreenCanvas(img.width, img.height);
            const ctx = cv.getContext("2d");
            ctx.drawImage(img, 0, 0);
            boxes.forEach((b, i) => {
              for (const r of b.rects) {
                const x = Math.max(0, Math.floor(r.x * dpr));
                const y = Math.max(0, Math.floor(r.y * dpr));
                const w = Math.min(img.width - x, Math.ceil(r.w * dpr));
                const h = Math.min(img.height - y, Math.ceil(r.h * dpr));
                if (w <= 0 || h <= 0) continue;
                const d = ctx.getImageData(x, y, w, h).data;
                for (let p = 0; p < d.length; p += 4) {
                  const L = lum(d[p], d[p + 1], d[p + 2]);
                  if (L < result[i].min) result[i].min = L;
                  if (L > result[i].max) result[i].max = L;
                }
              }
            });
          }
          return result;
        },
        { frames: frames.map((f) => f.toString("base64")), boxes, dpr },
      );
      // Text colour luminance.
      const parsed = await page.evaluate(
        (colors) =>
          colors.map((c) => {
            const cv = new OffscreenCanvas(1, 1);
            const ctx = cv.getContext("2d");
            ctx.fillStyle = c;
            ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data];
          }),
        boxes.map((b) => b.color),
      );
      const lin = (c) => {
        c /= 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      boxes.forEach((b, i) => {
        const [r, g, bl, a] = parsed[i];
        const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
        const worst = Math.min(ratio(L, stats[i].min), ratio(L, stats[i].max));
        const need = b.isName ? 3 : 4.5;
        results.push({
          view,
          theme,
          text: b.text,
          size: b.size,
          ownBg: b.ownBg,
          alpha: a,
          vsDarkest: +ratio(L, stats[i].min).toFixed(2),
          vsLightest: +ratio(L, stats[i].max).toFixed(2),
          need,
          pass: b.ownBg ? "n/a (own background)" : worst >= need,
        });
      });
      await context.close();
    }
  }
  writeFileSync(`${outDir}/contrast.json`, JSON.stringify(results, null, 1));
  for (const r of results) console.log(JSON.stringify(r));
}

await browser.close();
