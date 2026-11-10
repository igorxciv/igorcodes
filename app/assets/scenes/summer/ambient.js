// Summer scene, ambient layer: an evening meadow along the bottom of the hero.
// Tall grass and wildflowers sway on a slow breeze, with fireflies above them
// at night (dark theme) and dandelion seeds on the breeze by day (light
// theme). The grass leans away from the pointer.
//
// The site decides when this loads and passes a context: theme, current
// occasions, the lighter-form flag and asset URLs. Summer has no occasions and
// no asset files: everything here is drawn by shaders. Everything inside the
// host element is owned here, including the fade-in and pausing while nothing
// can be seen.
import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";

const FOV = 30;
const CAMERA_Y = 1;
const CAMERA_Z = 12;
// Pitch up, so the far edge of the meadow sits about a tenth up the hero.
const CAMERA_PITCH = 0.182;
const HALF_FOV_TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const FADE_IN = "opacity 2.8s cubic-bezier(0.3, 0, 0.2, 1)";
// Frames to draw before the fade-in starts, so shaders are ready and the
// scene never pops in.
const FRAMES_BEFORE_FADE = 3;

// The meadow runs from just in front of the hero's bottom edge back to here.
const NEAR_Z = 1.2;
const FAR_Z = -14;
// Stalks reach a little past both edges, as a fraction of the half-width.
const OVERHANG = 1.12;
const BLADE_SEGMENTS = 4;
// Half-width, in CSS pixels, of the dip in the grass around the hero's
// scroll-down link.
const CLEARING_PX = 34;

// Height of the grass under the hero copy, where there is room for it, and
// the least it shrinks to where there is not.
const LOW_GRASS = 0.52;
const MIN_LOW_GRASS = 0.1;
// The tallest grass, at the left and right edges: on a narrow hero and on a
// wide one.
const TALL_GRASS = [0.8, 2.5];
// Where the grass starts to rise towards the edges, as a fraction of the
// half-width: on a narrow hero and on a wide one.
const EDGE_START = [0.7, 0.42];
// How high a firefly or seed can float: this many times the height of the
// grass under it, plus its own wander and glow. Matches the particle shaders.
const FLOAT_LIFT = 1.45;
const FLOAT_RISE = 0.3;
// Clear space kept between the scene and the hero copy: below it as a
// fraction of the hero's height, beside it as a fraction of the half-width.
const COPY_MARGIN_BELOW = 0.02;
const COPY_MARGIN_BESIDE = 0.08;

const MAX_BLADES = 9000;
const MAX_FLOWERS = 70;
const MAX_FIREFLIES = 46;
const MAX_SEEDS = 40;
// The lighter form keeps this share of every count.
const LIGHTER_SHARE = 0.4;
const share = (count) => Math.round(count * LIGHTER_SHARE);

// The full form and the lighter form: same composition, lower cost. Neither
// has a shadow map; depth comes from shading each blade darker at its root.
const FORMS = {
  full: {
    pixelRatio: 2,
    blades: MAX_BLADES,
    flowers: MAX_FLOWERS,
    fireflies: MAX_FIREFLIES,
    seeds: MAX_SEEDS,
    bladeWidth: 1,
    fps: 60,
  },
  lighter: {
    pixelRatio: 1.5,
    blades: share(MAX_BLADES),
    flowers: share(MAX_FLOWERS),
    fireflies: share(MAX_FIREFLIES),
    seeds: share(MAX_SEEDS),
    // Fewer blades, each a little wider, so the band still reads as grass.
    bladeWidth: 1.3,
    fps: 30,
  },
};

// Per-theme look: one meadow at two times of day. Dark is night under cool
// moonlight, with fireflies. Light is day under a warm sun, with dandelion
// seeds. The page background is never painted over.
const THEMES = {
  dark: {
    isNight: true,
    grassRoot: "#07160d",
    grassTip: "#3d7d4f",
    grassTint: "#2c6a5e",
    grassSheen: "#b5dcf0",
    sheen: 0.3,
    haze: 0.5,
    petal: "#b9c8e6",
    petalContour: "#5d6f96",
    petalContourAmount: 0.35,
    heart: "#b99a3a",
    bloom: 0.62,
    firefly: "#d9ff66",
  },
  light: {
    isNight: false,
    grassRoot: "#3f6a1f",
    grassTip: "#93bb3c",
    grassTint: "#c2c046",
    grassSheen: "#fff3a8",
    sheen: 0.34,
    haze: 0.24,
    petal: "#ffffff",
    petalContour: "#8f95a8",
    petalContourAmount: 0.85,
    heart: "#f0b400",
    bloom: 1,
    fluff: "#75694f",
    fluffCore: "#ffffff",
    husk: "#5f4526",
  },
};

const nextTask = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

// Park-Miller generator: the same meadow on every visit.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}

const CSS_COLOR =
  /(?:rgba?|color)\(\s*(?:srgb\s+)?([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/;

// Resolves a page colour token (theme-dependent, light-dark()) to the colour
// it has right now, so the scene follows the site's tokens.
function readPageColor(host, token, target) {
  host.style.color = `var(${token})`;
  const resolved = getComputedStyle(host).color;
  host.style.color = "";

  const match = CSS_COLOR.exec(resolved);
  if (match) {
    const scale = resolved.startsWith("color(") ? 1 : 255;
    target.setRGB(
      match[1] / scale,
      match[2] / scale,
      match[3] / scale,
      SRGBColorSpace,
    );
  }
  return target;
}

// ---------------------------------------------------------------- shaders

// Shared by every shader: where a stalk stands, how tall it is, and where
// any point along it is right now. Grass blades, flower stems and flower
// heads all go through stalkPoint(), so a head always sits on its stem.
const MEADOW_GLSL = `
  uniform float uTime;
  // Half-width of the view per unit of distance from the camera.
  uniform float uSpan;
  uniform float uAspect;
  // Height of the tallest grass, at the edges of the hero.
  uniform float uTall;
  // Height of the grass under the hero copy.
  uniform float uLow;
  // Where the grass starts to rise towards the edges, as a fraction of the
  // half-width.
  uniform float uEdge;
  uniform float uClearing;
  // Pointer in clip space (x, y) and how strongly it is felt (z).
  uniform vec3 uPointer;

  const float CAMERA_Z = ${CAMERA_Z.toFixed(1)};

  // Low under the hero copy, tall towards the left and right edges, with a
  // small dip around the scroll-down link.
  float meadowTop(float u) {
    float edge = smoothstep(uEdge, 1.0, abs(u));
    float clearing = mix(0.62, 1.0, smoothstep(uClearing * 0.4, uClearing * 1.7, abs(u)));
    return mix(uLow, uTall, edge * sqrt(edge)) * clearing;
  }

  float stalkHeight(float u, float roll) {
    return meadowTop(u) * mix(0.5, 1.0, roll);
  }

  // How far a point is from the pointer on screen: 1 on it, 0 far away.
  // "away" comes back pointing from the pointer to the point.
  float pointerNearness(vec3 world, out vec2 away) {
    vec4 clip = projectionMatrix * viewMatrix * vec4(world, 1.0);
    away = (clip.xy / clip.w - uPointer.xy) * vec2(uAspect, 1.0);
    return exp(-dot(away, away) / 0.03) * uPointer.z;
  }

  // World position of the point a fraction t up the stalk rooted at
  // (u, z): u is a fraction of the half-width at that depth.
  vec3 stalkPoint(vec2 uz, float height, float seed, float t) {
    float x = uz.x * uSpan * (CAMERA_Z - uz.y);
    vec3 root = vec3(x, 0.0, uz.y);

    // Each stalk leans its own way.
    float turn = seed * 6.2832;
    vec2 bend = vec2(cos(turn), sin(turn) * 0.4) * 0.16;

    // A slow breeze travelling across the meadow, plus one gust front that
    // every stalk shares and that passes about every fifteen seconds.
    float breeze = 0.6 * sin(x * 0.55 - uTime * 0.9 + uz.y * 0.4)
      + 0.4 * sin(x * 1.6 - uTime * 1.7 + seed * 6.0);
    float gust = pow(max(0.0, sin(x * 0.1 - uTime * 0.42 + sin(uTime * 0.05) * 3.0)), 8.0);
    bend.x += 0.05 + breeze * 0.07 + gust * 0.3;
    bend.y += breeze * 0.02;

    // Lean away from the pointer.
    vec2 away;
    float near = pointerNearness(root + vec3(0.0, height * 0.7, 0.0), away);
    bend.x += away.x / (abs(away.x) + 0.04) * near * 0.5;

    float reach = min(length(bend), 0.8);
    bend = normalize(bend + vec2(0.00001)) * reach;
    float curve = t * t * height;
    return root + vec3(
      bend.x * curve,
      height * t * (1.0 - 0.3 * reach * reach * t),
      bend.y * curve);
  }`;

const STALK_VERTEX_SHADER = `
  ${MEADOW_GLSL}
  // u, z, height roll, seed
  attribute vec4 aStalk;
  // 0 for a grass blade, 1 for a flower stem
  attribute float aStem;
  uniform float uWidth;
  varying float vT;
  varying float vSide;
  varying float vSeed;
  varying float vFar;
  varying float vStem;
  void main() {
    float t = position.y;
    float height = stalkHeight(aStalk.x, aStalk.z);
    vec3 p = stalkPoint(aStalk.xy, height, aStalk.w, t);
    float blade = (0.022 + 0.02 * height) * mix(0.7, 1.3, fract(aStalk.w * 7.31));
    float width = mix(blade, 0.013, aStem) * uWidth;
    // A blade tapers to a point; a stem stays thin all the way up.
    p.x += position.x * width * (1.0 - pow(t, 1.7) * mix(1.0, 0.4, aStem));
    vT = t;
    vSide = position.x + 0.5;
    vSeed = aStalk.w;
    vStem = aStem;
    vFar = smoothstep(${NEAR_Z.toFixed(1)}, ${FAR_Z.toFixed(1)}, aStalk.y);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }`;

const STALK_FRAGMENT_SHADER = `
  uniform vec3 uRoot;
  uniform vec3 uTip;
  uniform vec3 uTint;
  uniform vec3 uSheen;
  uniform float uSheenAmount;
  uniform vec3 uBackground;
  uniform float uHaze;
  varying float vT;
  varying float vSide;
  varying float vSeed;
  varying float vFar;
  varying float vStem;
  void main() {
    // Darker at the root, which is what gives the band its depth.
    float rise = smoothstep(0.0, 1.0, vT);
    vec3 tip = mix(uTip, uTint, fract(vSeed * 13.7) * 0.5);
    vec3 col = mix(uRoot, tip, rise * mix(1.0, 0.7, vStem));
    // One edge of each blade catches the light.
    col += uSheen * smoothstep(0.55, 1.0, vSide) * rise * uSheenAmount * (1.0 - vStem);
    // Far grass fades towards the page background, and every root sinks
    // into it, so the band has no hard lower edge.
    col = mix(col, uBackground, vFar * uHaze);
    col = mix(uBackground, col, 0.58 + 0.42 * smoothstep(0.0, 0.25, vT));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

const FLOWER_VERTEX_SHADER = `
  ${MEADOW_GLSL}
  attribute vec4 aStalk;
  // 0 for a daisy, 1 for a bloom in the site accent colour
  attribute float aBloom;
  varying vec2 vUv;
  varying float vBloom;
  varying float vSeed;
  varying float vFar;
  void main() {
    float height = stalkHeight(aStalk.x, aStalk.z);
    vec3 p = stalkPoint(aStalk.xy, height, aStalk.w, 1.0);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    float size = mix(0.11, 0.17, fract(aStalk.w * 5.7));
    float tilt = (aStalk.w - 0.5) * 0.9;
    mat2 turn = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt));
    // Slightly squashed, as a head seen from a little below.
    mv.xy += turn * (position.xy * vec2(1.0, 0.84)) * size;
    // In front of its own stem.
    mv.z += 0.03;
    vUv = position.xy * 2.0;
    vBloom = aBloom;
    vSeed = aStalk.w;
    vFar = smoothstep(${NEAR_Z.toFixed(1)}, ${FAR_Z.toFixed(1)}, aStalk.y);
    gl_Position = projectionMatrix * mv;
  }`;

const FLOWER_FRAGMENT_SHADER = `
  uniform vec3 uPetal;
  uniform vec3 uPetalContour;
  uniform float uPetalContourAmount;
  uniform vec3 uHeart;
  uniform vec3 uAccent;
  uniform float uBloomLight;
  uniform vec3 uBackground;
  uniform float uHaze;
  varying vec2 vUv;
  varying float vBloom;
  varying float vSeed;
  varying float vFar;
  void main() {
    float r = length(vUv);
    float a = atan(vUv.y, vUv.x) + vSeed * 6.2832;
    // A daisy has many narrow petals; an accent bloom has five round ones.
    float petals = mix(6.0, 2.5, vBloom);
    float lobe = pow(abs(cos(a * petals)), mix(0.5, 0.32, vBloom));
    float edge = mix(mix(0.5, 0.42, vBloom), 0.95, lobe);
    float alpha = smoothstep(edge, edge - 0.1, r);
    if (alpha < 0.01) discard;

    float rim = smoothstep(edge - 0.3, edge - 0.04, r);
    vec3 daisy = mix(uPetal, uPetalContour, rim * uPetalContourAmount);
    vec3 bloom = uAccent * uBloomLight * mix(1.0, 0.72, rim);
    vec3 col = mix(daisy, bloom, vBloom);
    // The heart of the flower.
    float heart = smoothstep(0.3, 0.22, r);
    col = mix(col, mix(uHeart, uPetal, vBloom * 0.75), heart);

    col = mix(col, uBackground, vFar * uHaze * 0.8);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }`;

// Where an airborne particle floats: over the grass at its own spot, so
// particles stay in the grass band under the copy and rise only at the sides.
const FLOAT_GLSL = `
  vec3 floatPoint(float u, float z, float lift) {
    return vec3(u * uSpan * (CAMERA_Z - z), meadowTop(u) * lift + 0.08, z);
  }

  // Moves a view-space point sideways, away from the pointer. Never upwards:
  // a particle must not be pushed towards the copy.
  void driftAside(inout vec4 mv, vec3 world) {
    vec2 away;
    float near = pointerNearness(world, away);
    mv.x += away.x / (abs(away.x) + 0.04) * near * 0.5;
  }`;

const FIREFLY_VERTEX_SHADER = `
  ${MEADOW_GLSL}
  ${FLOAT_GLSL}
  attribute vec4 aSeed;
  varying vec2 vUv;
  varying float vGlow;
  void main() {
    // More of them towards the edges, where there is room above the grass.
    float u = aSeed.x * 2.0 - 1.0;
    u = sign(u) * pow(abs(u), 0.6) * 1.05;
    float z = mix(-10.0, 0.4, aSeed.z);
    vec3 p = floatPoint(u, z, mix(0.45, ${FLOAT_LIFT.toFixed(2)}, aSeed.y));
    // Each wanders slowly around its own spot.
    float pace = uTime * mix(0.22, 0.45, aSeed.w);
    p += vec3(
      sin(pace + aSeed.y * 40.0) + 0.6 * sin(pace * 2.3 + aSeed.x * 17.0),
      sin(pace * 1.7 + aSeed.z * 29.0),
      cos(pace * 1.3 + aSeed.w * 11.0)) * vec3(0.45, 0.14, 0.4);

    // Each fades in and out on its own cycle of 3.2 to 7 seconds, out of
    // step with the others. A smooth swell, never a blink.
    float cycle = mix(3.2, 7.0, fract(aSeed.w * 9.7));
    float swell = 0.5 + 0.5 * sin(uTime * 6.2832 / cycle + aSeed.x * 31.0);
    vGlow = swell * swell;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    driftAside(mv, p);
    mv.xy += position.xy * 0.5;
    vUv = position.xy * 2.0;
    gl_Position = projectionMatrix * mv;
  }`;

const FIREFLY_FRAGMENT_SHADER = `
  uniform vec3 uGlow;
  varying vec2 vUv;
  varying float vGlow;
  void main() {
    float d = dot(vUv, vUv);
    // A small bright body in a wide soft halo.
    float light = exp(-d * 90.0) + 0.3 * exp(-d * 9.0);
    light *= vGlow * smoothstep(1.0, 0.6, d);
    if (light < 0.003) discard;
    gl_FragColor = vec4(uGlow, light);
    #include <colorspace_fragment>
  }`;

const SEED_VERTEX_SHADER = `
  ${MEADOW_GLSL}
  ${FLOAT_GLSL}
  attribute vec4 aSeed;
  varying vec2 vUv;
  varying float vFade;
  varying float vSeed;
  void main() {
    // Carried slowly across the hero on the breeze, wrapping around past
    // the edges.
    float reach = 2.5;
    float u = mod(aSeed.x * reach + uTime * mix(0.012, 0.03, aSeed.w), reach) - reach * 0.5;
    float z = mix(-9.0, 0.4, aSeed.z);
    vec3 p = floatPoint(u, z, mix(0.45, 1.3, aSeed.y));
    float pace = uTime * mix(0.3, 0.6, aSeed.w);
    p.y += 0.12 * sin(pace + aSeed.y * 37.0) + 0.05 * sin(pace * 2.7 + aSeed.x * 13.0);
    p.z += 0.3 * cos(pace * 0.8 + aSeed.z * 19.0);

    vec4 mv = viewMatrix * vec4(p, 1.0);
    driftAside(mv, p);
    // A seed hangs under its fluff and rocks as it goes.
    float rock = 0.3 + 0.3 * sin(pace * 1.4 + aSeed.w * 23.0);
    mat2 turn = mat2(cos(rock), -sin(rock), sin(rock), cos(rock));
    mv.xy += turn * position.xy * mix(0.2, 0.3, fract(aSeed.w * 3.3));
    vUv = position.xy * 2.0;
    vSeed = aSeed.w;
    vFade = smoothstep(reach * 0.5, reach * 0.5 - 0.15, abs(u));
    gl_Position = projectionMatrix * mv;
  }`;

const SEED_FRAGMENT_SHADER = `
  uniform vec3 uFluff;
  uniform vec3 uFluffCore;
  uniform vec3 uHusk;
  varying vec2 vUv;
  varying float vFade;
  varying float vSeed;
  void main() {
    // The fluff: fine filaments fanning up and out from one point.
    vec2 fromHub = vUv - vec2(0.0, 0.3);
    float r = length(fromHub);
    float a = atan(fromHub.y, fromHub.x);
    float filaments = pow(abs(cos(a * 8.0 + vSeed * 6.0)), 14.0);
    float fan = smoothstep(-0.55, 0.1, fromHub.y / max(r, 0.001));
    float within = smoothstep(0.62, 0.5, r);
    float fluff = within * fan * (filaments * 0.75 * smoothstep(0.03, 0.12, r) + 0.14);
    float core = smoothstep(0.16, 0.0, r);

    // The stalk and the seed hanging under it.
    float below = step(vUv.y, 0.3) * step(-0.72, vUv.y);
    float stalk = below * smoothstep(0.035, 0.012, abs(vUv.x));
    vec2 fromHusk = (vUv - vec2(0.0, -0.76)) / vec2(0.07, 0.17);
    float husk = smoothstep(1.0, 0.6, length(fromHusk));

    float alpha = max(max(fluff, core * 0.8), max(stalk * 0.8, husk)) * vFade;
    if (alpha < 0.01) discard;
    vec3 col = mix(uFluff, uFluffCore, core);
    col = mix(col, uHusk, max(stalk, husk));
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }`;

// ---------------------------------------------------------------- stage

function createStage(host, isLighter) {
  // Ask for the context here so that a browser without WebGL fails quietly:
  // three.js would log errors to the console on its own attempt.
  const canvas = document.createElement("canvas");
  const contextAttributes = {
    alpha: true,
    antialias: !isLighter,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
  };
  const context = canvas.getContext("webgl2", contextAttributes);
  if (!context) {
    throw new Error("WebGL 2 is unavailable");
  }
  const renderer = new WebGLRenderer({ canvas, context, ...contextAttributes });

  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    display: "block",
    inlineSize: "100%",
    blockSize: "100%",
    opacity: "0",
    transition: FADE_IN,
    // The bottom dissolves into the next section.
    maskImage: "linear-gradient(to bottom, #000 93%, transparent)",
  });

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80);
  camera.position.set(0, CAMERA_Y, CAMERA_Z);
  camera.lookAt(0, CAMERA_Y + CAMERA_Z * CAMERA_PITCH, 0);

  return { host, copy: findCopy(host), renderer, canvas, scene, camera };
}

// ---------------------------------------------------------------- meadow

// A stalk's instance data: [u, z, height roll, seed].
function scatterStalk(random, target, index) {
  // Half the stalks are spread evenly; the rest crowd towards the edges.
  const side = random() < 0.5 ? -1 : 1;
  const roll = random();
  const u =
    random() < 0.5
      ? side * roll * OVERHANG
      : side * (OVERHANG - 0.72 * roll * roll);
  target[index * 4] = u;
  target[index * 4 + 1] = MathUtils.lerp(FAR_Z, NEAR_Z, random());
  target[index * 4 + 2] = random();
  target[index * 4 + 3] = random();
}

// Instanced stalks, each a narrow strip bent in the vertex shader: one draw
// call for the grass and one for the flower stems.
function createStalks(material, stalks, isStem) {
  const count = stalks.length / 4;
  const strip = new PlaneGeometry(1, 1, 1, BLADE_SEGMENTS).translate(0, 0.5, 0);
  const geometry = new InstancedBufferGeometry().copy(strip);
  strip.dispose();
  geometry.setAttribute("aStalk", new InstancedBufferAttribute(stalks, 4));
  geometry.setAttribute(
    "aStem",
    new InstancedBufferAttribute(new Float32Array(count).fill(isStem), 1),
  );
  geometry.instanceCount = count;

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

function createMeadow(shared) {
  const random = createRandom(11);

  const blades = new Float32Array(MAX_BLADES * 4);
  for (let index = 0; index < MAX_BLADES; index++) {
    scatterStalk(random, blades, index);
  }

  // Flowers stand in the nearer part of the meadow, about as tall as the
  // grass around them. One in four is an accent bloom; the rest are daisies.
  const flowers = new Float32Array(MAX_FLOWERS * 4);
  const blooms = new Float32Array(MAX_FLOWERS);
  for (let index = 0; index < MAX_FLOWERS; index++) {
    scatterStalk(random, flowers, index);
    flowers[index * 4 + 1] = MathUtils.lerp(-8, NEAR_Z - 0.6, random());
    flowers[index * 4 + 2] = MathUtils.lerp(0.8, 1, random());
    blooms[index] = index % 4 === 3 ? 1 : 0;
  }

  const stalkMaterial = new ShaderMaterial({
    uniforms: {
      ...shared,
      uWidth: { value: 1 },
      uRoot: { value: new Color() },
      uTip: { value: new Color() },
      uTint: { value: new Color() },
      uSheen: { value: new Color() },
      uSheenAmount: { value: 0 },
    },
    vertexShader: STALK_VERTEX_SHADER,
    fragmentShader: STALK_FRAGMENT_SHADER,
  });

  const grass = createStalks(stalkMaterial, blades, 0);
  const stems = createStalks(stalkMaterial, flowers, 1);

  const headGeometry = new InstancedBufferGeometry().copy(
    new PlaneGeometry(1, 1),
  );
  headGeometry.setAttribute("aStalk", new InstancedBufferAttribute(flowers, 4));
  headGeometry.setAttribute("aBloom", new InstancedBufferAttribute(blooms, 1));
  const headMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...shared,
      uPetal: { value: new Color() },
      uPetalContour: { value: new Color() },
      uPetalContourAmount: { value: 0 },
      uHeart: { value: new Color() },
      uAccent: { value: new Color() },
      uBloomLight: { value: 1 },
    },
    vertexShader: FLOWER_VERTEX_SHADER,
    fragmentShader: FLOWER_FRAGMENT_SHADER,
  });
  const heads = new Mesh(headGeometry, headMaterial);
  heads.frustumCulled = false;
  heads.renderOrder = 1;

  const applyTheme = (look, accent) => {
    const stalk = stalkMaterial.uniforms;
    stalk.uRoot.value.set(look.grassRoot);
    stalk.uTip.value.set(look.grassTip);
    stalk.uTint.value.set(look.grassTint);
    stalk.uSheen.value.set(look.grassSheen);
    stalk.uSheenAmount.value = look.sheen;

    const head = headMaterial.uniforms;
    head.uPetal.value.set(look.petal);
    head.uPetalContour.value.set(look.petalContour);
    head.uPetalContourAmount.value = look.petalContourAmount;
    head.uHeart.value.set(look.heart);
    head.uAccent.value.copy(accent);
    head.uBloomLight.value = look.bloom;
  };

  const applyForm = (form) => {
    grass.geometry.instanceCount = form.blades;
    stems.geometry.instanceCount = form.flowers;
    headGeometry.instanceCount = form.flowers;
    stalkMaterial.uniforms.uWidth.value = form.bladeWidth;
  };

  return { meshes: [grass, stems, heads], applyTheme, applyForm };
}

// ---------------------------------------------------------------- particles

// One instanced-quad mesh, one draw call, animated in the vertex shader.
function createParticles(count, seed, material) {
  const random = createRandom(seed);
  const geometry = new InstancedBufferGeometry().copy(new PlaneGeometry(1, 1));
  const seeds = new Float32Array(count * 4);
  for (let index = 0; index < seeds.length; index++) {
    seeds[index] = random();
  }
  geometry.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 4));

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return mesh;
}

function createFireflies(shared) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...shared, uGlow: { value: new Color() } },
    vertexShader: FIREFLY_VERTEX_SHADER,
    fragmentShader: FIREFLY_FRAGMENT_SHADER,
  });
  return createParticles(MAX_FIREFLIES, 23, material);
}

function createSeeds(shared) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...shared,
      uFluff: { value: new Color() },
      uFluffCore: { value: new Color() },
      uHusk: { value: new Color() },
    },
    vertexShader: SEED_VERTEX_SHADER,
    fragmentShader: SEED_FRAGMENT_SHADER,
  });
  return createParticles(MAX_SEEDS, 37, material);
}

// ---------------------------------------------------------------- scene

function buildWorld(stage) {
  // One set of uniform objects, shared by every material.
  const shared = {
    uTime: { value: 0 },
    uSpan: { value: HALF_FOV_TAN },
    uAspect: { value: 1 },
    uTall: { value: 2 },
    uLow: { value: LOW_GRASS },
    uEdge: { value: 0.5 },
    uClearing: { value: 0.05 },
    uPointer: { value: new Vector3() },
    uBackground: { value: new Color() },
    uHaze: { value: 0.6 },
  };

  const meadow = createMeadow(shared);
  const fireflies = createFireflies(shared);
  const seeds = createSeeds(shared);
  stage.scene.add(...meadow.meshes, fireflies, seeds);

  return { shared, meadow, fireflies, seeds, accent: new Color() };
}

function applyTheme(stage, world, theme) {
  const look = THEMES[theme] ?? THEMES.dark;
  const { shared, meadow, fireflies, seeds, accent } = world;

  // Haze in the page background colour; accent blooms in the site accent.
  readPageColor(stage.host, "--fm-bg", shared.uBackground.value);
  readPageColor(stage.host, "--fm-accent", accent);
  shared.uHaze.value = look.haze;
  meadow.applyTheme(look, accent);

  // Night has fireflies; day has dandelion seeds.
  fireflies.visible = look.isNight;
  seeds.visible = !look.isNight;
  if (look.isNight) {
    fireflies.material.uniforms.uGlow.value.set(look.firefly);
  } else {
    const fluff = seeds.material.uniforms;
    fluff.uFluff.value.set(look.fluff);
    fluff.uFluffCore.value.set(look.fluffCore);
    fluff.uHusk.value.set(look.husk);
  }
}

function applyForm(world, form) {
  world.meadow.applyForm(form);
  world.fireflies.geometry.instanceCount = form.fireflies;
  world.seeds.geometry.instanceCount = form.seeds;
}

// How far up the hero, as a fraction of its height, a point at height y
// above the ground at depth z is drawn.
function heightOnScreen(y, z) {
  const slope = (y - CAMERA_Y) / (CAMERA_Z - z);
  // The slope as seen from the pitched view axis.
  const tangent = (slope - CAMERA_PITCH) / (1 + slope * CAMERA_PITCH);
  return (tangent / HALF_FOV_TAN + 1) / 2;
}

// The largest value in [from, to] that fits, for a test that passes below
// some threshold and fails above it.
function largestFitting(from, to, fits) {
  let low = from;
  let high = to;
  for (let step = 0; step < 16; step++) {
    const middle = (low + high) / 2;
    if (fits(middle)) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return low;
}

// The tallest grass that stays under a ceiling on screen, together with
// anything floating over it, wherever in the meadow it stands.
function grassHeightUnder(ceiling) {
  const fits = (height) => {
    const top = height * FLOAT_LIFT + FLOAT_RISE;
    return (
      Math.max(heightOnScreen(top, NEAR_Z), heightOnScreen(top, FAR_Z)) <=
      ceiling
    );
  };
  return fits(0) ? largestFitting(0, 4, fits) : 0;
}

// The same curve as meadowTop() in the shaders, without the clearing.
function meadowTop(u, { low, tall, edge }) {
  const rise = MathUtils.smoothstep(Math.abs(u), edge, 1);
  return MathUtils.lerp(low, tall, rise * Math.sqrt(rise));
}

// The hero's copy block: the child of the hero that holds the name. Found
// through the season-neutral name hook, not through any content class.
function findCopy(host) {
  const hero = host.parentElement;
  let block = hero?.querySelector('[data-scene-accent="name"]') ?? null;
  while (block && block.parentElement !== hero) {
    block = block.parentElement;
  }
  return block;
}

// The free space around the copy: below it as a fraction of the hero's
// height, and how far it reaches sideways as a fraction of the half-width.
function measureCopy(stage, width, height) {
  if (!stage.copy) {
    return { below: 1, halfWidth: 0 };
  }
  const hostBox = stage.host.getBoundingClientRect();
  const box = stage.copy.getBoundingClientRect();
  const centre = hostBox.left + width / 2;
  return {
    below: (hostBox.bottom - box.bottom) / height,
    halfWidth: Math.max(centre - box.left, box.right - centre) / (width / 2),
  };
}

// The shape of the meadow for this hero. On a wide hero the grass climbs
// high at the left and right edges; on a narrow one there are no free sides,
// so the whole band stays low. In every case the grass, and anything
// floating over it, stays below and beside the copy, never behind it.
function shapeMeadow(aspect, copy) {
  const sides = MathUtils.smoothstep(aspect, 0.75, 1.6);
  const allowed = grassHeightUnder(copy.below - COPY_MARGIN_BELOW);
  const shape = {
    low: MathUtils.clamp(allowed, MIN_LOW_GRASS, LOW_GRASS),
    tall: MathUtils.lerp(...TALL_GRASS, sides),
    edge: MathUtils.lerp(...EDGE_START, sides),
  };

  // Under the outer edge of the copy the grass must still fit below it. If
  // it does not, start the rise further out; if the copy spans the whole
  // hero, there are no sides to rise in.
  const copyEdge = Math.min(copy.halfWidth + COPY_MARGIN_BESIDE, 1);
  const fits = (edge) => meadowTop(copyEdge, { ...shape, edge }) <= allowed;
  if (!fits(shape.edge)) {
    const furthest = 0.98;
    if (fits(furthest)) {
      // "Fits" holds for far-out starts, so search from the far end inwards.
      shape.edge =
        furthest -
        largestFitting(0, furthest - shape.edge, (inwards) =>
          fits(furthest - inwards),
        );
    } else {
      shape.edge = furthest;
      shape.tall = Math.max(shape.low, Math.min(shape.tall, allowed));
    }
  }
  return shape;
}

// Fits the meadow to the host and to the hero copy.
function layOut(stage, world) {
  const { host, renderer, camera } = stage;
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) {
    return;
  }

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const shape = shapeMeadow(camera.aspect, measureCopy(stage, width, height));
  const { shared } = world;
  shared.uSpan.value = HALF_FOV_TAN * camera.aspect;
  shared.uAspect.value = camera.aspect;
  shared.uLow.value = shape.low;
  shared.uTall.value = shape.tall;
  shared.uEdge.value = shape.edge;
  shared.uClearing.value = CLEARING_PX / (width / 2);
}

function disposeScene(scene) {
  scene.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });
}

// Tracks the pointer over the hero. The host itself takes no pointer events,
// so a click or text selection is never intercepted.
function trackPointer(stage) {
  // Where the pointer is, in the canvas's clip space, and whether it is over
  // the hero at all.
  const pointer = { x: 0, y: 0, isOver: false };
  const hero = stage.host.parentElement;
  if (!hero) {
    return {
      pointer,
      stop: () => {
        // Nothing was attached.
      },
    };
  }

  const onMove = (event) => {
    const box = stage.host.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
    pointer.y = 1 - ((event.clientY - box.top) / box.height) * 2;
    pointer.isOver = true;
  };
  const onLeave = () => {
    pointer.isOver = false;
  };
  hero.addEventListener("pointermove", onMove, { passive: true });
  hero.addEventListener("pointerleave", onLeave, { passive: true });
  return {
    pointer,
    stop: () => {
      pointer.isOver = false;
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    },
  };
}

// The lighter form has no pointer response on touch devices.
const respondsToPointer = (isLighter) =>
  !(isLighter && window.matchMedia("(pointer: coarse)").matches);

export async function mount(host, context) {
  let isLighter = Boolean(context.lighter);
  let theme = context.theme;
  let form = isLighter ? FORMS.lighter : FORMS.full;

  // Throws when WebGL is unavailable; the site treats that as a silent miss.
  const stage = createStage(host, isLighter);
  const { renderer, canvas, scene, camera } = stage;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, form.pixelRatio));

  let world = null;
  try {
    world = buildWorld(stage);
    await nextTask();
    applyForm(world, form);
    host.append(canvas);
    layOut(stage, world);
    // Compile shaders without blocking scrolling or taps. Fireflies and
    // seeds both, so that a later theme change does not stall on a compile.
    world.fireflies.visible = true;
    world.seeds.visible = true;
    await renderer.compileAsync(scene, camera);
    applyTheme(stage, world, theme);
  } catch (error) {
    canvas.remove();
    disposeScene(scene);
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }

  const tracking = respondsToPointer(isLighter) ? trackPointer(stage) : null;
  const clock = { time: 0, delta: 0 };
  let frameRequest = null;
  let lastFrame = 0;
  let frameSlot = 0;
  let framesDrawn = 0;
  let isInView = true;
  let isContextLost = false;
  let isDestroyed = false;

  // Eases the pointer the shaders see towards the real one, and its pull
  // towards nothing once the pointer leaves the hero.
  const followPointer = () => {
    const felt = world.shared.uPointer.value;
    const pointer = tracking?.pointer;
    const ease = 1 - 0.9 ** (clock.delta * 60);
    if (pointer?.isOver) {
      // Jump to a pointer that has only just arrived; the pull still eases.
      const isNew = felt.z < 0.01;
      felt.x = isNew ? pointer.x : felt.x + (pointer.x - felt.x) * ease;
      felt.y = isNew ? pointer.y : felt.y + (pointer.y - felt.y) * ease;
    }
    felt.z += ((pointer?.isOver ? 1 : 0) - felt.z) * ease * 0.5;
  };

  const draw = (now) => {
    frameRequest = requestAnimationFrame(draw);
    // Never above the form's frame rate, whatever the display runs at.
    // Frames are drawn in slots one interval apart; carrying the remainder
    // forward keeps a 75 or 90 Hz display at the cap instead of at half its
    // own rate.
    const interval = 1000 / form.fps;
    const sinceSlot = now - frameSlot;
    if (sinceSlot < interval - 1) {
      return;
    }
    const remainder = sinceSlot % interval;
    frameSlot = now - (remainder > interval - 1 ? 0 : remainder);

    const elapsed = now - lastFrame;
    lastFrame = now;
    clock.delta = Math.min(elapsed, 100) / 1000;
    clock.time += clock.delta;

    world.shared.uTime.value = clock.time;
    followPointer();
    renderer.render(scene, camera);

    framesDrawn += 1;
    if (framesDrawn === FRAMES_BEFORE_FADE) {
      canvas.style.opacity = "1";
    }
  };

  // No frames are drawn while the tab is hidden or the hero is out of view.
  const syncLoop = () => {
    const shouldRun =
      !isDestroyed && !isContextLost && isInView && !document.hidden;
    if (shouldRun && frameRequest === null) {
      lastFrame = performance.now() - 1000 / form.fps;
      frameSlot = lastFrame;
      frameRequest = requestAnimationFrame(draw);
    } else if (!shouldRun && frameRequest !== null) {
      cancelAnimationFrame(frameRequest);
      frameRequest = null;
    }
  };

  const resizeObserver = new ResizeObserver(() => layOut(stage, world));
  const viewObserver = new IntersectionObserver((entries) => {
    isInView = entries.at(-1).isIntersecting;
    syncLoop();
  });
  // A lost graphics context ends the scene quietly. The site hears the
  // same event on the host and removes the layer.
  const onContextLost = (event) => {
    event.preventDefault();
    isContextLost = true;
    canvas.style.opacity = "0";
    syncLoop();
  };

  resizeObserver.observe(host);
  if (stage.copy) {
    // The copy can change size without the hero doing so: a font swapping in.
    resizeObserver.observe(stage.copy);
  }
  viewObserver.observe(host);
  document.addEventListener("visibilitychange", syncLoop);
  canvas.addEventListener("webglcontextlost", onContextLost);
  syncLoop();

  return {
    update(next) {
      if (isDestroyed) {
        return;
      }
      if (next.theme !== theme) {
        theme = next.theme;
        applyTheme(stage, world, theme);
      }
      // A running full-form scene steps down to the lighter form.
      // Antialiasing is fixed when the WebGL context is created, so that one
      // setting stays.
      if (next.lighter && !isLighter) {
        isLighter = true;
        form = FORMS.lighter;
        applyForm(world, form);
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, form.pixelRatio),
        );
        layOut(stage, world);
        if (!respondsToPointer(isLighter)) {
          tracking?.stop();
        }
      }
    },

    destroy() {
      if (isDestroyed) {
        return;
      }
      isDestroyed = true;
      syncLoop();
      resizeObserver.disconnect();
      viewObserver.disconnect();
      tracking?.stop();
      document.removeEventListener("visibilitychange", syncLoop);
      canvas.removeEventListener("webglcontextlost", onContextLost);

      // Release graphics memory, then the context itself. Out of the host
      // first: releasing the context fires a context-lost event, which must
      // not look like a failure to the site.
      disposeScene(scene);
      canvas.remove();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
