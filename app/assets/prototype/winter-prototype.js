// PROTOTYPE, throwaway. Not production code.
// Three variants of the winter scene on the home page, switchable via
// ?variant=A|B|C on the existing "/" route (dev server only).
//   A  Drift          whole-page snowfall, snow caps on cards, a snowy band
//                     with snowman and trees above the footer
//   B  Hero vignette  the scene lives in the hero only: hills, trees, snowman;
//                     snow rests on the letters of the name and headings
//   C  Companion      light snowfall, a small snowman in the bottom-left
//                     corner, a drift building along the bottom edge, snow on
//                     letters and cards
// Extra params: ?occasion=christmas (lights on trees), ?still=1 (what
// reduced-motion visitors get: content accents only, no canvas).
import * as Three from "three";

const VARIANTS = {
  A: "Drift",
  B: "Hero vignette, round 1",
  C: "Companion",
  B2: "Hero vignette, natural",
  // Round 3 (issue #22): the B2 scene in the light theme. L* variants force
  // the light theme for the view unless ?theme=dark is given.
  L0: "Light theme as it is now",
  L1: "Blue shadow",
  L2: "Winter sky",
  L3: "Dusk pocket",
};
const params = new URLSearchParams(location.search);
const rawVariant = (params.get("variant") || "L1").toUpperCase();
const variant = rawVariant in VARIANTS ? rawVariant : "L1";
if (variant.startsWith("L") && !params.get("theme"))
  params.set("theme", "light");
const christmas = params.get("occasion") === "christmas";
const still = params.has("still")
  ? params.get("still") !== "0"
  : matchMedia("(prefers-reduced-motion: reduce)").matches;

const root = document.documentElement;
// ?theme=light|dark forces a theme for this view (handy for screenshots).
if (params.get("theme") === "light" || params.get("theme") === "dark") {
  const off = document.createElement("style");
  off.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.append(off);
  setTimeout(() => off.remove(), 400);
  root.dataset.theme = params.get("theme");
  root.style.colorScheme = params.get("theme");
}
const isLight = () => root.dataset.theme === "light";
const accent = () => (isLight() ? 0x00_6a_80 : 0x00_d9_ff);

const PALETTES = {
  dark: {
    flake: 0xea_f6_ff,
    flakeOpacity: 0.85,
    surface: 0xdb_e7_f0,
    sky: 0x9f_c0_e0,
    ground: 0x2a_3a_4d,
    hemi: 1.25,
    sun: 0xcf_e4_ff,
    sunI: 1.5,
    tree: 0x2a_6b_5c,
  },
  light: {
    flake: 0x81_96_aa,
    flakeOpacity: 0.7,
    surface: 0xf4_f8_fb,
    sky: 0xff_ff_ff,
    ground: 0x8e_a3_b6,
    hemi: 2.1,
    sun: 0xff_f1_dc,
    sunI: 1.4,
    tree: 0x1f_5a_4c,
  },
};
const pal = () => (isLight() ? PALETTES.light : PALETTES.dark);

// ---------------------------------------------------------------- stages
const stages = [];

function makeStage(canvas, fov = 50) {
  const renderer = new Three.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new Three.Scene();
  const camera = new Three.PerspectiveCamera(fov, 1, 0.1, 60);
  camera.position.z = 10;
  const hemi = new Three.HemisphereLight();
  const sun = new Three.DirectionalLight();
  sun.position.set(-4, 6, 5);
  scene.add(hemi, sun);
  const stage = {
    renderer,
    scene,
    camera,
    hemi,
    sun,
    canvas,
    visible: true,
    snowMats: [],
    treeMats: [],
    accentMats: [],
    flakes: [],
    updaters: [],
    layout: null,
    halfH: Math.tan(Three.MathUtils.degToRad(fov / 2)) * 10,
    halfW: 1,
  };
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stage.halfW = stage.halfH * camera.aspect;
    for (const f of stage.flakes) {
      const far = 16;
      const fh = 2 * Math.tan(Three.MathUtils.degToRad(fov / 2)) * far;
      f.material.uniforms.uBox.value.set(fh * camera.aspect + 2, fh, 12);
      f.material.uniforms.uScale.value = 60 * renderer.getPixelRatio();
    }
    stage.layout?.();
  };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    stage.visible = e.isIntersecting;
  }).observe(canvas);
  stage.resize = resize;
  stages.push(stage);
  return stage;
}

function applyPalette() {
  const p = pal();
  for (const s of stages) {
    s.hemi.color.set(p.sky);
    s.hemi.groundColor.set(p.ground);
    s.hemi.intensity = p.hemi;
    s.sun.color.set(p.sun);
    s.sun.intensity = p.sunI;
    for (const m of s.snowMats) m.color.set(p.surface);
    for (const m of s.treeMats) m.color.set(p.tree);
    for (const m of s.accentMats) m.color.set(accent());
    for (const f of s.flakes) {
      f.material.uniforms.uColor.value.set(p.flake);
      f.material.uniforms.uOpacity.value = p.flakeOpacity;
    }
  }
}

// ---------------------------------------------------------------- builders
function makeSnow(stage, count) {
  const geo = new Three.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos.set([Math.random(), Math.random(), Math.random()], i * 3);
    const r = Math.random();
    seed.set(
      [Math.random() * 6.283, 0.5 + Math.random(), 0.45 + r * r * 1.5],
      i * 3,
    );
  }
  geo.setAttribute("position", new Three.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new Three.BufferAttribute(seed, 3));
  geo.boundingSphere = new Three.Sphere(new Three.Vector3(), 1e4);
  const material = new Three.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uShift: { value: 0 },
      uScale: { value: 60 },
      uOpacity: { value: 1 },
      uBox: { value: new Three.Vector3(20, 15, 12) },
      uColor: { value: new Three.Color() },
    },
    vertexShader: `
      attribute vec3 aSeed;
      uniform float uTime;
      uniform float uShift;
      uniform float uScale;
      uniform vec3 uBox;
      void main() {
        vec3 p;
        float fall = uTime * (0.3 + aSeed.y * 0.4) - uShift * (0.4 + aSeed.z * 0.4);
        p.y = (fract(position.y - fall / uBox.y) - 0.5) * uBox.y;
        float drift = sin(uTime * 0.5 * aSeed.y + aSeed.x) * 0.35 + uTime * 0.07;
        p.x = (fract(position.x + drift / uBox.x) - 0.5) * uBox.x;
        p.z = (position.z - 0.5) * uBox.z;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSeed.z * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.2, d) * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }`,
  });
  const points = new Three.Points(geo, material);
  stage.flakes.push(points);
  stage.scene.add(points);
  stage.updaters.push((t) => {
    material.uniforms.uTime.value = t;
  });
  return points;
}

function snowMat(stage) {
  const m = new Three.MeshStandardMaterial({ roughness: 1 });
  stage.snowMats.push(m);
  return m;
}

function makeSnowman(stage) {
  const g = new Three.Group();
  const snow = snowMat(stage);
  const dark = new Three.MeshStandardMaterial({
    color: 0x23_27_2d,
    roughness: 0.8,
  });
  const twig = new Three.MeshStandardMaterial({
    color: 0x6b_4a_32,
    roughness: 1,
  });
  const carrot = new Three.MeshStandardMaterial({
    color: 0xf0_7a_35,
    roughness: 0.7,
  });
  const scarfMat = new Three.MeshStandardMaterial({ roughness: 0.9 });
  stage.accentMats.push(scarfMat);
  const ball = (r, y) => {
    const m = new Three.Mesh(new Three.SphereGeometry(r, 28, 20), snow);
    m.position.y = y;
    return m;
  };
  g.add(ball(0.9, 0.8), ball(0.65, 1.95));
  for (const y of [1.75, 2.1]) {
    const b = new Three.Mesh(new Three.SphereGeometry(0.06, 10, 8), dark);
    b.position.set(0, y, 0.63);
    g.add(b);
  }
  const scarf = new Three.Mesh(
    new Three.TorusGeometry(0.42, 0.12, 10, 28),
    scarfMat,
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 2.5;
  const tail = new Three.Mesh(new Three.BoxGeometry(0.2, 0.6, 0.08), scarfMat);
  tail.position.set(0.3, 2.2, 0.45);
  tail.rotation.z = -0.25;
  g.add(scarf, tail);

  const head = new Three.Group();
  head.position.y = 2.9;
  head.add(new Three.Mesh(new Three.SphereGeometry(0.46, 28, 20), snow));
  for (const x of [-0.16, 0.16]) {
    const e = new Three.Mesh(new Three.SphereGeometry(0.055, 10, 8), dark);
    e.position.set(x, 0.1, 0.41);
    head.add(e);
  }
  const nose = new Three.Mesh(new Three.ConeGeometry(0.075, 0.5, 12), carrot);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.02, 0.66);
  const brim = new Three.Mesh(
    new Three.CylinderGeometry(0.46, 0.46, 0.05, 24),
    dark,
  );
  brim.position.y = 0.36;
  const top = new Three.Mesh(
    new Three.CylinderGeometry(0.3, 0.32, 0.46, 24),
    dark,
  );
  top.position.y = 0.6;
  const band = new Three.Mesh(
    new Three.CylinderGeometry(0.33, 0.33, 0.1, 24),
    scarfMat,
  );
  band.position.y = 0.44;
  head.add(nose, brim, top, band);
  head.rotation.z = -0.06;
  g.add(head);

  const arm = (side) => {
    const pivot = new Three.Group();
    pivot.position.set(side * 0.55, 2.15, 0);
    const stick = new Three.Mesh(
      new Three.CylinderGeometry(0.03, 0.04, 1.05, 6),
      twig,
    );
    stick.position.y = 0.52;
    const finger = new Three.Mesh(
      new Three.CylinderGeometry(0.02, 0.025, 0.3, 5),
      twig,
    );
    finger.position.set(0.08, 0.85, 0);
    finger.rotation.z = -0.7;
    pivot.add(stick, finger);
    pivot.rotation.z = -side * 1.15;
    g.add(pivot);
    return pivot;
  };
  arm(-1);
  const armR = arm(1);

  let hx = 0;
  let hy = 0;
  addEventListener("pointermove", (e) => {
    hx = (e.clientX / innerWidth) * 2 - 1;
    hy = (e.clientY / innerHeight) * 2 - 1;
  });
  stage.updaters.push((t) => {
    g.rotation.z = Math.sin(t * 0.9) * 0.025;
    const r = stage.canvas.getBoundingClientRect();
    const cx = ((r.left + r.width / 2) / innerWidth) * 2 - 1;
    const tx = Three.MathUtils.clamp((hx - cx) * 0.9, -0.8, 0.8);
    head.rotation.y += (tx - head.rotation.y) * 0.06;
    head.rotation.x +=
      (Three.MathUtils.clamp(hy * 0.25, -0.2, 0.25) - head.rotation.x) * 0.06;
    const phase = t % 7;
    const wave =
      phase < 1.8
        ? Math.sin(phase * 10) * 0.3 * Math.sin((phase / 1.8) * Math.PI)
        : 0;
    armR.rotation.z =
      -1.15 +
      (phase < 1.8 ? 0.55 * Math.sin((phase / 1.8) * Math.PI) : 0) +
      wave;
  });
  return g;
}

function makeTree(stage, lit) {
  const g = new Three.Group();
  const green = new Three.MeshStandardMaterial({
    roughness: 1,
    flatShading: true,
  });
  stage.treeMats.push(green);
  const snow = snowMat(stage);
  const trunk = new Three.Mesh(
    new Three.CylinderGeometry(0.12, 0.16, 0.5, 8),
    new Three.MeshStandardMaterial({ color: 0x4a_35_26, roughness: 1 }),
  );
  trunk.position.y = 0.25;
  g.add(trunk);
  const tiers = [
    [1.0, 1.3, 0.95],
    [0.78, 1.15, 1.7],
    [0.55, 1.0, 2.4],
  ];
  const lightColors = [0xff_c8_57, 0xff_6b_6b, accent()];
  const bulbs = [];
  tiers.forEach(([r, h, y], ti) => {
    const cone = new Three.Mesh(new Three.ConeGeometry(r, h, 9), green);
    cone.position.y = y;
    cone.rotation.y = ti * 0.5;
    const cap = new Three.Mesh(
      new Three.ConeGeometry(r * 0.62, h * 0.6, 9),
      snow,
    );
    cap.position.y = y + h * 0.215;
    cap.rotation.y = ti * 0.5;
    g.add(cone, cap);
    if (lit) {
      const n = 5 + (2 - ti);
      for (let i = 0; i < n; i++) {
        const c = lightColors[(i + ti) % 3];
        const m = new Three.MeshStandardMaterial({
          color: c,
          emissive: c,
          emissiveIntensity: 2,
        });
        const b = new Three.Mesh(new Three.SphereGeometry(0.065, 8, 6), m);
        const a = (i / n) * Math.PI * 2 + ti;
        b.position.set(
          Math.cos(a) * r * 0.86,
          y - h * 0.42,
          Math.sin(a) * r * 0.86,
        );
        bulbs.push(m);
        g.add(b);
      }
    }
  });
  if (lit) {
    const sm = new Three.MeshStandardMaterial({
      color: 0xff_d7_6a,
      emissive: 0xff_c2_33,
      emissiveIntensity: 1.6,
    });
    const star = new Three.Mesh(new Three.OctahedronGeometry(0.17), sm);
    star.position.y = 3.02;
    g.add(star);
    stage.updaters.push((t) => {
      star.rotation.y = t;
      bulbs.forEach((m, i) => {
        m.emissiveIntensity = 1.3 + Math.sin(t * 2.4 + i * 1.7) * 0.9;
      });
    });
  }
  return g;
}

function makeHill(stage) {
  return new Three.Mesh(new Three.SphereGeometry(1, 48, 24), snowMat(stage));
}

// A ground scene along the bottom of a stage: hills, a tree cluster on the
// left, the snowman on the right. `opt` tunes sizes per variant.
function groundScene(stage, opt) {
  const hills = [makeHill(stage), makeHill(stage), makeHill(stage)];
  const trees = opt.trees.map(() => makeTree(stage, christmas));
  const man = makeSnowman(stage);
  stage.scene.add(...hills, ...trees, man);
  stage.layout = () => {
    const W = stage.halfW;
    const base = -stage.halfH;
    const s = Three.MathUtils.clamp(W / opt.refW, 0.5, 1) * opt.scale;
    const spec = [
      [-W * 0.5, base - 0.9 * s, 0, W * 0.95, 1.9 * s],
      [W * 0.5, base - 1.0 * s, -0.6, W * 0.9, 1.8 * s],
      [0, base - 1.2 * s, -2, W * 1.4, 2.3 * s],
    ];
    hills.forEach((h, i) => {
      const [x, y, z, sx, sy] = spec[i];
      h.position.set(x, y, z);
      h.scale.set(sx, sy, 1.5);
    });
    const hillY = (i, x, z) => {
      const [cx, cy, cz, sx, sy] = spec[i];
      const k = (x - cx) / sx;
      const kz = (z - cz) / 1.5;
      return cy + sy * Math.sqrt(Math.max(0, 1 - k * k - kz * kz)) - 0.05 * s;
    };
    trees.forEach((t, i) => {
      const [fx, ts, z] = opt.trees[i];
      const x = W * fx;
      t.position.set(x, hillY(fx < 0 ? 0 : 1, x, z), z);
      t.scale.setScalar(ts * s);
    });
    const mx = W * opt.manX;
    man.position.set(mx, hillY(1, mx, -0.3), -0.3);
    man.scale.setScalar(opt.manScale * s);
    man.rotation.y = -0.35;
  };
  stage.layout();
}

function canvasEl(className) {
  const c = document.createElement("canvas");
  c.className = className;
  c.setAttribute("aria-hidden", "true");
  return c;
}

// ---------------------------------------------------------------- accents
function mulberry(a) {
  return () => {
    a = (a + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

// Snow resting on each glyph: measure the ink box of every letter with canvas
// text metrics and place a small cap exactly on top of it.
async function letterSnow(selector) {
  await document.fonts.ready;
  const ctx = document.createElement("canvas").getContext("2d");
  const rnd = mulberry(7);
  for (const el of document.querySelectorAll(selector)) {
    // Smaller headings get snow on fewer letters so words keep their shape.
    const density = el.matches(".fm-name") ? 1 : 0.6;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const lh = parseFloat(cs.lineHeight) || fs * 1.1;
    const fm = ctx.measureText("Hg");
    const baseline =
      (lh - (fm.fontBoundingBoxAscent + fm.fontBoundingBoxDescent)) / 2 +
      fm.fontBoundingBoxAscent;
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const em = (px) => `${(px / fs).toFixed(4)}em`;
    text.split(" ").forEach((word, wi, words) => {
      const w = document.createElement("span");
      w.className = "proto-w";
      w.setAttribute("aria-hidden", "true");
      for (const ch of word) {
        const l = document.createElement("span");
        l.className = "proto-l";
        l.textContent = ch;
        const m = ctx.measureText(ch);
        const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        // Feedback round 1: no snow on tall narrow stems (h, b, d and the
        // like, plus dotted i/j and capital I); the little egg caps looked wrong.
        const tallStem = /[bdfhkltijI]/.test(ch);
        if (
          !tallStem &&
          inkW > fs * 0.08 &&
          /[\p{L}\p{N}&]/u.test(ch) &&
          rnd() < density
        ) {
          const h = fs * (0.085 + rnd() * 0.05);
          // Letters with an open top keep it open: snow sits on one stem only.
          const open = /[uvwyxkUVWYXK]/.test(ch);
          const cw = open ? inkW * 0.34 : inkW * (0.62 + rnd() * 0.3);
          l.dataset.snow = "";
          l.style.setProperty("--h", em(h));
          l.style.setProperty("--w", em(cw));
          l.style.setProperty(
            "--l",
            em(
              -m.actualBoundingBoxLeft +
                (open ? -cw * 0.1 : (inkW - cw) * (0.3 + rnd() * 0.4)),
            ),
          );
          l.style.setProperty(
            "--t",
            em(baseline - m.actualBoundingBoxAscent - h + fs * 0.012),
          );
          l.style.setProperty("--r", `${(rnd() * 8 - 4).toFixed(1)}deg`);
        }
        w.append(l);
      }
      el.append(w);
      if (wi < words.length - 1) el.append(" ");
    });
  }
}

// ---------------------------------------------------------------- variants
const body = document.body;
body.classList.add(`proto-v-${variant.toLowerCase()}`);
if (still) body.classList.add("proto-still");

function variantA() {
  body.classList.add("proto-caps");
  if (still) return;
  const fixed = canvasEl("proto-canvas-fixed");
  body.prepend(fixed);
  const sky = makeStage(fixed);
  const snow = makeSnow(sky, innerWidth < 700 ? 220 : 480);
  sky.updaters.push(() => {
    snow.material.uniforms.uShift.value = scrollY * 0.004;
  });

  const band = document.createElement("div");
  band.className = "proto-band";
  const bc = canvasEl("");
  band.append(bc);
  document.querySelector(".fm-footer").before(band);
  const ground = makeStage(bc, 30);
  groundScene(ground, {
    refW: 9,
    scale: 1,
    manX: 0.42,
    manScale: 0.62,
    trees: [
      [-0.62, 0.95, -0.4],
      [-0.47, 0.7, 0.3],
      [-0.3, 0.55, -0.8],
      [0.72, 0.6, -0.9],
    ],
  });
}

function variantB() {
  letterSnow(".fm-name, .fm-section-head h2");
  if (still) return;
  const hero = document.querySelector("#hero");
  const c = canvasEl("proto-canvas-hero");
  hero.prepend(c);
  const stage = makeStage(c, 50);
  makeSnow(stage, innerWidth < 700 ? 160 : 340);
  groundScene(stage, {
    refW: 7,
    scale: 1,
    manX: 0.58,
    manScale: 0.56,
    trees: [
      [-0.78, 1.0, -0.5],
      [-0.6, 0.72, 0.3],
      [-0.42, 0.5, -0.9],
    ],
  });
}

function variantC() {
  body.classList.add("proto-caps");
  letterSnow(".fm-name, .fm-section-head h2");
  const drift = document.createElement("div");
  drift.className = "proto-drift";
  drift.setAttribute("aria-hidden", "true");
  drift.innerHTML =
    '<svg viewBox="0 0 1200 30" preserveAspectRatio="none"><path d="M-10 31V16C60 6 130 4 210 12S380 22 470 13S640 3 740 10S900 21 990 14S1140 6 1210 12V31Z"/></svg>';
  body.append(drift);
  if (still) return;
  const fixed = canvasEl("proto-canvas-fixed");
  body.prepend(fixed);
  makeSnow(makeStage(fixed), innerWidth < 700 ? 110 : 220);

  const cc = canvasEl("proto-companion");
  body.append(cc);
  const st = makeStage(cc, 30);
  const mound = makeHill(st);
  const man = makeSnowman(st);
  const tree = makeTree(st, christmas);
  st.scene.add(mound, man, tree);
  mound.position.set(-0.3, -3.6, -0.3);
  mound.scale.set(3.4, 1.6, 2);
  man.position.set(0.35, -2.25, 0.5);
  man.scale.setScalar(0.92);
  man.rotation.y = 0.35;
  tree.position.set(-1.5, -2.35, -0.6);
  tree.scale.setScalar(0.85);
}

// Round 2 of the winning variant: same layout, natural-looking scene built
// from the research on issue #19 (see winter-round2.js).
function variantB2(look) {
  body.classList.add("proto-v-b", "proto-v-b2");
  if (look) body.classList.add(`proto-look-${look.toLowerCase()}`);
  letterSnow(".fm-name, .fm-section-head h2");
  if (still) return;
  const c = canvasEl("proto-canvas-hero");
  const sky = document.createElement("div");
  sky.className = "proto-sky";
  document.querySelector("#hero").prepend(sky, c);
  import("./winter-round2.js").then((m) =>
    m.start({ canvas: c, christmas, look }),
  );
}

({
  A: variantA,
  B: variantB,
  C: variantC,
  B2: () => variantB2(),
  L0: () => variantB2(),
  L1: () => variantB2("L1"),
  L2: () => variantB2("L2"),
  L3: () => variantB2("L3"),
})[variant]();
applyPalette();
new MutationObserver(applyPalette).observe(root, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

const clock = new Three.Clock();
function frame() {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const t = clock.getElapsedTime();
  for (const s of stages) {
    if (!s.visible) continue;
    for (const u of s.updaters) u(t);
    s.renderer.render(s.scene, s.camera);
  }
}
if (stages.length) frame();

// ---------------------------------------------------------------- switcher
function go(next) {
  const p = new URLSearchParams(location.search);
  for (const [k, v] of Object.entries(next)) {
    if (v === null) p.delete(k);
    else p.set(k, v);
  }
  location.search = p.toString();
}
const keys = Object.keys(VARIANTS);
const cycle = (d) =>
  go({
    variant: keys[(keys.indexOf(variant) + d + keys.length) % keys.length],
  });

const bar = document.createElement("div");
bar.className = "proto-bar";
bar.innerHTML = `
  <button type="button" data-a="prev" aria-label="Previous variant">←</button>
  <span class="proto-bar-label">${variant} (${VARIANTS[variant]})</span>
  <button type="button" data-a="next" aria-label="Next variant">→</button>
  <button type="button" data-a="xmas" aria-pressed="${christmas}">Christmas</button>
  <button type="button" data-a="still" aria-pressed="${still}">Still</button>`;
bar.addEventListener("click", (e) => {
  const a = e.target.closest("button")?.dataset.a;
  if (a === "prev") cycle(-1);
  if (a === "next") cycle(1);
  if (a === "xmas") go({ occasion: christmas ? null : "christmas" });
  if (a === "still") go({ still: still ? "0" : "1" });
});
body.append(bar);
addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, textarea, [contenteditable]")) return;
  if (e.key === "ArrowLeft") cycle(-1);
  if (e.key === "ArrowRight") cycle(1);
});
console.info("[winter prototype]", {
  variant,
  name: VARIANTS[variant],
  christmas,
  still,
  theme: root.dataset.theme,
});

// ?peek=<section id> hides everything above that section and reveals all
// content, so headless screenshots can see lower parts of the page.
const peek = params.get("peek");
if (peek) {
  for (const sec of document.querySelectorAll(".fm-page > section")) {
    if (sec.id === peek) break;
    sec.style.display = "none";
  }
  for (const el of document.querySelectorAll(".fm-reveal"))
    el.classList.add("is-visible");
}
