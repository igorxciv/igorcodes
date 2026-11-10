// Transfer cap for one scene's ambient layer: its script plus every binary
// file it loads. The same figure applies to every season.
//
// Sizes are brotli at maximum quality, except .glb files, which count at raw
// size because the host may serve them uncompressed. This is a regression
// guard, not a promise: Vercel compresses at a lower quality and may deliver
// roughly 10% more.
import path from "node:path";
import { brotliCompressSync, constants } from "node:zlib";

export const SCENE_TRANSFER_CAP_BYTES = 200_000;

const RAW_EXTENSIONS = new Set([".glb"]);

const brotliSize = (content) =>
  brotliCompressSync(content, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      [constants.BROTLI_PARAM_SIZE_HINT]: content.length,
    },
  }).length;

function transferSize(fileName, content) {
  return RAW_EXTENSIONS.has(path.extname(fileName))
    ? content.length
    : brotliSize(content);
}

const kB = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;

// files: [{ name, content }]. Prints the breakdown and throws over the cap.
export function checkSceneBudget(season, files) {
  const sizes = files.map(({ name, content }) => ({
    name,
    bytes: transferSize(name, content),
  }));
  const total = sizes.reduce((sum, { bytes }) => sum + bytes, 0);

  console.log(
    `scene ${season} ambient layer: ${kB(total)} of ${kB(SCENE_TRANSFER_CAP_BYTES)} (${sizes.map(({ name, bytes }) => `${name} ${kB(bytes)}`).join(", ")})`,
  );

  if (total > SCENE_TRANSFER_CAP_BYTES) {
    throw new Error(
      `[scenes] The ${season} ambient layer transfers ${kB(total)}, over the ${kB(SCENE_TRANSFER_CAP_BYTES)} cap (SCENE_TRANSFER_CAP_BYTES in app/_tools/scene-budget.mjs).`,
    );
  }
}
