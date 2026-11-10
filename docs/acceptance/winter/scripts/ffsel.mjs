// Firefox: heading selection on the plain site vs the scene, and after scrolling.
import { firefox } from "playwright";
const BASE = "https://www.igorcodes.dev";
const browser = await firefox.launch();
const sel = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main h2, main h1")].map((h) => {
      const r = document.createRange();
      r.selectNodeContents(h);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      const t = s.toString();
      s.removeAllRanges();
      return t === h.textContent ? "=" : `DIFF(${JSON.stringify(t)})`;
    }),
  );
for (const url of [`${BASE}/`, `${BASE}/?season=winter`]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url);
  await page.waitForTimeout(3000);
  const top = await sel(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  const bottom = await sel(page);
  // What a real drag-select copy gives on a far heading after it is on screen.
  const h = page.locator("main h2").last();
  await h.scrollIntoViewIfNeeded();
  await h.selectText();
  const dragged = await page.evaluate(() => getSelection().toString());
  console.log(url, { top, bottom, dragged });
  await page.close();
}
await browser.close();
