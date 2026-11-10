// Heading letter snow with margin: production vs prototype, both themes.
import { chromium } from "playwright";
const out = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "chrome", headless: false });
const shots = [];
for (const theme of ["dark", "light"]) {
  for (const [label, url] of [
    ["production", "https://www.igorcodes.dev/?season=winter"],
    ["prototype", theme === "dark" ? "http://localhost:8181/?variant=B2" : "http://localhost:8182/?variant=L1"],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await ctx.addInitScript((t) => localStorage.setItem("fm-theme", t), theme);
    const page = await ctx.newPage();
    await page.goto(url);
    await sleep(4000);
    const h = page.locator("main h2").nth(1);
    await h.scrollIntoViewIfNeeded();
    await sleep(2500);
    const b = await h.boundingBox();
    const buf = await page.screenshot({ clip: { x: b.x - 20, y: b.y - 30, width: Math.min(b.width, 700) + 40, height: b.height + 50 } });
    shots.push({ label: `${label} ${theme}`, buf });
    await ctx.close();
  }
}
const page = await browser.newPage({ viewport: { width: 1600, height: 400 } });
await page.setContent(
  `<body style="margin:0;background:#888;font:14px sans-serif;display:grid;grid-template-columns:auto auto;gap:8px;padding:8px;width:max-content">${shots
    .map((s) => `<figure style="margin:0"><figcaption style="color:#fff">${s.label}</figcaption><img style="width:740px" src="data:image/png;base64,${s.buf.toString("base64")}"></figure>`)
    .join("")}</body>`,
);
await page.screenshot({ path: `${out}/headings-with-margin.png`, fullPage: true });
await browser.close();
