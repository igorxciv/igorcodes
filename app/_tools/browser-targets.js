// lightningcss browser targets, shared by the production asset build
// (build-assets.mjs) and the inlined critical CSS (_data/criticalCss.js) so
// both sheets are lowered identically. Anything newer than these versions is
// transpiled or prefixed; anything older ships as written.
//
// Pinned to Baseline "widely available" as of late 2026 (browsers released
// around May 2024). Raise it as the Baseline window moves forward.
// lightningcss encodes versions as 0xMMmmpp (major, minor, patch).
const packVersion = (major, minor = 0, patch = 0) =>
  major * 0x1_00_00 + minor * 0x1_00 + patch;

module.exports = {
  chrome: packVersion(125),
  edge: packVersion(125),
  firefox: packVersion(126),
  safari: packVersion(17, 5),
  ios_saf: packVersion(17, 5),
};
