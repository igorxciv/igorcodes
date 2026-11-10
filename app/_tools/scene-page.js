// What each seasonal scene can show on one page, decided at build time from
// the page's rendered HTML. A page shows either the whole scene or its content
// accents alone: the ambient layer needs the page to offer its slot. A scene
// with nothing to show on the page is left out, so the page treats its season
// like one with no scene: no data-scene, no season control.

// html is the page template's output before minification (the layout's
// content), so attributes are double-quoted as the templates write them. A
// slot placed in the layout itself, outside content, would not be seen.
const pageSlots = (html) =>
  new Set(
    Array.from(
      html.matchAll(/data-scene-slot="([^"]+)"/g),
      (match) => match[1],
    ),
  );

// client: the per-season entries from _data/scenes.js. Returns the entries
// the page's pre-paint script and personal-site.js get.
function scenesForPage(client, html) {
  const slots = pageSlots(html);
  const pageClient = {};

  for (const [season, entry] of Object.entries(client)) {
    if (entry.ambient && slots.has(entry.slot)) {
      pageClient[season] = entry;
    } else if (entry.hasAccents) {
      // No ambient layer here, so the browser never learns its URLs.
      pageClient[season] = { ...entry, slot: null, ambient: null, assets: {} };
    }
  }

  return {
    client: pageClient,
    hasScenes: Object.keys(pageClient).length > 0,
  };
}

module.exports = { scenesForPage };
