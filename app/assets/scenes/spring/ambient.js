// Spring scene, ambient layer: a blossom tree at the left edge of the hero.
//
// Its bough arches over the upper part of the hero, clear of the copy. Grass
// with small flowers runs along the bottom, round-tipped petals drift down
// from the blossom, and a small bird perched on the bough turns toward the
// pointer and now and then hops or flutters. On a narrow hero the tree and
// grass sit below the copy instead. The look was picked from the prototype in
// issue #46 (branch prototype/spring-look, ?variant=round).
//
// The site decides when this loads and passes a context: theme, current
// occasions, the lighter-form flag and asset URLs. Spring has no occasions
// and no asset files. Everything is procedural: the tree is rebuilt from the
// measured copy box on every layout, so the bough always clears the text.
// Only petals ever cross the copy, and behind each line of text their
// opacity is capped so the text keeps its contrast (copied from winter).
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CubicBezierCurve3,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";

// ---------------------------------------------------------------- constants

// The tree stands at the left edge, clear of the fixed theme and season
// buttons at the bottom right. Layout is worked out with the tree's side as
// +fx and mirrored by SIDE.
const SIDE = -1;

const FOV = 30;
const CAMERA_Z = 12;
const HALF_FOV_TAN = Math.tan(MathUtils.degToRad(FOV / 2));
// World units per hero height at the tree's depth (z = 0).
const HERO_UNITS = 2 * HALF_FOV_TAN * CAMERA_Z;
const FADE_IN = "opacity 2.8s cubic-bezier(0.3, 0, 0.2, 1)";
const FRAMES_BEFORE_FADE = 3;

// Clear space kept around the hero copy, in CSS pixels.
const COPY_MARGIN_PX = 22;
const MAX_CLUSTERS = 2400;
// Blossom clusters travel as one flat array: x, y, z, size, turn, light,
// seed for each.
const CLUSTER_STRIDE = 7;
const MAX_PETALS = 130;
const MAX_BLADES = 2600;
const MAX_FLOWERS = 48;
// Lines of copy the petals keep dim behind; more are ignored.
const MAX_COPY_LINES = 24;

// The full form and the lighter form: same composition, lower cost.
const FORMS = {
  full: {
    pixelRatio: 2,
    petals: MAX_PETALS,
    blades: MAX_BLADES,
    flowers: MAX_FLOWERS,
    alphaCut: 0.02,
    fps: 60,
  },
  lighter: {
    pixelRatio: 1.5,
    petals: 56,
    blades: 1100,
    flowers: 22,
    // No antialiasing, so blossom edges are cut hard instead of covered.
    alphaCut: 0.5,
    fps: 30,
  },
};

// Per-theme look. Dark is moonlit night blossom under cool light; light is
// warm daylight, with blossom held up on cream by a darker contour and a
// shaded side. The page background is never painted over.
const THEMES = {
  dark: {
    bark: "#62544e",
    barkRim: "#a9bdf0",
    barkRimAmount: 0.45,
    sky: "#7d8fc4",
    ground: "#1a1418",
    hemisphere: 1.15,
    key: "#cfdcff",
    keyIntensity: 3.6,
    petalEdge: "#f4ebf2",
    petalBase: "#e6b0c6",
    centre: "#a3456c",
    stamen: "#e6cf9e",
    contour: "#6f5672",
    contourAmount: 0.45,
    shade: "#6a6189",
    leaf: "#4f5a38",
    haze: 0.35,
    grassRoot: "#07140c",
    grassTip: "#36704a",
    grassTint: "#2b6560",
    daisy: "#ccd5ea",
    daisyContour: "#5d6f96",
    daisyContourAmount: 0.35,
    heart: "#b39a3c",
    violet: "#8f86c9",
    buttercup: "#c4b04a",
    birdGlow: 0.22,
  },
  light: {
    bark: "#7d6152",
    barkRim: "#fff1d8",
    barkRimAmount: 0,
    sky: "#fff3df",
    ground: "#9a8466",
    hemisphere: 1.35,
    key: "#fff1d8",
    keyIntensity: 2.5,
    petalEdge: "#ffffff",
    petalBase: "#f7c6d5",
    centre: "#c75a80",
    stamen: "#d8932a",
    contour: "#9c5672",
    contourAmount: 0.9,
    shade: "#dcacbd",
    leaf: "#78772f",
    haze: 0.1,
    grassRoot: "#467a26",
    grassTip: "#7fb83a",
    grassTint: "#b6c446",
    daisy: "#ffffff",
    daisyContour: "#8f95a8",
    daisyContourAmount: 0.85,
    heart: "#efb000",
    violet: "#7a69c9",
    buttercup: "#efc019",
    birdGlow: 0,
  },
};

const nextTask = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

// Park-Miller generator: the same tree on every visit and every layout.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}

const CSS_COLOR =
  /(?:rgba?|color)\(\s*(?:srgb\s+)?([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/;

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

// Shared wind: a slow steady drift plus one gust front, every 17 seconds,
// that every petal and blade feels at once. windTravel() is how far the wind
// has carried something since time zero, so a petal's drift since it left
// the tree is windTravel(now) - windTravel(then).
const WIND_GLSL = `
  const float GUST_PERIOD = 17.0;
  const float GUST_SHARE = 0.3;
  const float WIND_BASE = 0.05;
  const float GUST_REACH = 1.5;

  float windTravel(float t) {
    float cycles = t / GUST_PERIOD;
    float p = fract(cycles);
    return t * WIND_BASE
      + (floor(cycles) + smoothstep(1.0 - GUST_SHARE, 1.0, p)) * GUST_REACH;
  }

  float gustNow(float t) {
    float p = fract(t / GUST_PERIOD);
    float q = clamp((p - (1.0 - GUST_SHARE)) / GUST_SHARE, 0.0, 1.0);
    return 4.0 * q * (1.0 - q);
  }`;

// One blossom cluster: a camera-facing quad with two or three five-petal
// flowers drawn into it, sometimes a bud or a young bronze leaf.
const CLUSTER_VERTEX_SHADER = `
  attribute vec3 aCentre;
  // size, turn, light (0 shaded side, 1 lit side), seed
  attribute vec4 aCluster;
  uniform float uTime;
  varying vec2 vUv;
  varying float vLight;
  varying float vSeed;
  varying float vFar;
  void main() {
    vec3 c = aCentre;
    // A barely-there stir, more at the outside of the tree.
    float stir = sin(uTime * 0.8 + c.x * 0.9 + aCluster.w * 6.0)
      + 0.5 * sin(uTime * 1.7 + c.y * 1.3);
    c.x += stir * aCluster.x * 0.03;
    vec4 mv = viewMatrix * vec4(c, 1.0);
    float turn = aCluster.y;
    mat2 spin = mat2(cos(turn), -sin(turn), sin(turn), cos(turn));
    mv.xy += spin * position.xy * aCluster.x;
    vUv = position.xy * 2.0;
    vLight = aCluster.z;
    vSeed = aCluster.w;
    vFar = clamp(-c.z * 0.5, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }`;

// Five round petals, pink at the heart and
// white at the edge, with stamens and a contour.
const FLOWER_GLSL = `
  uniform vec3 uPetalEdge;
  uniform vec3 uPetalBase;
  uniform vec3 uCentre;
  uniform vec3 uStamen;
  uniform vec3 uContour;
  uniform float uContourAmount;

  vec4 blossom(vec2 q, float turn) {
    float r = length(q);
    float a = atan(q.y, q.x) + turn;
    const float SEG = 1.25664;
    float phi = mod(a + SEG * 0.5, SEG) - SEG * 0.5;
    float x = phi / (SEG * 0.5);
    float edge = 0.6 + 0.4 * sqrt(max(0.0, 1.0 - x * x));
    float d = edge - r;
    float aa = fwidth(r) * 1.3 + 0.0001;
    float alpha = smoothstep(0.0, aa, d);
    vec3 col = mix(uPetalBase, uPetalEdge, smoothstep(0.1, 0.75, r));
    // A thin gap between neighbouring petals.
    float gap = smoothstep(0.78, 1.0, abs(x)) * smoothstep(0.2, 0.45, r);
    col = mix(col, uContour, gap * 0.55 * uContourAmount);
    col = mix(col, uCentre, smoothstep(0.3, 0.08, r));
    float ring = fract(a / 6.28318 * 11.0) - 0.5;
    float stamen = smoothstep(0.075, 0.035,
      length(vec2(r - 0.33, ring * 6.28318 * r / 11.0)));
    col = mix(col, uStamen, stamen);
    col = mix(col, uContour, (1.0 - smoothstep(aa, aa + 0.13, d)) * uContourAmount);
    // Rounded: the lower part of each flower a little darker.
    col *= 1.0 - 0.14 * smoothstep(0.0, -1.0, q.y);
    return vec4(col, alpha);
  }

  vec4 bud(vec2 q) {
    float r = length(q * vec2(1.0, 0.8));
    float aa = fwidth(r) * 1.3 + 0.0001;
    float alpha = smoothstep(0.0, aa, 0.5 - r);
    vec3 col = mix(uCentre, uPetalBase, smoothstep(-0.5, 0.4, q.y));
    col = mix(col, uContour, (1.0 - smoothstep(aa, aa + 0.12, 0.5 - r)) * uContourAmount);
    return vec4(col, alpha);
  }

  // Premultiplied "over": src on top of acc.
  vec4 over(vec4 acc, vec4 src) {
    return vec4(src.rgb * src.a + acc.rgb * (1.0 - src.a), src.a + acc.a * (1.0 - src.a));
  }`;

const CLUSTER_FRAGMENT_SHADER = `
  ${FLOWER_GLSL}
  uniform vec3 uShade;
  uniform vec3 uLeaf;
  uniform vec3 uBackground;
  uniform float uHaze;
  uniform float uAlphaCut;
  varying vec2 vUv;
  varying float vLight;
  varying float vSeed;
  varying float vFar;
  void main() {
    vec4 acc = vec4(0.0);
    float pick = fract(vSeed * 7.31);
    // A young leaf behind the flowers on some clusters.
    if (pick < 0.16) {
      vec2 q = vUv - vec2(0.42, -0.42);
      float c = cos(0.8), s = sin(0.8);
      q = mat2(c, -s, s, c) * q;
      float d = 0.22 * (1.0 - q.x * q.x / 0.36) - abs(q.y);
      float aa = fwidth(d) * 1.3 + 0.0001;
      float alpha = smoothstep(0.0, aa, d) * step(abs(q.x), 0.6);
      vec3 leaf = mix(uLeaf * 0.7, uLeaf, smoothstep(-0.1, 0.1, q.y));
      acc = over(acc, vec4(leaf, alpha));
    }
    vec4 f = blossom((vUv - vec2(-0.4, 0.2)) / 0.52, vSeed * 6.0);
    acc = over(acc, vec4(f.rgb, f.a));
    if (pick > 0.8) {
      f = bud((vUv - vec2(0.45, 0.42)) / 0.32);
    } else {
      f = blossom((vUv - vec2(0.38, 0.3)) / 0.46, vSeed * 11.0);
    }
    acc = over(acc, vec4(f.rgb, f.a));
    f = blossom((vUv - vec2(0.0, -0.36)) / 0.5, vSeed * 17.0);
    acc = over(acc, vec4(f.rgb, f.a));
    if (acc.a < uAlphaCut) discard;
    vec3 col = acc.rgb / max(acc.a, 0.0001);
    col = mix(col * uShade, col, vLight);
    col = mix(col, uBackground, vFar * uHaze);
    gl_FragColor = vec4(col, acc.a);
    #include <colorspace_fragment>
  }`;

const PETAL_VERTEX_SHADER = `
  ${WIND_GLSL}
  // speed, depth, phase, spawn hash
  attribute vec4 aSeed;
  // swing rate, swing phase, spin, size
  attribute vec4 aSeed2;
  uniform float uTime;
  uniform vec3 uBough[4];
  uniform vec4 uCrown;
  uniform float uSide;
  uniform float uSize;
  uniform float uBottom;
  uniform vec3 uLightDir;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vLit;

  const float CAMERA_Z = ${CAMERA_Z.toFixed(3)};

  vec3 bough(float t) {
    float s = 1.0 - t;
    return s * s * s * uBough[0] + 3.0 * s * s * t * uBough[1]
      + 3.0 * s * t * t * uBough[2] + t * t * t * uBough[3];
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
  }
  mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  }
  mat3 rotateZ(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
  }

  void main() {
    float speed = mix(0.2, 0.34, aSeed.x);
    float z = mix(-2.0, 3.0, aSeed.y);
    float depthScale = (CAMERA_Z - z) / CAMERA_Z;
    // Each fall runs from the blossom to below the hero, then the petal
    // leaves the tree again somewhere else.
    float fallSpan = uCrown.y + uCrown.w - uBottom + 0.6;
    float cycleLength = fallSpan / speed;
    float local = uTime + aSeed.z * cycleLength;
    float cycle = floor(local / cycleLength);
    float age = local - cycle * cycleLength;

    float pick = hash(vec2(cycle, aSeed.w * 113.0));
    float along = hash(vec2(aSeed.w * 71.0, cycle + 5.3));
    float spread = hash(vec2(cycle * 1.7 + 3.1, aSeed.x * 59.0));
    vec3 spawn;
    if (pick < 0.5) {
      spawn = bough(mix(0.15, 1.0, along)) + vec3(0.0, -0.04 - 0.16 * spread, 0.0);
    } else {
      float angle = along * 6.28318;
      float radius = sqrt(spread) * uCrown.w;
      spawn = uCrown.xyz + vec3(cos(angle) * radius, sin(angle) * radius * 0.7, 0.0);
    }

    // Same place on screen as the blossom it left, at the petal's own depth.
    vec3 p = vec3(spawn.xy * depthScale, z);
    float travel = windTravel(uTime) - windTravel(uTime - age);
    float rate = mix(0.55, 0.95, aSeed2.x);
    float swing = sin(uTime * rate + aSeed2.y * 30.0);
    // Blown away from the tree, towards the open side of the hero.
    p.x += (-uSide * travel + swing * 0.2) * depthScale;
    p.y += -age * speed + 0.05 * cos(uTime * rate * 2.0 + aSeed2.y * 30.0);

    // A slow tumble that never turns fully edge-on, so nothing flickers.
    float spin = aSeed2.z * 6.28318 + uTime * (aSeed2.w - 0.5) * 0.9;
    float tilt = 0.5 + 0.32 * swing + 0.12 * gustNow(uTime);
    mat3 turn = rotateY(swing * 0.5) * rotateX(tilt) * rotateZ(spin);
    float size = uSize * mix(0.8, 1.15, aSeed2.w);
    vec3 corner = turn * vec3(position.xy * vec2(0.66, 1.0), 0.0) * size;
    vec3 normal = turn * vec3(0.0, 0.0, 1.0);
    vLit = abs(dot(normal, uLightDir));

    // Fades in as it leaves the blossom. About one fall in six is skipped,
    // so the drift stays sparse and uneven.
    float skip = step(0.84, hash(vec2(cycle + 0.5, aSeed.z * 41.0)));
    vAlpha = smoothstep(0.0, 1.6, age) * (1.0 - skip);
    vUv = position.xy * 2.0;
    gl_Position = projectionMatrix * viewMatrix * vec4(p + corner, 1.0);
  }`;

const PETAL_FRAGMENT_SHADER = `
  uniform vec3 uPetalEdge;
  uniform vec3 uPetalBase;
  uniform vec3 uContour;
  uniform float uContourAmount;
  uniform vec3 uShade;
  uniform float uOpacity;
  uniform vec4 uCopyLines[MAX_COPY_LINES];
  uniform float uCopyCaps[MAX_COPY_LINES];
  uniform int uCopyLineCount;
  uniform vec2 uCopyEdge;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vLit;
  void main() {
    // A petal: a narrow claw at the base, broad and round at the tip.
    float u = vUv.x;
    float v = vUv.y * 0.5 + 0.5;
    float halfWidth = 0.92 * sqrt(max(v, 0.0)) * (1.0 - 0.12 * v);
    float top = 0.98 - 0.55 * u * u;
    float inside = min(halfWidth - abs(u), (top - v) * 1.4);
    float aa = fwidth(inside) * 1.2 + 0.0001;
    float alpha = smoothstep(0.0, aa, inside) * vAlpha * uOpacity;

    // Behind a line of the page's copy a petal is held under that line's
    // cap, easing back to full strength just outside it.
    float cap = 1.0;
    for (int i = 0; i < MAX_COPY_LINES; i++) {
      if (i >= uCopyLineCount) break;
      vec4 line = uCopyLines[i];
      vec2 outside = max(line.xy - gl_FragCoord.xy, gl_FragCoord.xy - line.zw);
      float near = 1.0 - smoothstep(uCopyEdge.x, uCopyEdge.y, length(max(outside, 0.0)));
      cap = min(cap, mix(1.0, uCopyCaps[i], near));
    }
    alpha = min(alpha, cap);
    if (alpha < 0.004) discard;

    vec3 col = mix(uPetalBase, uPetalEdge, smoothstep(0.0, 0.55, v));
    col = mix(col, uContour, (1.0 - smoothstep(aa, aa + 0.16, inside)) * uContourAmount);
    col = mix(col * uShade, col, mix(0.45, 1.0, vLit));
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }`;

// Grass blades and the stems of the small flowers: a strip bent in the
// vertex shader, rooted where the layout put it.
const GRASS_GLSL = `
  ${WIND_GLSL}
  uniform float uTime;
  uniform float uSide;

  vec3 bladePoint(vec3 root, vec4 blade, float t) {
    float height = blade.x;
    float seed = blade.z;
    float breeze = 0.6 * sin(root.x * 0.6 - uTime * 0.9 + root.z * 0.4)
      + 0.4 * sin(root.x * 1.7 - uTime * 1.6 + seed * 6.0);
    float bend = blade.w + breeze * 0.06 - uSide * gustNow(uTime) * 0.22;
    float curve = t * t * height;
    return root + vec3(bend * curve, height * t * (1.0 - 0.25 * bend * bend * t), 0.0);
  }`;

const BLADE_VERTEX_SHADER = `
  ${GRASS_GLSL}
  attribute vec3 aRoot;
  // height, width, seed, lean
  attribute vec4 aBlade;
  uniform vec3 uShadowAt;
  varying float vT;
  varying float vSide;
  varying float vSeed;
  varying float vFar;
  varying float vShadow;
  void main() {
    float t = position.y;
    vec3 p = bladePoint(aRoot, aBlade, t);
    p.x += position.x * aBlade.y * (1.0 - pow(t, 1.6));
    vT = t;
    vSide = position.x + 0.5;
    vSeed = aBlade.z;
    vFar = smoothstep(2.5, -2.0, aRoot.z);
    // Darker under the tree.
    vShadow = exp(-pow((aRoot.x - uShadowAt.x) / uShadowAt.z, 2.0));
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }`;

const BLADE_FRAGMENT_SHADER = `
  uniform vec3 uRoot;
  uniform vec3 uTip;
  uniform vec3 uTint;
  uniform vec3 uBackground;
  uniform float uHaze;
  varying float vT;
  varying float vSide;
  varying float vSeed;
  varying float vFar;
  varying float vShadow;
  void main() {
    float rise = smoothstep(0.0, 1.0, vT);
    vec3 tip = mix(uTip, uTint, fract(vSeed * 13.7) * 0.5);
    vec3 col = mix(uRoot, tip, rise);
    col += (tip - uRoot) * 0.25 * smoothstep(0.55, 1.0, vSide) * rise;
    col *= 1.0 - 0.35 * vShadow;
    col = mix(col, uBackground, vFar * uHaze);
    col = mix(uBackground, col, 0.55 + 0.45 * smoothstep(0.0, 0.3, vT));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

const MEADOW_FLOWER_VERTEX_SHADER = `
  ${GRASS_GLSL}
  attribute vec3 aRoot;
  attribute vec4 aBlade;
  // 0 daisy, 1 violet, 2 buttercup
  attribute float aKind;
  varying vec2 vUv;
  varying float vKind;
  varying float vSeed;
  void main() {
    vec3 p = bladePoint(aRoot, aBlade, 1.0);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    float size = aBlade.y;
    mv.xy += position.xy * vec2(1.0, 0.82) * size;
    mv.z += 0.02;
    vUv = position.xy * 2.0;
    vKind = aKind;
    vSeed = aBlade.z;
    gl_Position = projectionMatrix * mv;
  }`;

const MEADOW_FLOWER_FRAGMENT_SHADER = `
  uniform vec3 uDaisy;
  uniform vec3 uDaisyContour;
  uniform float uDaisyContourAmount;
  uniform vec3 uHeart;
  uniform vec3 uViolet;
  uniform vec3 uButtercup;
  varying vec2 vUv;
  varying float vKind;
  varying float vSeed;
  void main() {
    float r = length(vUv);
    float a = atan(vUv.y, vUv.x) + vSeed * 6.28318;
    float petals = vKind < 0.5 ? 7.0 : 2.5;
    float lobe = pow(abs(cos(a * petals)), vKind < 0.5 ? 0.5 : 0.35);
    float edge = mix(0.45, 0.95, lobe);
    float aa = fwidth(r) * 1.3 + 0.0001;
    float alpha = smoothstep(0.0, aa, edge - r);
    if (alpha < 0.02) discard;
    vec3 petal = vKind < 0.5 ? uDaisy : (vKind < 1.5 ? uViolet : uButtercup);
    vec3 col = mix(petal, uDaisyContour, (1.0 - smoothstep(aa, aa + 0.25, edge - r)) * uDaisyContourAmount * step(vKind, 0.5));
    col = mix(col, vKind < 0.5 ? uHeart : mix(uHeart, vec3(1.0), 0.4), smoothstep(0.3, 0.2, r));
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
    // The grass dissolves into the next section.
    maskImage: "linear-gradient(to bottom, #000 91%, transparent)",
  });

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_Z);
  camera.lookAt(0, 0, 0);

  const key = new DirectionalLight();
  const hemisphere = new HemisphereLight();
  scene.add(key, key.target, hemisphere);

  return {
    host,
    copy: host.parentElement?.querySelector("[data-scene-copy]") ?? null,
    renderer,
    canvas,
    scene,
    camera,
    key,
    hemisphere,
    hasRoom: true,
  };
}

// ---------------------------------------------------------------- layout

// The hero, in screen fractions: fx runs -1 (left) to 1 (right), fy 0
// (bottom) to 1 (top). halfHeightAt(z) is half the hero's height in world
// units at depth z.
const halfHeightAt = (z) => HALF_FOV_TAN * (CAMERA_Z - z);

function toWorld(view, fx, fy, z = 0) {
  const half = halfHeightAt(z);
  return new Vector3(fx * half * view.aspect, (fy * 2 - 1) * half, z);
}

function toScreen(view, point) {
  const half = halfHeightAt(point.z);
  return {
    fx: point.x / (half * view.aspect),
    fy: (point.y / half + 1) / 2,
  };
}

// The copy box grown by the clear margin, in screen fractions, mirrored so
// that the tree's side is always +fx.
function measureKeepOut(stage, view) {
  if (!stage.copy) {
    return { left: 0, right: 0, top: 0.5, bottom: 0.5 };
  }
  const host = stage.host.getBoundingClientRect();
  const box = stage.copy.getBoundingClientRect();
  const mx = (2 * COPY_MARGIN_PX) / view.width;
  const my = COPY_MARGIN_PX / view.height;
  const left = ((box.left - host.left) / view.width) * 2 - 1 - mx;
  const right = ((box.right - host.left) / view.width) * 2 - 1 + mx;
  return {
    left: SIDE > 0 ? left : -right,
    right: SIDE > 0 ? right : -left,
    top: 1 - (box.top - host.top) / view.height + my,
    bottom: 1 - (box.bottom - host.top) / view.height - my,
  };
}

const insideKeepOut = (keepOut, fx, fy, pad = 0) =>
  fx > keepOut.left - pad &&
  fx < keepOut.right + pad &&
  fy > keepOut.bottom - pad &&
  fy < keepOut.top + pad;

// Where the tree goes, in screen fractions on the tree's side (+fx), or null
// when the hero has no room for it.
//   wide   trunk at the edge beside the copy, bough arching over the copy
//   below  a smaller tree in the band under the copy
function planTree(view, keepOut) {
  const sideRoom = 1 - keepOut.right;
  const topRoom = 1 - keepOut.top;
  if (view.aspect >= 1 && sideRoom >= 0.14 && topRoom >= 0.1) {
    const trunkX = MathUtils.clamp(
      1 - sideRoom * 0.4,
      keepOut.right + 0.08,
      0.9,
    );
    // The bough's inner run sits this high, clear of the copy with room for
    // the blossom hanging under it.
    const level = MathUtils.clamp(keepOut.top + 0.09, 0.8, 0.93);
    const plan = {
      mode: "wide",
      base: [trunkX + 0.02, -0.03],
      fork: [trunkX - 0.01, 0.58],
      crown: { fx: trunkX + 0.04, fy: 0.84, r: 0.15 },
      bough: [
        [trunkX - 0.01, 0.58],
        [trunkX - 0.04, Math.min(level + 0.14, 0.99)],
        [MathUtils.lerp(trunkX, -0.1, 0.5), Math.min(level + 0.08, 0.99)],
        [-0.12, level - 0.02],
      ],
      treeTop: 0.98,
      grass: 0.05,
    };
    // A copy too tall to arch over: the bough stays beside it.
    if (keepOut.top + 0.06 > 0.95) {
      plan.bough[2] = [keepOut.right + 0.12, 0.93];
      plan.bough[3] = [keepOut.right + 0.04, 0.9];
    }
    return plan;
  }

  const band = keepOut.bottom;
  if (band < 0.13) {
    return null;
  }
  return {
    mode: "below",
    base: [0.8, -0.03],
    fork: [0.78, band * 0.42],
    crown: { fx: 0.9, fy: band * 0.72, r: band * 0.24 },
    bough: [
      [0.78, band * 0.42],
      [0.72, band * 0.84],
      [0.25, band * 0.88],
      [-0.32, band * 0.66],
    ],
    treeTop: band * 0.97,
    grass: Math.min(0.05, band * 0.25),
  };
}

// ---------------------------------------------------------------- tree

// Appends a tapered tube along a curve to the bark arrays. from and to are
// the radii at its two ends; shade darkens its vertex colour.
function addTube(bark, curve, { from, to, segments, shade }) {
  const radial = 9;
  const frames = curve.computeFrenetFrames(segments, false);
  const first = bark.positions.length / 3;
  const point = new Vector3();
  const normal = new Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    const radius = MathUtils.lerp(from, to, t ** 0.85);
    const tone = shade * (0.82 + 0.18 * t) * (0.94 + 0.06 * Math.sin(i * 2.7));
    for (let j = 0; j <= radial; j++) {
      const angle = (j / radial) * Math.PI * 2;
      normal
        .copy(frames.normals[i])
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(frames.binormals[i], Math.sin(angle));
      bark.positions.push(
        point.x + normal.x * radius,
        point.y + normal.y * radius,
        point.z + normal.z * radius,
      );
      bark.normals.push(normal.x, normal.y, normal.z);
      bark.colors.push(tone, tone, tone);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = first + i * (radial + 1) + j;
      const b = a + radial + 1;
      bark.indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
}

// A gently curved branch from start to end, bowing sideways by bow.
function branchCurve(start, end, bow) {
  const span = end.clone().sub(start);
  const across = new Vector3(-span.y, span.x, 0).normalize();
  const c1 = start
    .clone()
    .addScaledVector(span, 0.33)
    .addScaledVector(across, bow * span.length())
    .add(new Vector3(0, 0, 0.15));
  const c2 = start
    .clone()
    .addScaledVector(span, 0.7)
    .addScaledVector(across, bow * 0.6 * span.length())
    .add(new Vector3(0, 0, 0.1));
  return new CubicBezierCurve3(start, c1, c2, end);
}

// Everything the parts of one tree share while it grows. The tree's shape
// comes from one seeded sequence of random numbers, so the parts must grow
// in the same order every time: trunk, bough, limbs, bough twigs, bough
// blossom, crown, then the clusters.
function startTree(view, plan, keepOut) {
  const treeHeight = (plan.treeTop - plan.base[1]) * HERO_UNITS;
  const pixel = HERO_UNITS / view.height;
  const grower = {
    view,
    plan,
    keepOut,
    random: createRandom(29),
    pixel,
    trunkRadius: Math.max(treeHeight * 0.019, pixel * 4),
    clusterSize: Math.max(treeHeight * 0.032, pixel * 17),
    bark: { positions: [], normals: [], colors: [], indices: [] },
    // Blossom puffs: clusters scattered around a point on a branch.
    puffs: [],
    nearPerch: () => false,
  };
  grower.at = (fx, fy, z = 0) => toWorld(view, SIDE * fx, fy, z);
  grower.puff = (centre, radius, density) =>
    grower.puffs.push({ centre, radius, density });
  return grower;
}

// A trunk that leans out from the edge and back in towards the fork.
function growTrunk(grower) {
  const { plan, at, bark, trunkRadius } = grower;
  const trunk = new CatmullRomCurve3([
    at(...plan.base),
    at(plan.base[0] + 0.035, MathUtils.lerp(plan.base[1], plan.fork[1], 0.3)),
    at(plan.fork[0] + 0.005, MathUtils.lerp(plan.base[1], plan.fork[1], 0.7)),
    at(...plan.fork),
  ]);
  addTube(bark, trunk, {
    from: trunkRadius * 1.45,
    to: trunkRadius * 0.85,
    segments: 24,
    shade: 0.85,
  });
  return trunk;
}

function growBough(grower) {
  const { plan, at, bark, trunkRadius } = grower;
  const bough = new CubicBezierCurve3(
    ...plan.bough.map(([fx, fy], index) =>
      at(fx, fy, [0, 0.5, 0.6, 0.25][index]),
    ),
  );
  addTube(bark, bough, {
    from: trunkRadius * 0.72,
    to: trunkRadius * 0.16,
    segments: 40,
    shade: 0.92,
  });
  return bough;
}

// How much of the bird's length it can take up above the bough: its own
// height plus the top of a hop, with a little to spare.
const BIRD_REACH = 1.25;

// True when a bird of this length, standing at any of these points on the
// bough and at the top of a hop, stays clear of the copy and its margin.
function birdFits(grower, feet, length) {
  const corners = [
    [-0.6, 0],
    [0.6, 0],
    [-0.6, BIRD_REACH],
    [0.6, BIRD_REACH],
  ];
  return feet.every((foot) =>
    corners.every(([across, up]) => {
      const corner = foot
        .clone()
        .add(new Vector3(across * length, up * length, 0));
      const screen = toScreen(grower.view, corner);
      return !insideKeepOut(grower.keepOut, SIDE * screen.fx, screen.fy);
    }),
  );
}

// Where the bird perches on the bough, and a test for the clearing kept in
// the blossom around it wherever it hops along its stretch of bough. In a
// band too low for the bird, it is drawn smaller, or not at all
// (birdLength 0), rather than reaching into the copy.
function placePerch(grower, bough) {
  const perchAt = grower.plan.mode === "wide" ? 0.6 : 0.62;
  const feet = [-0.07, -0.035, 0, 0.035, 0.07].map((step) =>
    bough.getPointAt(MathUtils.clamp(perchAt + step, 0, 1)),
  );
  const fullLength =
    MathUtils.clamp(grower.view.height * 0.055, 30, 50) * grower.pixel;
  const birdLength =
    [1, 0.85, 0.7]
      .map((share) => fullLength * share)
      .find((length) => birdFits(grower, feet, length)) ?? 0;
  const stops = feet.map((foot) =>
    foot.clone().add(new Vector3(0, birdLength * 0.35, 0)),
  );
  grower.nearPerch = (position, reach = 0.85) =>
    birdLength > 0 &&
    stops.some((stop) => position.distanceTo(stop) < birdLength * reach);
  return { perchAt, perch: bough.getPointAt(perchAt), birdLength };
}

// Crown limbs, reaching up and out past the edge.
function growLimbs(grower, trunk) {
  const { at, bark, random, trunkRadius } = grower;
  const crown = grower.plan.crown;
  const limbs = [
    [0.86, [crown.fx + 0.1, crown.fy + crown.r * 0.9], 0.6, -0.1],
    [0.97, [crown.fx - 0.05, crown.fy + crown.r * 1.05], 0.5, 0.12],
    [0.7, [crown.fx + 0.22, crown.fy - crown.r * 0.1], 0.55, 0.15],
    [0.55, [crown.fx + 0.24, crown.fy - crown.r * 0.55], 0.42, 0.18],
  ];
  return limbs.map(([along, [fx, fy], thickness, bow]) => {
    const start = trunk.getPointAt(along);
    const end = at(fx, fy, (random() - 0.5) * 0.6);
    const curve = branchCurve(start, end, bow * SIDE);
    addTube(bark, curve, {
      from: trunkRadius * thickness,
      to: trunkRadius * 0.12,
      segments: 16,
      shade: 0.9,
    });
    return curve;
  });
}

// A twig off a branch, or null where it would reach into the copy or sit
// beside the bird, whose clearing would leave it bare.
function growTwig(grower, parent, along, { angle, length, thickness }) {
  const { random } = grower;
  const start = parent.getPointAt(along);
  const end = start
    .clone()
    .add(
      new Vector3(
        Math.cos(angle) * length,
        Math.sin(angle) * length,
        (random() - 0.3) * 0.4,
      ),
    );
  const tip = toScreen(grower.view, end);
  if (
    insideKeepOut(grower.keepOut, SIDE * tip.fx, tip.fy, 0.02) ||
    grower.nearPerch(end, 1.3)
  ) {
    return null;
  }
  const curve = branchCurve(start, end, (random() - 0.5) * 0.3);
  addTube(grower.bark, curve, {
    from: thickness,
    to: thickness * 0.25,
    segments: 8,
    shade: 0.95,
  });
  return curve;
}

// Twigs along the bough, alternating up and down-and-forward, each covered
// in blossom; then blossom along the bough itself, in clumps with gaps,
// thinning towards the tip.
function blossomBough(grower, bough) {
  const { random, clusterSize, trunkRadius, puff } = grower;
  const inward = SIDE > 0 ? Math.PI : 0;
  for (let index = 0; index < 9; index++) {
    const along = 0.18 + index * 0.095 + random() * 0.03;
    const angle =
      index % 2 === 0
        ? Math.PI / 2 + SIDE * (0.55 + random() * 0.35)
        : inward + SIDE * -(0.5 + random() * 0.35);
    const length = clusterSize * (1.4 + random() * 1.2) * (1.1 - along * 0.4);
    const curve = growTwig(grower, bough, along, {
      angle,
      length,
      thickness: trunkRadius * 0.16,
    });
    if (curve) {
      puff(curve.getPointAt(1), clusterSize * (1.3 + random() * 0.6), 1);
      puff(curve.getPointAt(0.7), clusterSize * 1.1, 0.8);
      puff(curve.getPointAt(0.4), clusterSize, 0.8);
    }
  }
  for (let along = 0.1; along <= 1.0; along += 0.03) {
    if (random() >= 0.22) {
      const point = bough
        .getPointAt(along)
        .add(new Vector3(0, clusterSize * 0.35, 0));
      puff(point, clusterSize * (1.5 - along * 0.55), 1);
    }
  }
}

// The crown: puffs along every limb and on twigs off it, then a dense mass
// around the top.
function blossomCrown(grower, limbs) {
  const { random, clusterSize, trunkRadius, puff } = grower;
  for (const limb of limbs) {
    for (let along = 0.35; along <= 1.0; along += 0.16) {
      puff(limb.getPointAt(along), clusterSize * (1.8 + random() * 1.4), 1);
    }
    for (let index = 0; index < 3; index++) {
      const along = 0.45 + random() * 0.5;
      const angle = Math.PI / 2 + (random() - 0.5) * 2.2;
      const length = clusterSize * (2 + random() * 2);
      const twig = growTwig(grower, limb, along, {
        angle,
        length,
        thickness: trunkRadius * 0.2,
      });
      if (twig) {
        puff(twig.getPointAt(1), clusterSize * (1.4 + random()), 1);
      }
    }
  }

  const { crown } = grower.plan;
  const centre = grower.at(crown.fx, crown.fy);
  const reach = crown.r * HERO_UNITS;
  for (let index = 0; index < 12; index++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * reach;
    const offset = new Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.75,
      (random() - 0.5) * 0.8,
    );
    puff(centre.clone().add(offset), clusterSize * (2.2 + random() * 1.2), 1);
  }
  return { centre, radius: reach };
}

// Scatters clusters through every puff, dropping any that would reach the
// copy or sit in front of the bird. Returns the flat cluster array.
function scatterClusters(grower, perch) {
  const { random, clusterSize, view, keepOut } = grower;
  const lightDir = new Vector3(-0.45 * SIDE, 0.8, 0.4).normalize();
  const clusters = [];
  const offset = new Vector3();
  for (const { centre, radius, density } of grower.puffs) {
    const count = Math.round(((radius / clusterSize) ** 2 * 3.4 + 1) * density);
    for (let index = 0; index < count; index++) {
      if (clusters.length / CLUSTER_STRIDE >= MAX_CLUSTERS) {
        return clusters;
      }
      // Biased upward: blossom sits on top of a branch more than under it.
      offset.set(random() * 2 - 1, random() * 2 - 0.8, random() * 2 - 1);
      if (offset.lengthSq() > 1) {
        offset.normalize();
      }
      const position = centre.clone().addScaledVector(offset, radius);
      const screen = toScreen(view, position);
      const size = clusterSize * (0.8 + random() * 0.45);
      const pad = (size / HERO_UNITS) * 0.6;
      const isClear =
        !insideKeepOut(keepOut, SIDE * screen.fx, screen.fy, pad) &&
        !(grower.nearPerch(position) && position.z > perch.z - 0.25);
      if (isClear) {
        const facing = offset
          .clone()
          .add(new Vector3(0, 0.35, 0.2))
          .normalize();
        const light = MathUtils.clamp(facing.dot(lightDir) * 0.6 + 0.5, 0, 1);
        clusters.push(
          position.x,
          position.y,
          position.z,
          size,
          random() * Math.PI * 2,
          light,
          random(),
        );
      }
    }
  }
  return clusters;
}

function barkGeometry(bark) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(bark.positions), 3),
  );
  geometry.setAttribute(
    "normal",
    new BufferAttribute(new Float32Array(bark.normals), 3),
  );
  geometry.setAttribute(
    "color",
    new BufferAttribute(new Float32Array(bark.colors), 3),
  );
  geometry.setIndex(bark.indices);
  return geometry;
}

// Builds the tree for one plan: bark tubes and the blossom clusters, with
// every cluster that would reach the copy dropped.
function growTree(view, plan, keepOut) {
  const grower = startTree(view, plan, keepOut);
  const trunk = growTrunk(grower);
  const bough = growBough(grower);
  const { perchAt, perch, birdLength } = placePerch(grower, bough);
  const limbs = growLimbs(grower, trunk);
  blossomBough(grower, bough);
  const crown = blossomCrown(grower, limbs);
  const clusters = scatterClusters(grower, perch);

  return {
    barkGeometry: barkGeometry(grower.bark),
    clusters,
    bough,
    perchAt,
    birdLength,
    trunkRadius: grower.trunkRadius,
    crown,
    base: trunk.getPointAt(0),
    clusterSize: grower.clusterSize,
  };
}

function createClusterMesh(material, clusters) {
  const count = clusters.length / CLUSTER_STRIDE;
  const geometry = new InstancedBufferGeometry().copy(new PlaneGeometry(1, 1));
  const centres = new Float32Array(count * 3);
  const data = new Float32Array(count * 4);
  for (let index = 0; index < count; index++) {
    centres.set(
      clusters.slice(index * CLUSTER_STRIDE, index * CLUSTER_STRIDE + 3),
      index * 3,
    );
    data.set(
      clusters.slice(index * CLUSTER_STRIDE + 3, (index + 1) * CLUSTER_STRIDE),
      index * 4,
    );
  }
  geometry.setAttribute("aCentre", new InstancedBufferAttribute(centres, 3));
  geometry.setAttribute("aCluster", new InstancedBufferAttribute(data, 4));
  geometry.instanceCount = count;
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- meadow

// Daisies mostly, then violets, then a few buttercups.
const flowerKind = (roll) => {
  if (roll < 0.55) {
    return 0;
  }
  return roll < 0.8 ? 1 : 2;
};

// Blades and flowers rooted along the bottom of the hero for this layout.
function growMeadow(view, plan, keepOut, tree) {
  const random = createRandom(11);
  const pixel = HERO_UNITS / view.height;
  // Never taller than the room under the copy allows.
  const ceiling = Math.max(0, keepOut.bottom - 0.03);
  const trunkFx = SIDE * plan.base[0];

  const heightAt = (fx) => {
    const edge = MathUtils.smoothstep(Math.abs(fx), 0.45, 1);
    const nearTree = Math.exp(-(((fx - trunkFx) / 0.18) ** 2));
    // Low around the scroll-down link at the bottom centre.
    const clearing = MathUtils.lerp(
      0.55,
      1,
      MathUtils.smoothstep((Math.abs(fx) * view.width) / 2, 14, 60),
    );
    return Math.min(
      plan.grass * (0.75 + 0.35 * edge + 0.45 * nearTree) * clearing,
      ceiling,
    );
  };

  const blades = [];
  for (let index = 0; index < MAX_BLADES; index++) {
    const fx = (random() * 2 - 1) * 1.06;
    const depth = random();
    const z = MathUtils.lerp(-2, 2.5, depth);
    const fy = MathUtils.lerp(0.035, -0.012, depth);
    const root = toWorld(view, fx, fy, z);
    const scale = halfHeightAt(z) / halfHeightAt(0);
    const height =
      heightAt(fx) * HERO_UNITS * scale * MathUtils.lerp(0.5, 1, random());
    const width =
      Math.max(pixel * 3.2, height * 0.07) * MathUtils.lerp(0.7, 1.3, random());
    blades.push({
      root,
      blade: [height, width, random(), (random() - 0.5) * 0.35],
    });
  }

  const flowers = [];
  for (let index = 0; index < MAX_FLOWERS; index++) {
    const fx = (random() * 2 - 1) * 1.02;
    const depth = MathUtils.lerp(0.4, 1, random());
    const z = MathUtils.lerp(-2, 2.5, depth);
    const fy = MathUtils.lerp(0.035, -0.012, depth);
    const root = toWorld(view, fx, fy, z);
    const scale = halfHeightAt(z) / halfHeightAt(0);
    const height =
      heightAt(fx) * HERO_UNITS * scale * MathUtils.lerp(0.75, 1.05, random());
    const size =
      Math.max(pixel * 9, tree.clusterSize * 0.38) *
      MathUtils.lerp(0.8, 1.2, random());
    const roll = random();
    flowers.push({
      root,
      blade: [height, size, random(), (random() - 0.5) * 0.25],
      kind: flowerKind(roll),
    });
  }
  return {
    blades,
    flowers,
    shadowAt: new Vector3(tree.base.x, 0, tree.trunkRadius * 9),
  };
}

function createBladeMesh(material, entries, width) {
  const geometry = new InstancedBufferGeometry().copy(
    new PlaneGeometry(width, 1, 1, 4).translate(0, 0.5, 0),
  );
  const roots = new Float32Array(entries.length * 3);
  const blades = new Float32Array(entries.length * 4);
  entries.forEach((entry, index) => {
    entry.root.toArray(roots, index * 3);
    blades.set(entry.blade, index * 4);
  });
  geometry.setAttribute("aRoot", new InstancedBufferAttribute(roots, 3));
  geometry.setAttribute("aBlade", new InstancedBufferAttribute(blades, 4));
  geometry.instanceCount = entries.length;
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

function createFlowerHeads(material, flowers) {
  const geometry = new InstancedBufferGeometry().copy(new PlaneGeometry(1, 1));
  const roots = new Float32Array(flowers.length * 3);
  const blades = new Float32Array(flowers.length * 4);
  const kinds = new Float32Array(flowers.length);
  flowers.forEach((flower, index) => {
    flower.root.toArray(roots, index * 3);
    blades.set(flower.blade, index * 4);
    kinds[index] = flower.kind;
  });
  geometry.setAttribute("aRoot", new InstancedBufferAttribute(roots, 3));
  geometry.setAttribute("aBlade", new InstancedBufferAttribute(blades, 4));
  geometry.setAttribute("aKind", new InstancedBufferAttribute(kinds, 1));
  geometry.instanceCount = flowers.length;
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return mesh;
}

// ---------------------------------------------------------------- bird

// A small songbird, about one unit from beak to tail, facing +z. The site
// accent colour is on the bird and nowhere else in the scene.
function createBird() {
  const group = new Group();
  const body = new Group();
  group.add(body);

  const accent = new MeshStandardMaterial({ roughness: 0.55 });
  const wing = new MeshStandardMaterial({ roughness: 0.6 });
  const belly = new MeshStandardMaterial({ roughness: 0.6 });
  const beak = new MeshStandardMaterial({ color: "#e3a03a", roughness: 0.5 });
  const dark = new MeshStandardMaterial({ color: "#141214", roughness: 0.35 });
  const shine = new MeshStandardMaterial({
    color: "#ffffff",
    emissive: "#ffffff",
    emissiveIntensity: 0.6,
  });
  const legs = new MeshStandardMaterial({ color: "#5a4034", roughness: 0.8 });

  const sphere = new SphereGeometry(1, 24, 16);
  const ellipsoid = (material, [rx, ry, rz], [x, y, z]) => {
    const mesh = new Mesh(sphere, material);
    mesh.scale.set(rx, ry, rz);
    mesh.position.set(x, y, z);
    return mesh;
  };

  const torso = ellipsoid(accent, [0.25, 0.25, 0.36], [0, 0.32, 0]);
  torso.rotation.x = -0.35;
  const chest = ellipsoid(belly, [0.2, 0.2, 0.26], [0, 0.27, 0.1]);
  chest.rotation.x = -0.4;
  body.add(torso, chest);

  const tail = new Group();
  tail.position.set(0, 0.3, -0.28);
  tail.add(ellipsoid(wing, [0.11, 0.035, 0.26], [0, 0.04, -0.2]));
  tail.rotation.x = -0.45;
  body.add(tail);

  const wings = [-1, 1].map((sideSign) => {
    const pivot = new Group();
    pivot.position.set(sideSign * 0.2, 0.42, 0.04);
    const blade = ellipsoid(
      wing,
      [0.06, 0.17, 0.3],
      [sideSign * 0.04, -0.06, -0.1],
    );
    blade.rotation.x = 0.35;
    pivot.add(blade);
    body.add(pivot);
    return { pivot, sideSign };
  });

  const head = new Group();
  head.position.set(0, 0.56, 0.16);
  head.add(ellipsoid(accent, [0.19, 0.18, 0.19], [0, 0.04, 0.02]));
  head.add(ellipsoid(belly, [0.13, 0.1, 0.12], [0, -0.04, 0.1]));
  const bill = new Mesh(
    new ConeGeometry(0.05, 0.15, 10).rotateX(Math.PI / 2),
    beak,
  );
  bill.position.set(0, 0.02, 0.24);
  head.add(bill);
  for (const sideSign of [-1, 1]) {
    head.add(
      ellipsoid(dark, [0.035, 0.035, 0.035], [sideSign * 0.11, 0.08, 0.12]),
    );
    head.add(
      ellipsoid(shine, [0.011, 0.011, 0.011], [sideSign * 0.125, 0.095, 0.145]),
    );
  }
  body.add(head);

  for (const sideSign of [-1, 1]) {
    const leg = new Mesh(new CylinderGeometry(0.016, 0.016, 0.14, 6), legs);
    leg.position.set(sideSign * 0.07, 0.07, 0.03);
    group.add(leg);
  }

  return { group, body, head, tail, wings, accent, wing, belly };
}

// Every few seconds the bird either hops a little way along the bough or
// flutters its wings.
function startNextMove(state, now) {
  if (now < state.nextMove || state.hop || state.flutter) {
    return;
  }
  if (Math.random() < 0.6) {
    const step =
      (Math.random() < 0.5 ? -1 : 1) * (0.025 + Math.random() * 0.03);
    const to = MathUtils.clamp(state.at + step, state.min, state.max);
    state.hop = { from: state.at, to, start: now, duration: 0.34 };
  } else {
    state.flutter = { start: now, duration: 0.7 };
  }
  state.nextMove = now + 4 + Math.random() * 6;
}

// Moves the current hop or flutter on. Returns how high the bird is off the
// bough, in body lengths, and how far its wings are open.
function advanceMove(state, now) {
  let lift = 0;
  let flap = 0;
  if (state.hop) {
    const progress = Math.min((now - state.hop.start) / state.hop.duration, 1);
    state.at = MathUtils.lerp(state.hop.from, state.hop.to, progress);
    lift = Math.sin(progress * Math.PI) * 0.35;
    if (progress >= 1) {
      state.hop = null;
      state.tailFlick = now;
    }
  }
  if (state.flutter) {
    const progress = (now - state.flutter.start) / state.flutter.duration;
    if (progress >= 1) {
      state.flutter = null;
    } else {
      const envelope = Math.sin(progress * Math.PI);
      flap = envelope * (0.6 + 0.5 * Math.sin(progress * Math.PI * 10));
      lift = Math.max(lift, envelope * 0.12);
    }
  }
  return { lift, flap };
}

// Stands the bird on the bough at its current place along it.
function perchBird(world, lift) {
  const { bird, tree, birdState } = world;
  const point = tree.bough.getPointAt(birdState.at);
  const radius = MathUtils.lerp(
    tree.trunkRadius * 0.72,
    tree.trunkRadius * 0.16,
    birdState.at ** 0.85,
  );
  const scale = tree.birdLength;
  bird.group.position.set(
    point.x,
    point.y + radius * 0.85 + lift * scale,
    point.z + 0.05,
  );
  bird.group.scale.setScalar(scale);
}

// Where the bird wants to look: toward the pointer when it is over the hero,
// the way it is going during a hop, otherwise a slow look around, mostly
// toward the open side.
function aimBird(stage, world, pointer, now) {
  const state = world.birdState;
  const { position } = world.bird.group;
  if (state.hop) {
    return {
      yaw: Math.sign(state.hop.to - state.hop.from) * SIDE * -1.1,
      pitch: 0,
    };
  }
  if (pointer?.isOver) {
    const half = halfHeightAt(position.z);
    const dx = pointer.x * half * stage.camera.aspect - position.x;
    const dy = pointer.y * half - position.y;
    return {
      yaw: MathUtils.clamp(Math.atan2(dx, half * 0.9), -1.3, 1.3),
      pitch: MathUtils.clamp(-Math.atan2(dy, half * 1.2), -0.5, 0.6),
    };
  }
  if (now >= state.nextGlance) {
    const wayBack = Math.random() < 0.2 ? -0.6 : 1;
    state.glance = -SIDE * (0.3 + Math.random() * 0.9) * wayBack;
    state.nextGlance = now + 2.5 + Math.random() * 3;
  }
  return { yaw: state.glance, pitch: 0 };
}

// Turns, breathes, and flicks its tail; the body turns part of the way and
// the head does the rest.
function poseBird(world, aim, { flap, clock }) {
  const { bird, birdState: state } = world;
  const now = clock.time;
  const ease = 1 - 0.92 ** (clock.delta * 60);
  state.bodyYaw += (aim.yaw * 0.55 - state.bodyYaw) * ease * 0.6;
  bird.body.rotation.y = state.bodyYaw;
  bird.head.rotation.y +=
    (aim.yaw - state.bodyYaw - bird.head.rotation.y) * ease;
  bird.head.rotation.x += (aim.pitch - bird.head.rotation.x) * ease;
  bird.head.rotation.z = Math.sin(now * 0.7) * 0.06;

  bird.body.scale.y = 1 + Math.sin(now * 2.4) * 0.015;
  const sinceFlick = now - state.tailFlick;
  const flick = Math.max(0, 1 - sinceFlick * 4);
  bird.tail.rotation.x =
    -0.45 -
    0.35 * flick * Math.sin(sinceFlick * 30) -
    0.04 * Math.sin(now * 1.3);
  for (const { pivot, sideSign } of bird.wings) {
    pivot.rotation.z = -sideSign * flap * 1.1;
  }
}

function animateBird(stage, world, pointer, clock) {
  startNextMove(world.birdState, clock.time);
  const { lift, flap } = advanceMove(world.birdState, clock.time);
  perchBird(world, lift);
  poseBird(world, aimBird(stage, world, pointer, clock.time), { flap, clock });
}

// ---------------------------------------------------------------- petals

function createPetals(lightDir) {
  const random = createRandom(7);
  const geometry = new InstancedBufferGeometry().copy(new PlaneGeometry(1, 1));
  const seeds = new Float32Array(MAX_PETALS * 4);
  const seeds2 = new Float32Array(MAX_PETALS * 4);
  for (let index = 0; index < seeds.length; index++) {
    seeds[index] = random();
    seeds2[index] = random();
  }
  geometry.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 4));
  geometry.setAttribute("aSeed2", new InstancedBufferAttribute(seeds2, 4));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    defines: { MAX_COPY_LINES },
    uniforms: {
      uTime: { value: 0 },
      uBough: {
        value: [new Vector3(), new Vector3(), new Vector3(), new Vector3()],
      },
      uCrown: { value: new Vector4() },
      uSide: { value: 1 },
      uSize: { value: 0.12 },
      uBottom: { value: -3 },
      uLightDir: { value: lightDir },
      uPetalEdge: { value: new Color() },
      uPetalBase: { value: new Color() },
      uContour: { value: new Color() },
      uContourAmount: { value: 0 },
      uShade: { value: new Color() },
      uOpacity: { value: 1 },
      uCopyLines: {
        value: Array.from({ length: MAX_COPY_LINES }, () => new Vector4()),
      },
      uCopyCaps: { value: new Array(MAX_COPY_LINES).fill(1) },
      uCopyLineCount: { value: 0 },
      uCopyEdge: { value: new Vector2() },
    },
    vertexShader: PETAL_VERTEX_SHADER,
    fragmentShader: PETAL_FRAGMENT_SHADER,
  });

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  return { mesh, geometry, uniforms: material.uniforms };
}

// ---------------------------------------------------------------- copy guard

// Text keeps at least 4.5:1 (3:1 for the name) against anything drawn behind
// it. Only petals cross the copy, so each line of text in the copy gets a cap
// on petal opacity, worked out from that line's colour, the page background
// and the theme's petal colours. The cap holds even where two petals overlap.
// Copied from winter's snowfall, with petal colours.

const COPY_PAD = 4;
const COPY_FEATHER = 14;
const COPY_RATIO = 4.5;
const NAME_RATIO = 3;

const toLinear = (channel) => {
  const value = channel / 255;
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = ([red, green, blue]) =>
  0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);

const contrastRatio = (first, second) =>
  (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

const parseCssColor = (value) => {
  const match = CSS_COLOR.exec(value);
  const alpha = match?.[4] ?? "1";
  const opacity = Number.parseFloat(alpha) / (alpha.endsWith("%") ? 100 : 1);
  if (!match || opacity < 1) {
    return null;
  }
  const scale = value.startsWith("color(") ? 255 : 1;
  return [match[1] * scale, match[2] * scale, match[3] * scale];
};

const hexChannels = (hex) =>
  [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));

// Every colour a petal can show: its two body colours, its contour, and each
// of those at the deepest shade.
function petalColors(look) {
  const shade = hexChannels(look.shade).map((channel) => channel / 255);
  const body = [look.petalEdge, look.petalBase, look.contour].map(hexChannels);
  return [
    ...body,
    ...body.map((color) =>
      color.map(
        (channel, index) => channel * MathUtils.lerp(shade[index], 1, 0.45),
      ),
    ),
  ];
}

function petalCap(text, background, colors, ratio) {
  const textLuminance = luminance(text);
  const holds = (alpha) =>
    colors.every((petal) => {
      const behind = background.map(
        (channel, index) => channel + (petal[index] - channel) * alpha,
      );
      return contrastRatio(textLuminance, luminance(behind)) >= ratio;
    });

  let cap = 0;
  for (let step = 1; step <= 100; step++) {
    const single = step / 100;
    if (!holds(1 - (1 - single) ** 2)) {
      break;
    }
    cap = single;
  }
  return cap;
}

function readCopyLines(copy) {
  const lines = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.data.trim()) {
      continue;
    }
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (rect.width && rect.height) {
        lines.push({ rect, owner: node.parentElement });
      }
    }
  }
  return lines;
}

function createCopyGuard(stage, uniforms) {
  const { host, renderer, copy } = stage;
  let colors = [];
  let pageColor = [];
  // Caps by text colour and ratio, for the current theme.
  const caps = new Map();

  const setLook = (look) => {
    colors = petalColors(look);
    const page = readPageColor(host, "--fm-bg", new Color()).getRGB(
      new Color(),
      SRGBColorSpace,
    );
    pageColor = [page.r * 255, page.g * 255, page.b * 255];
    caps.clear();
  };

  const capFor = (owner) => {
    const color = getComputedStyle(owner).color;
    const ratio = owner.closest('[data-scene-accent="name"]')
      ? NAME_RATIO
      : COPY_RATIO;
    const key = `${color} ${ratio}`;
    if (!caps.has(key)) {
      const text = parseCssColor(color);
      // A colour that cannot be read keeps petals out entirely.
      caps.set(key, text ? petalCap(text, pageColor, colors, ratio) : 0);
    }
    return caps.get(key);
  };

  const measure = () => {
    const box = host.getBoundingClientRect();
    if (!copy || colors.length === 0 || !box.width || !box.height) {
      return;
    }
    const scale = renderer.domElement.width / box.width;
    const lines = readCopyLines(copy).slice(0, MAX_COPY_LINES);
    lines.forEach(({ rect, owner }, index) => {
      uniforms.uCopyLines.value[index].set(
        (rect.left - box.left) * scale,
        (box.bottom - rect.bottom) * scale,
        (rect.right - box.left) * scale,
        (box.bottom - rect.top) * scale,
      );
      uniforms.uCopyCaps.value[index] = capFor(owner);
    });
    uniforms.uCopyLineCount.value = lines.length;
    uniforms.uCopyEdge.value.set(
      COPY_PAD * scale,
      (COPY_PAD + COPY_FEATHER) * scale,
    );
  };

  return { setLook, measure };
}

// ---------------------------------------------------------------- world

// A cool edge of moonlight on the bark, so the trunk and bough do not sink
// into a dark page. Strongest where the surface turns away from the viewer.
function addRimLight(material) {
  const rim = { color: { value: new Color() }, amount: { value: 0 } };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = rim.color;
    shader.uniforms.uRimAmount = rim.amount;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uRimColor;\nuniform float uRimAmount;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float rimEdge = 1.0 - abs(dot(normal, normalize(vViewPosition)));
        totalEmissiveRadiance += uRimColor * uRimAmount * pow(rimEdge, 3.0);`,
      );
  };
  return rim;
}

function buildWorld(stage) {
  const lightDir = new Vector3(-0.45 * SIDE, 0.8, 0.4).normalize();
  const shared = {
    uTime: { value: 0 },
    uSide: { value: SIDE },
    uBackground: { value: new Color() },
    uHaze: { value: 0.3 },
  };

  const flowerUniforms = {
    uPetalEdge: { value: new Color() },
    uPetalBase: { value: new Color() },
    uCentre: { value: new Color() },
    uStamen: { value: new Color() },
    uContour: { value: new Color() },
    uContourAmount: { value: 0 },
  };
  const clusterMaterial = new ShaderMaterial({
    alphaToCoverage: true,
    uniforms: {
      ...shared,
      ...flowerUniforms,
      uShade: { value: new Color() },
      uLeaf: { value: new Color() },
      uAlphaCut: { value: 0.02 },
    },
    vertexShader: CLUSTER_VERTEX_SHADER,
    fragmentShader: CLUSTER_FRAGMENT_SHADER,
  });

  const barkMaterial = new MeshStandardMaterial({
    roughness: 0.95,
    metalness: 0,
    vertexColors: true,
  });
  const barkRim = addRimLight(barkMaterial);

  const bladeMaterial = new ShaderMaterial({
    uniforms: {
      ...shared,
      uShadowAt: { value: new Vector3() },
      uRoot: { value: new Color() },
      uTip: { value: new Color() },
      uTint: { value: new Color() },
    },
    vertexShader: BLADE_VERTEX_SHADER,
    fragmentShader: BLADE_FRAGMENT_SHADER,
  });
  const meadowFlowerMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...shared,
      uDaisy: { value: new Color() },
      uDaisyContour: { value: new Color() },
      uDaisyContourAmount: { value: 0 },
      uHeart: { value: new Color() },
      uViolet: { value: new Color() },
      uButtercup: { value: new Color() },
    },
    vertexShader: MEADOW_FLOWER_VERTEX_SHADER,
    fragmentShader: MEADOW_FLOWER_FRAGMENT_SHADER,
  });

  const petals = createPetals(lightDir);
  petals.uniforms.uSide.value = SIDE;
  const copyGuard = createCopyGuard(stage, petals.uniforms);

  const bird = createBird();

  const key = stage.key;
  key.position.set(-6 * SIDE, 9, 7);

  const layer = new Group();
  stage.scene.add(layer, petals.mesh, bird.group);

  return {
    shared,
    lightDir,
    clusterMaterial,
    barkMaterial,
    barkRim,
    bladeMaterial,
    meadowFlowerMaterial,
    petals,
    copyGuard,
    bird,
    layer,
    tree: null,
    accent: new Color(),
    birdState: {
      at: 0.6,
      min: 0.5,
      max: 0.7,
      hop: null,
      flutter: null,
      nextMove: 3,
      nextGlance: 0,
      glance: 0,
      bodyYaw: 0,
      tailFlick: -10,
    },
  };
}

function applyTheme(stage, world, theme) {
  const look = THEMES[theme] ?? THEMES.dark;
  const { hemisphere, key, host } = stage;

  hemisphere.color.set(look.sky);
  hemisphere.groundColor.set(look.ground);
  hemisphere.intensity = look.hemisphere;
  key.color.set(look.key);
  key.intensity = look.keyIntensity;

  readPageColor(host, "--fm-bg", world.shared.uBackground.value);
  world.shared.uHaze.value = look.haze;

  const cluster = world.clusterMaterial.uniforms;
  cluster.uPetalEdge.value.set(look.petalEdge);
  cluster.uPetalBase.value.set(look.petalBase);
  cluster.uCentre.value.set(look.centre);
  cluster.uStamen.value.set(look.stamen);
  cluster.uContour.value.set(look.contour);
  cluster.uContourAmount.value = look.contourAmount;
  cluster.uShade.value.set(look.shade);
  cluster.uLeaf.value.set(look.leaf);

  const petal = world.petals.uniforms;
  petal.uPetalEdge.value.set(look.petalEdge);
  petal.uPetalBase.value.set(look.petalBase);
  petal.uContour.value.set(look.contour);
  petal.uContourAmount.value = look.contourAmount;
  petal.uShade.value.set(look.shade);

  world.barkMaterial.color.set(look.bark);
  world.barkRim.color.value.set(look.barkRim);
  world.barkRim.amount.value = look.barkRimAmount;

  const blade = world.bladeMaterial.uniforms;
  blade.uRoot.value.set(look.grassRoot);
  blade.uTip.value.set(look.grassTip);
  blade.uTint.value.set(look.grassTint);
  const flower = world.meadowFlowerMaterial.uniforms;
  flower.uDaisy.value.set(look.daisy);
  flower.uDaisyContour.value.set(look.daisyContour);
  flower.uDaisyContourAmount.value = look.daisyContourAmount;
  flower.uHeart.value.set(look.heart);
  flower.uViolet.value.set(look.violet);
  flower.uButtercup.value.set(look.buttercup);

  // The bird in the site accent colour: wings a shade deeper, chest paler.
  readPageColor(host, "--fm-accent", world.accent);
  const { bird } = world;
  bird.accent.color.copy(world.accent);
  bird.accent.emissive.copy(world.accent).multiplyScalar(look.birdGlow);
  bird.wing.color.copy(world.accent).multiplyScalar(0.68);
  bird.wing.emissive.copy(bird.wing.color).multiplyScalar(look.birdGlow);
  bird.belly.color.copy(world.accent).lerp(new Color("#ffffff"), 0.62);
  bird.belly.emissive
    .copy(bird.belly.color)
    .multiplyScalar(look.birdGlow * 0.5);

  world.copyGuard.setLook(look);
  world.copyGuard.measure();
}

function applyForm(world, form) {
  world.petals.geometry.instanceCount = form.petals;
  world.clusterMaterial.uniforms.uAlphaCut.value = form.alphaCut;
  world.form = form;
  if (world.meadow) {
    world.meadow.grass.geometry.instanceCount = Math.min(
      form.blades,
      world.meadow.grass.geometry.attributes.aRoot.count,
    );
    world.meadow.stems.geometry.instanceCount = form.flowers;
    world.meadow.heads.geometry.instanceCount = form.flowers;
  }
}

function clearLayer(world) {
  for (const object of [...world.layer.children]) {
    world.layer.remove(object);
    object.geometry.dispose();
  }
}

// Rebuilds the tree and the meadow for the host's current size and the
// copy's current box.
function layOut(stage, world) {
  const { host, renderer, canvas, camera } = stage;
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) {
    return;
  }

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const view = { width, height, aspect: camera.aspect };
  const keepOut = measureKeepOut(stage, view);
  const plan = planTree(view, keepOut);
  stage.hasRoom = plan !== null;
  canvas.style.visibility = stage.hasRoom ? "" : "hidden";
  clearLayer(world);
  if (!plan) {
    return;
  }

  const tree = growTree(view, plan, keepOut);
  world.tree = tree;
  world.plan = plan;
  const bark = new Mesh(tree.barkGeometry, world.barkMaterial);
  const clusters = createClusterMesh(world.clusterMaterial, tree.clusters);

  const meadow = growMeadow(view, plan, keepOut, tree);
  world.bladeMaterial.uniforms.uShadowAt.value.copy(meadow.shadowAt);
  const grass = createBladeMesh(world.bladeMaterial, meadow.blades, 1);
  const stems = createBladeMesh(
    world.bladeMaterial,
    meadow.flowers.map((flower) => ({
      root: flower.root,
      blade: [
        flower.blade[0],
        (HERO_UNITS / height) * 1.6,
        flower.blade[2],
        flower.blade[3],
      ],
    })),
    1,
  );
  const heads = createFlowerHeads(world.meadowFlowerMaterial, meadow.flowers);
  world.layer.add(bark, clusters, grass, stems, heads);
  world.meadow = { grass, stems, heads };
  applyForm(world, world.form);

  // Petals leave the bough and the crown.
  const petal = world.petals.uniforms;
  const { v0, v1, v2, v3 } = tree.bough;
  [v0, v1, v2, v3].forEach((point, index) => {
    petal.uBough.value[index].copy(point);
  });
  petal.uCrown.value.set(
    tree.crown.centre.x,
    tree.crown.centre.y,
    0,
    tree.crown.radius,
  );
  petal.uBottom.value = -halfHeightAt(0);
  petal.uSize.value = Math.max(
    tree.clusterSize * 0.72,
    (HERO_UNITS / height) * 16,
  );

  // The bird hops only along the stretch of bough around its perch.
  const state = world.birdState;
  state.min = tree.perchAt - 0.07;
  state.max = tree.perchAt + 0.07;
  state.at = MathUtils.clamp(state.at, state.min, state.max);
  if (!state.placed) {
    state.at = tree.perchAt;
    state.placed = true;
  }

  world.copyGuard.measure();
}

function disposeScene(scene) {
  const materials = new Set();
  scene.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();
      materials.add(object.material);
    }
  });
  for (const material of materials) {
    material.dispose();
  }
}

// Tracks the pointer over the hero. The host itself takes no pointer events,
// so a click or text selection is never intercepted.
function trackPointer(stage) {
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

  const stage = createStage(host, isLighter);
  const { renderer, canvas, scene, camera } = stage;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, form.pixelRatio));

  let world = null;
  try {
    world = buildWorld(stage);
    world.form = form;
    await nextTask();
    host.append(canvas);
    layOut(stage, world);
    applyForm(world, form);
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
  let layoutRequest = null;

  const draw = (now) => {
    frameRequest = requestAnimationFrame(draw);
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
    world.petals.uniforms.uTime.value = clock.time;
    if (stage.hasRoom) {
      world.bird.group.visible = Boolean(world.tree?.birdLength);
      if (world.bird.group.visible) {
        animateBird(stage, world, tracking?.pointer, clock);
      }
      renderer.render(scene, camera);
    }

    framesDrawn += 1;
    if (framesDrawn === FRAMES_BEFORE_FADE) {
      canvas.style.opacity = "1";
    }
  };

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

  // Rebuilding the tree is cheap but not free: once per frame at most.
  const requestLayout = () => {
    if (layoutRequest === null) {
      layoutRequest = requestAnimationFrame(() => {
        layoutRequest = null;
        if (!isDestroyed) {
          layOut(stage, world);
        }
      });
    }
  };

  const resizeObserver = new ResizeObserver(requestLayout);
  const viewObserver = new IntersectionObserver((entries) => {
    isInView = entries.at(-1).isIntersecting;
    syncLoop();
  });
  const onContextLost = (event) => {
    event.preventDefault();
    isContextLost = true;
    canvas.style.opacity = "0";
    syncLoop();
  };

  resizeObserver.observe(host);
  if (stage.copy) {
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
      if (layoutRequest !== null) {
        cancelAnimationFrame(layoutRequest);
      }
      resizeObserver.disconnect();
      viewObserver.disconnect();
      tracking?.stop();
      document.removeEventListener("visibilitychange", syncLoop);
      canvas.removeEventListener("webglcontextlost", onContextLost);

      disposeScene(scene);
      canvas.remove();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
