const assert = require("node:assert/strict");
const { test } = require("node:test");

const { scenesForPage } = require("./scene-page.js");

// Fixtures stand in for real scene folders, so the tests pass with any or
// none of them present.
const winter = {
  slot: "hero",
  hasAccents: true,
  accents: "/assets/scenes/winter/accents.js",
  ambient: "/assets/scenes/winter/ambient.js",
  assets: { "snowman.glb": "/assets/scenes/winter/assets/snowman.glb" },
};

const pageWithSlot =
  '<section id="hero"><div class="fm-scene-slot" data-scene-slot="hero" aria-hidden="true"></div><h1 data-scene-accent="name">Name</h1></section>';
const pageWithoutSlot =
  '<header><h1 data-scene-accent="heading">Page Not Found</h1></header>';

test("a page with the scene's slot gets the whole scene", () => {
  const { client } = scenesForPage({ winter }, pageWithSlot);

  assert.deepEqual(client.winter, {
    slot: "hero",
    hasAccents: true,
    accents: "/assets/scenes/winter/accents.js",
    ambient: "/assets/scenes/winter/ambient.js",
    assets: { "snowman.glb": "/assets/scenes/winter/assets/snowman.glb" },
  });
});

test("a page without the scene's slot gets its content accents alone", () => {
  const { client } = scenesForPage({ winter }, pageWithoutSlot);

  assert.deepEqual(client.winter, {
    slot: null,
    hasAccents: true,
    accents: "/assets/scenes/winter/accents.js",
    ambient: null,
    assets: {},
  });
});

test("a scene with nothing to show on the page is left out, as if its season had none", () => {
  const ambientOnly = { ...winter, hasAccents: false, accents: null };

  const withoutSlot = scenesForPage({ winter: ambientOnly }, pageWithoutSlot);
  assert.deepEqual(withoutSlot, { client: {}, hasScenes: false });

  const withSlot = scenesForPage({ winter: ambientOnly }, pageWithSlot);
  assert.equal(withSlot.hasScenes, true);
  assert.equal(
    withSlot.client.winter.ambient,
    "/assets/scenes/winter/ambient.js",
  );
});
