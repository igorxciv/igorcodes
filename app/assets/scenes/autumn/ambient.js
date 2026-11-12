// Autumn scene, ambient layer: green pines on the left, a deciduous tree in
// full colour on the right with a
// scarecrow in front of it, leaf-covered ground, and leaves falling from the
// tree's side of the hero. During Halloween three carved pumpkins sit on the
// ground: two at the scarecrow's feet, one by the pines.
//
// The site decides when this loads and passes a context: theme, current
// occasions, the lighter-form flag and the URLs of the files in assets/.
// Everything inside the host element is owned here, including the fade-in
// and pausing while nothing can be seen.
//
// Pine: Quaternius "Pine" (poly.pizza/m/79gmlLnweB, CC0), geometry only, with
// its foliage mask and bark colour as separate 256 px textures. This scene
// carries its own copy, so removing another scene cannot affect it.
import {
  ACESFilmicToneMapping,
  BackSide,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Euler,
  Fog,
  FrontSide,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  LatheGeometry,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Quaternion,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector2,
  Vector3,
  Vector4,
  VSMShadowMap,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const FOV = 30;
const CAMERA_Y = 1.25;
const CAMERA_Z = 13;
const HALF_FOV_TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const FADE_IN = "opacity 2.8s cubic-bezier(0.3, 0, 0.2, 1)";
// Frames to draw before the fade-in starts, so shaders and shadows are ready
// and the scene never pops in.
const FRAMES_BEFORE_FADE = 3;
const MAX_LEAVES = 40;
const CROWN_LEAVES = 1400;
// Colours in each theme's leaf palette (THEMES[theme].leaves).
const LEAF_TONES = 4;
// Lines of copy the falling leaves keep dim behind (spec 1.9); more are
// ignored.
const MAX_COPY_LINES = 24;

// The full form and the lighter form: same composition, lower cost.
const FORMS = {
  full: {
    pixelRatio: 2,
    shadowMap: 1024,
    leaves: MAX_LEAVES,
    groundSegments: [220, 110],
    fps: 60,
  },
  lighter: {
    pixelRatio: 1.5,
    shadowMap: 0,
    leaves: 18,
    groundSegments: [90, 45],
    fps: 30,
  },
};

// Per-theme look. Dark is late evening: a low warm key light from the side
// and a cool dim fill. Light is a low warm afternoon sun with long soft
// shadows. Neither paints anything behind the scene.
const THEMES = {
  dark: {
    sun: "#ffad66",
    sunIntensity: 2.6,
    sunPosition: [-10, 5, 6],
    sky: "#3a4c78",
    bounce: "#140f0b",
    hemisphereIntensity: 0.9,
    envTop: "#26304e",
    envHorizon: "#3a2618",
    envIntensity: 0.55,
    exposure: 0.95,
    soil: "#2b2016",
    // Saturated amber, orange and rust.
    leaves: ["#f2a12e", "#e8671d", "#b8431d", "#d9541f"],
    crownShade: "#8e3614",
    leafContour: 0,
    blobShadow: 0.55,
    // A steady warm glow from inside each pumpkin, lighting the ground
    // around it.
    pumpkin: "#d8691c",
    carved: "#ffb347",
    carvedGlow: 2.4,
    pumpkinLight: 1.6,
  },
  light: {
    sun: "#ffd9a3",
    sunIntensity: 3.2,
    sunPosition: [-11, 5.4, 5],
    sky: "#b6cbee",
    bounce: "#9a7c5c",
    hemisphereIntensity: 0.6,
    envTop: "#9cb5de",
    envHorizon: "#eed8bc",
    envIntensity: 0.55,
    exposure: 0.92,
    soil: "#7d5d3b",
    // Rust, burgundy and dark ochre; no pale yellow on cream.
    leaves: ["#a6401c", "#7d2233", "#a87818", "#8a3b1c"],
    crownShade: "#6a2416",
    leafContour: 1,
    blobShadow: 0.3,
    // Orange skin and dark carved faces, with only a faint inner glow and no
    // halo on the ground.
    pumpkin: "#e0661a",
    carved: "#ff9a3c",
    carvedGlow: 0.04,
    pumpkinLight: 0,
  },
};

// Pines: [x as a fraction of the half-width at that depth, z, height, turn]
const PINES = [
  [-0.84, -4.2, 4.2, 0],
  [-0.62, -7, 3.6, 2],
  [-0.44, -3.2, 2.2, 4],
];
// The deciduous tree behind the scarecrow: [fraction, z]. It is shown at the
// size it is built (see CROWN).
const TREE = [0.82, -7.5];
const SCARECROW_X = 0.62;
const SCARECROW_Z = -2;
// Halloween pumpkins at the scarecrow's feet: [x offset from him (scaled
// with the scene), z offset from him, radius, turn].
const PUMPKINS_AT_FEET = [
  [-0.62, 0.55, 0.27, 0.35],
  [0.55, 0.35, 0.22, -0.3],
];
// The Halloween pumpkin by the pines: [x as a fraction of the half-width at
// that depth, z, radius, turn].
const PUMPKIN_BY_PINES = [-0.36, -2.4, 0.3, 0.2];

// Ground height: broad swells plus small lumps.
const groundHeight = (x, z) =>
  0.3 * Math.sin(x * 0.33 + 1) * Math.cos(z * 0.4) +
  0.1 * Math.sin(x * 1.1 + z * 0.9) +
  0.04 * Math.sin(x * 3.1) * Math.sin(z * 2.7);

// The slow gust every falling leaf shares; the scarecrow's sleeve sways with
// it. The leaf shader computes the same sum.
const gustAt = (time) =>
  Math.sin(time * 0.13) * 0.6 + Math.sin(time * 0.31 + 1.7) * 0.3;

const nextTask = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

// Park-Miller generator: the same tree and leaves on every visit.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}

const CSS_COLOR =
  /(?:rgba?|color)\(\s*(?:srgb\s+)?([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?/;

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

// Adds lines to a built-in material's shaders, after the named chunks.
function extendShader(material, { uniforms, vertex, fragment }) {
  // Three keys compiled programs on onBeforeCompile's source, which is the
  // same for every material extended here; key them on the added code.
  material.customProgramCacheKey = () => JSON.stringify([vertex, fragment]);
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    for (const [chunk, code] of Object.entries(vertex)) {
      shader.vertexShader = shader.vertexShader.replace(
        `#include <${chunk}>`,
        `#include <${chunk}>\n${code}`,
      );
    }
    for (const [chunk, code] of Object.entries(fragment)) {
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <${chunk}>`,
        `#include <${chunk}>\n${code}`,
      );
    }
  };
}

const castsShadows = (object) => {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
};

// ---------------------------------------------------------------- stage

function createStage(host, form, isLighter) {
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
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = form.shadowMap > 0;
  renderer.shadowMap.type = VSMShadowMap;
  // Shadows are drawn once per layout, not every frame.
  renderer.shadowMap.autoUpdate = false;

  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    display: "block",
    inlineSize: "100%",
    blockSize: "100%",
    opacity: "0",
    transition: FADE_IN,
    // The bottom dissolves into the next section.
    maskImage: "linear-gradient(to bottom, #000 90%, transparent)",
  });

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80);
  camera.position.set(0, CAMERA_Y, CAMERA_Z);
  // Pitch up so the horizon sits about 27% up the hero.
  camera.lookAt(0, CAMERA_Y + CAMERA_Z * 0.1205, 0);

  const sun = new DirectionalLight();
  sun.castShadow = form.shadowMap > 0;
  sun.shadow.mapSize.set(form.shadowMap || 1, form.shadowMap || 1);
  sun.shadow.radius = 6;
  sun.shadow.blurSamples = 16;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  const hemisphere = new HemisphereLight();
  scene.add(sun, sun.target, hemisphere);
  scene.fog = new Fog("#000000", 21, 60);

  return { host, renderer, canvas, scene, camera, sun, hemisphere };
}

// Environment light with no file to download: a gradient sky sphere filtered
// through PMREM, rebuilt on every theme change.
function createEnvironment(stage) {
  const pmrem = new PMREMGenerator(stage.renderer);
  const sky = new SphereGeometry(20, 24, 12);
  sky.setAttribute(
    "color",
    new BufferAttribute(new Float32Array(sky.attributes.position.count * 3), 3),
  );
  const skyMaterial = new MeshBasicMaterial({
    side: BackSide,
    vertexColors: true,
  });
  const skyScene = new Scene();
  skyScene.add(new Mesh(sky, skyMaterial));
  let target = null;

  const applyTheme = (look) => {
    const colors = sky.attributes.color;
    const positions = sky.attributes.position;
    const top = new Color(look.envTop);
    const horizon = new Color(look.envHorizon);
    const mixed = new Color();
    for (let index = 0; index < positions.count; index++) {
      mixed.lerpColors(horizon, top, Math.max(0, positions.getY(index) / 20));
      colors.setXYZ(index, mixed.r, mixed.g, mixed.b);
    }
    colors.needsUpdate = true;

    target?.dispose();
    target = pmrem.fromScene(skyScene, 0.02);
    stage.scene.environment = target.texture;
    stage.scene.environmentIntensity = look.envIntensity;
  };

  const dispose = () => {
    target?.dispose();
    pmrem.dispose();
    sky.dispose();
    skyMaterial.dispose();
  };

  return { applyTheme, dispose };
}

// ---------------------------------------------------------------- ground

// Uniforms shared by the ground and the falling leaves, so one theme change
// recolours both. The tree colours its own leaf cards from the theme.
function createPalette() {
  return {
    tones: {
      value: Array.from({ length: LEAF_TONES }, () => new Color()),
    },
    soil: { value: new Color() },
    contour: { value: 0 },
  };
}

// Leaf litter drawn in the ground's fragment shader: three layers of cells,
// each holding one leaf at a random spot and turn, over the soil. Far away,
// where a cell shrinks under a pixel, the leaves blend to their average
// colour instead of shimmering.
const LITTER_GLSL = `
  #define LEAF_TONES ${LEAF_TONES}
  uniform vec3 uTones[LEAF_TONES];
  uniform vec3 uSoil;
  varying vec2 vGround;
  vec4 litterHash(vec2 cell) {
    return fract(sin(vec4(
      dot(cell, vec2(127.1, 311.7)),
      dot(cell, vec2(269.5, 183.3)),
      dot(cell, vec2(419.2, 371.9)),
      dot(cell, vec2(91.7, 233.1)))) * 43758.5453);
  }
  vec3 litter(vec2 p) {
    vec3 average = vec3(0.0);
    for (int tone = 0; tone < LEAF_TONES; tone++) {
      average += uTones[tone];
    }
    average *= 0.88 / float(LEAF_TONES);
    float lumps = 0.5 + 0.5 * sin(p.x * 1.3 + sin(p.y * 0.9) * 2.0);
    vec3 color = uSoil * mix(0.75, 1.1, lumps);
    for (int layer = 0; layer < 3; layer++) {
      vec2 q = p * 3.2 + vec2(float(layer) * 0.37, float(layer) * 0.61);
      vec2 cell = floor(q);
      vec4 h = litterHash(cell + float(layer) * 17.0);
      vec2 f = fract(q) - 0.5 - (h.xy - 0.5) * 0.4;
      float turn = h.z * 6.2832;
      vec2 d = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * f;
      float along = d.x / 0.46;
      float halfWidth = 0.2 * (1.0 - along * along);
      float edge = halfWidth - abs(d.y);
      float blur = fwidth(edge) + 0.004;
      // About a third of the cells are bare, so soil shows between leaves.
      float present = step(0.32, fract(h.w * 7.31));
      float inside = smoothstep(-blur, blur, edge) * step(abs(along), 1.0) * present;
      // Fallen leaves are duller and darker than those still falling.
      vec3 tone = mix(uSoil, uTones[int(h.w * float(LEAF_TONES) * 0.999)], mix(0.45, 0.85, h.y));
      color = mix(color, tone * mix(0.6, 0.95, h.x), inside);
    }
    float detail = smoothstep(0.25, 0.6, fwidth(p.x * 3.2) + fwidth(p.y * 3.2));
    return mix(color, mix(uSoil, average, 0.4), detail);
  }`;

function createGroundMaterial(palette) {
  const material = new MeshStandardMaterial({
    roughness: 0.95,
    transparent: true,
  });
  extendShader(material, {
    uniforms: { uTones: palette.tones, uSoil: palette.soil },
    vertex: {
      common: "varying vec2 vGround;",
      begin_vertex: "vGround = position.xz;",
    },
    fragment: {
      common: LITTER_GLSL,
      color_fragment: "diffuseColor.rgb = litter(vGround);",
      // The ground recedes and fades to transparent, so the page background
      // shows through in either theme.
      dithering_fragment:
        "gl_FragColor.a *= 1.0 - smoothstep(19.0, 30.0, vViewPosition.z);",
    },
  });
  return material;
}

function createGroundGeometry([widthSegments, depthSegments]) {
  const geometry = new PlaneGeometry(70, 36, widthSegments, depthSegments)
    .rotateX(-Math.PI / 2)
    .translate(0, 0, -6);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index++) {
    positions.setY(
      index,
      groundHeight(positions.getX(index), positions.getZ(index)),
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A lumpy ball: a welded icosphere pushed around by a few sines, with smooth
// normals. The scarecrow's sack head and the tree's crown are made of these.
function createLumpyBall(radius, seed, detail, lumpiness) {
  let geometry = new IcosahedronGeometry(radius, detail);
  geometry.deleteAttribute("uv");
  geometry.deleteAttribute("normal");
  geometry = mergeVertices(geometry);

  const positions = geometry.attributes.position;
  const point = new Vector3();
  for (let index = 0; index < positions.count; index++) {
    point.fromBufferAttribute(positions, index);
    const lump =
      Math.sin(point.x * 5 + seed) * Math.sin(point.y * 4.3 + seed * 2) +
      0.6 * Math.sin(point.z * 9 + seed) * Math.sin(point.x * 7.7);
    point.multiplyScalar(1 + lump * lumpiness);
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A tapered cylinder running from one point to another, with its radius at
// each end.
function createLimb(from, to, [radiusFrom, radiusTo], material) {
  const direction = new Vector3().subVectors(to, from);
  const limb = new Mesh(
    new CylinderGeometry(radiusTo, radiusFrom, direction.length(), 7),
    material,
  );
  limb.position.copy(from).addScaledVector(direction, 0.5);
  limb.quaternion.setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.normalize(),
  );
  return limb;
}

// ---------------------------------------------------------------- pines

async function loadPine(assets) {
  const textures = new TextureLoader();
  const [gltf, foliage, bark] = await Promise.all([
    new GLTFLoader().loadAsync(assets["pine.glb"]),
    textures.loadAsync(assets["pine-foliage.webp"]),
    textures.loadAsync(assets["pine-bark.webp"]),
  ]);
  for (const texture of [foliage, bark]) {
    texture.colorSpace = SRGBColorSpace;
    texture.flipY = false;
  }
  return { model: gltf.scene, foliage, bark };
}

// The pines, green and with the model's own textures.
function createPines(pine) {
  const materials = {
    foliage: new MeshStandardMaterial({
      map: pine.foliage,
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.9,
    }),
    bark: new MeshStandardMaterial({
      map: pine.bark,
      side: FrontSide,
      roughness: 0.9,
    }),
  };
  pine.model.traverse((object) => {
    if (object.isMesh) {
      object.material = object.material.name.includes("Leaves")
        ? materials.foliage
        : materials.bark;
    }
  });
  castsShadows(pine.model);

  // One model, reused at several sizes and turns.
  return PINES.map(([, , height, turn]) => {
    const model = pine.model.clone();
    const box = new Box3().setFromObject(model);
    model.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    const sized = new Group();
    sized.add(model);
    sized.scale.setScalar(height / (box.max.y - box.min.y));
    sized.rotation.y = turn;
    const group = new Group();
    group.add(sized);
    return group;
  });
}

// ---------------------------------------------------------------- tree

// Crown clusters of the deciduous tree: [x, y, z, radius], for a tree about
// 3.4 high. Each sits at the end of a limb from the top of the trunk.
const CROWN = [
  [0, 2.75, 0, 0.62],
  [-0.62, 2.35, 0.15, 0.52],
  [0.6, 2.4, -0.1, 0.55],
  [-0.25, 2.05, 0.5, 0.45],
  [0.3, 2.0, 0.45, 0.42],
  [0.1, 2.3, -0.55, 0.5],
  [-0.4, 2.85, -0.25, 0.42],
  [0.42, 2.9, 0.25, 0.4],
];
const TRUNK_TOP = 1.45;
const CROWN_CENTRE = new Vector3(0, 2.45, 0);

// A small leaf card: a broad diamond folded along its midrib, stem at the
// origin.
function createLeafCardGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([
        0, 0, 0, 0.35, 0.3, 0.08, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0.35, -0.3, 0.08,
      ]),
      3,
    ),
  );
  geometry.computeVertexNormals();
  return geometry;
}

// One procedural deciduous tree in full autumn colour: a trunk and limbs,
// lumpy crown clusters in a shaded tone, and leaf cards scattered over them
// in the theme's leaf colours. No model file.
function createTree() {
  const random = createRandom(1031);
  const bark = new MeshStandardMaterial({ color: "#3d2a1d", roughness: 0.95 });
  const crownShade = new MeshStandardMaterial({ roughness: 0.9 });
  const group = new Group();

  const trunkBase = new Vector3(0, 0, 0);
  const trunkTop = new Vector3(0.04, TRUNK_TOP, 0);
  group.add(createLimb(trunkBase, trunkTop, [0.17, 0.1], bark));

  for (const [index, [x, y, z, radius]] of CROWN.entries()) {
    const end = new Vector3(x * 0.8, y - radius * 0.4, z * 0.8);
    group.add(createLimb(trunkTop, end, [0.08, 0.03], bark));
    const blob = new Mesh(
      createLumpyBall(radius, index * 1.7, 2, 0.08),
      crownShade,
    );
    blob.position.set(x, y, z);
    group.add(blob);
  }

  // Leaf cards on the crown's outer surface, each turned at random.
  const cards = new InstancedMesh(
    createLeafCardGeometry(),
    new MeshStandardMaterial({ side: DoubleSide, roughness: 0.8 }),
    CROWN_LEAVES,
  );
  const tones = new Uint8Array(CROWN_LEAVES);
  const shades = new Float32Array(CROWN_LEAVES);
  const matrix = new Matrix4();
  const turn = new Quaternion();
  const point = new Vector3();
  const size = new Vector3();
  for (let index = 0; index < CROWN_LEAVES; index++) {
    const [x, y, z, radius] = CROWN[index % CROWN.length];
    // A seeded direction, uniform over the sphere.
    const rise = random() * 2 - 1;
    const around = random() * Math.PI * 2;
    const flat = Math.sqrt(1 - rise * rise);
    point.set(flat * Math.cos(around), rise, flat * Math.sin(around));
    // Keep to the side facing away from the crown's centre.
    const outward = new Vector3(x, y, z).sub(CROWN_CENTRE);
    if (outward.lengthSq() > 0.01 && point.dot(outward) < -0.2) {
      point.negate();
    }
    point.multiplyScalar(radius * (0.86 + random() * 0.18)).add({ x, y, z });
    turn.setFromEuler(
      new Euler(random() * 6.3, random() * 6.3, random() * 6.3),
    );
    size.setScalar(0.2 + random() * 0.1);
    cards.setMatrixAt(index, matrix.compose(point, turn, size));
    tones[index] = Math.floor(random() * LEAF_TONES);
    shades[index] = 0.75 + random() * 0.3;
  }
  group.add(cards);
  castsShadows(group);

  const applyTheme = (look) => {
    crownShade.color.set(look.crownShade);
    const color = new Color();
    for (let index = 0; index < CROWN_LEAVES; index++) {
      color.set(look.leaves[tones[index]]).multiplyScalar(shades[index]);
      cards.setColorAt(index, color);
    }
    cards.instanceColor.needsUpdate = true;
  };

  return { group, applyTheme };
}

// ---------------------------------------------------------------- scarecrow

// The scarecrow is built from swept and lathed cloth with its patterns drawn
// in the fragment shader: no model file and no textures. At his size on
// screen a real weave is far below a pixel, so each pattern fades to its
// average colour once its threads get finer than a pixel or two, and the
// drape, the straw and the weathering carry the look.

// Shared by both shader stages of every cloth material.
const CLOTH_VARYINGS = "varying vec2 vCloth; varying vec3 vLocal;";

// Noise; stripe() is 1 inside a band of half-width w around c, repeating
// every 1 along x; weave() is a plain weave with one thread per unit, 1 on a
// raised thread and darker where it dips under the next and through the
// gaps; weather() adds grime and sun-fading in broad patches and shades the
// inside of the cloth where it shows at an opening. Comments stay out of the
// GLSL strings, which ship as written.
const FABRIC_GLSL = `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f *= f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x),
      f.y);
  }
  float fbm(vec2 p) {
    return 0.5 * noise(p) + 0.3 * noise(p * 2.03) + 0.2 * noise(p * 4.1);
  }
  float stripe(float x, float c, float w) {
    float aa = fwidth(x);
    return 1.0 - smoothstep(-aa, aa, abs(fract(x) - c) - w);
  }
  float weave(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = abs(fract(p) - 0.5) * 2.0;
    float weftUp = step(1.0, mod(cell.x + cell.y, 2.0));
    float across = mix(f.x, f.y, weftUp);
    float along = mix(f.y, f.x, weftUp);
    float uneven = hash(vec2(mix(cell.x, cell.y, weftUp), 3.0));
    float height = 1.0 - 0.45 * smoothstep(0.5 + 0.35 * uneven, 1.0, across)
      - 0.25 * along * along - 0.5 * step(0.8, f.x) * step(0.8, f.y);
    return mix(height, 0.78, smoothstep(0.3, 0.6, max(fwidth(p.x), fwidth(p.y))));
  }
  vec3 weather(vec3 color, float amount) {
    float grime = fbm(vLocal.xy * 7.0 + vLocal.z * 5.0);
    color *= 1.0 - amount * grime;
    color = mix(color, vec3(dot(color, vec3(0.3, 0.55, 0.15))), amount * 0.6);
    return gl_FrontFacing ? color : color * 0.35;
  }`;

// Faded flannel plaid, with a placket and buttons down the front of the
// shirt (only the body reaches that high in its own coordinates).
const PLAID_GLSL = `
  vec2 p = vCloth / 0.17;
  vec3 color = mix(uA, uB,
    (stripe(p.x, 0.3, 0.14) + stripe(p.y, 0.3, 0.14)) * 0.5);
  color = mix(color, uC,
    0.7 * max(stripe(p.x, 0.72, 0.025), stripe(p.y, 0.72, 0.025)));
  float front = step(0.0, vLocal.z) * step(1.13, vLocal.y) * step(vLocal.y, 1.5);
  float aa = fwidth(vLocal.x) * 1.5;
  float seam = 1.0 - smoothstep(0.003, 0.003 + aa, abs(vLocal.x));
  float button = length(vec2(vLocal.x - 0.012, mod(vLocal.y - 1.19, 0.1) - 0.05)) - 0.01;
  color = mix(color, uB * 0.6, seam * front);
  color = mix(color, uC, (1.0 - smoothstep(-aa, aa, button)) * front);
  diffuseColor.rgb = weather(color, 0.35);`;

// Burlap with a face painted on the front in dark, dry-brushed paint: two
// round eyes and a stitched grin.
const BURLAP_GLSL = `
  vec3 color = mix(uB, uA, weave(vCloth * 90.0))
    * mix(0.85, 1.1, fbm(vCloth * vec2(5.0, 36.0)));
  vec2 p = vLocal.xy;
  float eyes = length(vec2(abs(p.x) - 0.085, p.y - 0.25) * vec2(1.0, 0.85))
    - 0.036 - 0.01 * noise(p * 70.0);
  float grin = abs(p.y - 0.13 - 2.0 * p.x * p.x);
  float line = max(grin - 0.006, abs(p.x) - 0.11);
  float stitches = max(max(abs(mod(p.x + 0.0175, 0.035) - 0.0175) - 0.005,
    grin - 0.022), abs(p.x) - 0.1);
  float face = min(eyes, min(line, stitches));
  float aa = fwidth(face);
  float ink = (1.0 - smoothstep(-aa, aa, face)) * step(0.0, vLocal.z)
    * (0.75 + 0.25 * noise(p * 120.0));
  diffuseColor.rgb = weather(mix(color, uC, ink), 0.3);`;

// Weathered felt, mottled and faded, with a darker band round the crown.
const HAT_GLSL = `
  vec3 color = mix(uB, uA, fbm(vCloth * 18.0));
  float band = smoothstep(0.012, 0.018, vLocal.y)
    * (1.0 - smoothstep(0.07, 0.076, vLocal.y))
    * step(length(vLocal.xz), 0.26);
  diffuseColor.rgb = weather(mix(color, uC, band), 0.4);`;

// A bandana in the site accent, dulled as if dyed and washed out, with
// small pale dots.
const BANDANA_GLSL = `
  vec3 color = mix(uA, uB, 0.55) * mix(0.88, 1.0, weave(vCloth * 120.0));
  float spot = length(fract(vCloth / 0.035) - 0.5) - 0.13;
  float aa = fwidth(spot);
  color = mix(color, uC, 0.6 * (1.0 - smoothstep(-aa, aa, spot)));
  diffuseColor.rgb = weather(color, 0.3);`;

// The wind the scarecrow's cloth and straw move in: the shared gust's
// strength, and the time.
const SCARECROW_WIND = { uGust: { value: 0 }, uTime: { value: 0 } };

// A cloth material: pattern is GLSL that sets diffuseColor from uA, uB and
// uC. sway moves the lower edge (uv.y = 0) with the gust.
function createCloth(pattern, colors, sway = 0) {
  const uniforms = {
    ...SCARECROW_WIND,
    uSway: { value: sway },
    uA: { value: new Color(colors[0]) },
    uB: { value: new Color(colors[1]) },
    uC: { value: new Color(colors[2]) },
  };
  const material = new MeshStandardMaterial({ roughness: 1, side: DoubleSide });
  extendShader(material, {
    uniforms,
    vertex: {
      common: `${CLOTH_VARYINGS} uniform float uGust; uniform float uSway;`,
      begin_vertex: `vCloth = uv; vLocal = position;
        transformed.xz += uGust * uSway * (1.0 - uv.y) * (1.0 - uv.y)
          * vec2(1.0, 0.4);`,
    },
    fragment: { common: CLOTH_VARYINGS + FABRIC_GLSL, color_fragment: pattern },
  });
  material.uniforms = uniforms;
  return material;
}

// Scales a geometry's uv so the patterns repeat at a set size in world units.
function scaleUv(geometry, width, height) {
  const uv = geometry.attributes.uv;
  for (let index = 0; index < uv.count; index++) {
    uv.setXY(index, uv.getX(index) * width, uv.getY(index) * height);
  }
  return geometry;
}

// A lathed piece of cloth from [radius, y] points, the seam at the back.
// shape(point, angle, along) pushes each vertex: along runs 0 to 1 over the
// profile.
function createLathe(profile, segments, shape) {
  const geometry = new LatheGeometry(
    profile.map(([radius, y]) => new Vector2(radius, y)),
    segments,
    Math.PI,
  );
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const point = new Vector3();
  for (let index = 0; index < positions.count; index++) {
    point.fromBufferAttribute(positions, index);
    shape(point, (uv.getX(index) + 0.5) * Math.PI * 2, uv.getY(index));
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A sleeve section along +x, open at both ends. The bar runs near the top
// inside it, so the cloth below hangs lower than above, and lengthwise folds
// gather towards the middle. uv.y is 1 at the loose end.
function createSleeveGeometry(length, radius, seed) {
  const sides = 14;
  const rings = 8;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring++) {
    const along = ring / rings;
    const r = radius(along);
    for (let side = 0; side <= sides; side++) {
      const angle = (side / sides) * Math.PI * 2;
      const fold =
        1 + 0.1 * Math.sin(angle * 5 + along * 7 + seed) * Math.sin(along * 3);
      const y = Math.cos(angle) * r * fold;
      positions.push(
        along * length,
        (y < 0 ? y * 1.6 : y) - r * 0.5,
        Math.sin(angle) * r * fold,
      );
      uvs.push((side / sides) * 0.6, along);
      if (ring > 0 && side > 0) {
        const a = ring * (sides + 1) + side;
        const b = a - sides - 1;
        indices.push(b - 1, b, a - 1, b, a, a - 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return scaleUv(geometry, 1, length);
}

// One straw: a thin tapered blade, slightly curved, from 0 to 1 along +y.
function createStrawBlade() {
  const positions = [];
  for (let step = 0; step <= 3; step++) {
    const y = step / 3;
    const half = 0.006 * (1 - y * 0.7);
    positions.push(-half, y, y * y * 0.08, half, y, y * y * 0.08);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6, 5, 7, 6]);
  geometry.computeVertexNormals();
  return geometry;
}

const STRAW_COLORS = ["#dcc07c", "#c19a52", "#a88a5a", "#8c7a58"];

// Straw blades in one draw call, spilling from rings of openings. Each
// emitter is [centre, ring radius, direction, spread, length, count]; blades
// start round the ring, splay outwards and droop. The tips flutter.
function createStraw(material, blade, emitters, seed) {
  const random = createRandom(seed);
  const count = emitters.reduce((sum, emitter) => sum + emitter[5], 0);
  const straw = new InstancedMesh(blade, material, count);
  const matrix = new Matrix4();
  const turn = new Quaternion();
  const roll = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const color = new Color();
  let index = 0;
  for (const [centre, ring, direction, spread, length, total] of emitters) {
    const axis = new Vector3(...direction).normalize();
    const across = new Vector3()
      .crossVectors(axis, Math.abs(axis.y) > 0.9 ? new Vector3(1, 0, 0) : up)
      .normalize();
    const across2 = new Vector3().crossVectors(axis, across);
    for (let made = 0; made < total; made++, index++) {
      const angle = random() * Math.PI * 2;
      const out = across
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(across2, Math.sin(angle));
      const base = new Vector3(...centre).addScaledVector(
        out,
        ring * (0.6 + random() * 0.4),
      );
      const heading = axis
        .clone()
        .addScaledVector(out, 0.5 + random() * spread)
        .add(
          new Vector3(
            random() - 0.5,
            random() - 0.8,
            random() - 0.5,
          ).multiplyScalar(spread),
        )
        .normalize();
      turn.setFromUnitVectors(up, heading);
      roll.setFromAxisAngle(up, random() * Math.PI * 2);
      const size = length * (0.45 + random() * 0.75);
      straw.setMatrixAt(
        index,
        matrix.compose(base, turn.multiply(roll), new Vector3(1, size, 1)),
      );
      color
        .set(STRAW_COLORS[Math.floor(random() * STRAW_COLORS.length)])
        .multiplyScalar(0.8 + random() * 0.35);
      straw.setColorAt(index, color);
    }
  }
  return straw;
}

function createStrawMaterial() {
  const material = new MeshStandardMaterial({
    roughness: 0.7,
    side: DoubleSide,
  });
  extendShader(material, {
    uniforms: SCARECROW_WIND,
    vertex: {
      common: "uniform float uGust; uniform float uTime;",
      begin_vertex: `transformed.x += sin(uTime * 2.6 + float(gl_InstanceID) * 2.4)
        * position.y * position.y * (0.03 + 0.12 * uGust);`,
    },
    fragment: {},
  });
  return material;
}

// A sleeve draped over one arm of the crossbar, built for the right side and
// mirrored for the left. Its loose end hangs past the bar's tip and can
// sway; straw spills from the cuff.
function createSleeve(side, plaid, straw, blade) {
  const sleeve = new Group();
  sleeve.position.set(side * 0.2, 1.47, 0);
  sleeve.scale.x = side;
  sleeve.add(
    new Mesh(
      createSleeveGeometry(0.27, (along) => 0.105 - along * 0.01, side),
      plaid,
    ),
  );

  const loose = new Group();
  loose.position.x = 0.26;
  loose.rotation.z = -0.32;
  const cuff = new Mesh(
    createSleeveGeometry(
      0.21,
      (along) => 0.095 - along * 0.012 + Math.max(0, along - 0.8) * 0.08,
      side + 4,
    ),
    plaid,
  );
  loose.add(
    cuff,
    createStraw(
      straw,
      blade,
      [[[0.19, -0.05, 0], 0.06, [1, -0.5, 0], 0.5, 0.2, 70]],
      side + 7,
    ),
  );
  sleeve.add(loose);
  return { sleeve, loose };
}

// The head is its own group so it can turn without the body: a burlap sack
// stuffed round, gathered at the neck and tied with twine, the spare cloth
// below the tie spread over the collar; straw hair under a floppy felt hat.
function createScarecrowHead(straw, blade, twine) {
  const head = new Group();
  head.position.y = 1.64;
  const lean = new Group();
  lean.rotation.set(0.12, 0, 0.1);
  lean.scale.setScalar(0.8);
  head.add(lean);

  const burlap = createCloth(BURLAP_GLSL, ["#a8977a", "#6e604c", "#1c1612"]);
  const sack = new Mesh(
    scaleUv(
      createLathe(
        [
          [0.17, -0.075],
          [0.12, -0.04],
          [0.055, 0],
          [0.1, 0.04],
          [0.22, 0.13],
          [0.265, 0.24],
          [0.25, 0.35],
          [0.2, 0.44],
          [0.1, 0.5],
          [0.001, 0.52],
        ],
        40,
        (point, angle, along) => {
          // Pleats gathered into the tie, a ragged edge to the spare cloth,
          // lumpy stuffing, and the top sagging to one side.
          const gather = Math.exp(-(((point.y - 0.01) / 0.07) ** 2));
          const lump =
            Math.sin(angle * 3 + point.y * 9) *
              Math.sin(point.y * 7 + 1) *
              0.06 +
            Math.sin(angle * 5 + 2) * 0.025 +
            Math.sin(angle * 2 - point.y * 5) * 0.03;
          const scale =
            1 +
            gather * 0.18 * Math.sin(angle * 14) +
            (point.y > 0.06 ? lump : 0);
          point.x *= scale;
          point.z *= scale * 0.95;
          if (along === 0) {
            point.y += Math.sin(angle * 6) * 0.02 + Math.sin(angle * 11) * 0.01;
          }
          point.x += (Math.max(0, point.y) / 0.52) ** 2 * 0.04;
        },
      ),
      1.7,
      1.1,
    ),
    burlap,
  );
  const tie = new Mesh(new TorusGeometry(0.062, 0.012, 5, 20), twine);
  tie.rotation.x = Math.PI / 2;
  tie.position.y = 0.005;

  const hat = new Mesh(
    scaleUv(
      createLathe(
        [
          [0.5, -0.02],
          [0.36, 0],
          [0.25, 0.01],
          [0.245, 0.1],
          [0.22, 0.18],
          [0.15, 0.22],
          [0.001, 0.19],
        ],
        40,
        (point, angle) => {
          // A floppy brim that dips front and back, and a crown pinched in
          // at the front.
          const reach = Math.hypot(point.x, point.z);
          point.y +=
            MathUtils.smoothstep(reach, 0.26, 0.5) *
            (Math.cos(angle * 2) * 0.05 + Math.sin(angle * 5) * 0.012);
          if (point.y > 0.12) {
            point.z *= 1 - 0.18 * Math.max(0, Math.cos(angle)) ** 2;
          }
        },
      ),
      2.4,
      1,
    ),
    createCloth(HAT_GLSL, ["#7d6045", "#54402d", "#2a1f17"]),
  );
  hat.position.set(0.03, 0.4, -0.01);
  hat.rotation.set(-0.08, 0, -0.16);

  lean.add(
    sack,
    tie,
    hat,
    createStraw(
      straw,
      blade,
      [[[0.02, 0.4, -0.02], 0.25, [0, -1, 0], 0.6, 0.14, 80]],
      5,
    ),
  );
  return head;
}

// A procedural scarecrow, the scene character: a post and crossbar wearing
// a faded flannel shirt cinched with twine, straw spilling from the cuffs
// and the hem, a sack head, and a bandana in the site accent colour.
function createScarecrow() {
  const group = new Group();
  const wood = new MeshStandardMaterial({ color: "#5a4330", roughness: 0.95 });
  const twine = new MeshStandardMaterial({ color: "#8d7650", roughness: 1 });
  const flannel = ["#5d7378", "#2b3336", "#c8b78e"];
  // The same cloth; only the shirt's hem moves in the wind.
  const plaid = createCloth(PLAID_GLSL, flannel, 0.05);
  const sleeves = createCloth(PLAID_GLSL, flannel);
  const straw = createStrawMaterial();
  const blade = createStrawBlade();

  const post = new Mesh(new CylinderGeometry(0.035, 0.045, 1.95, 6), wood);
  post.position.y = 0.97;
  const bar = new Mesh(
    new CylinderGeometry(0.028, 0.028, 1, 6).rotateZ(Math.PI / 2),
    wood,
  );
  bar.position.y = 1.47;

  // The body: shoulders squared by the bar, the cloth falling in folds below
  // them and cinched at the waist, an uneven hem.
  const body = new Group();
  body.scale.z = 0.72;
  const shirt = new Mesh(
    scaleUv(
      createLathe(
        [
          [0.27, 0.9],
          [0.25, 1.0],
          [0.2, 1.1],
          [0.235, 1.22],
          [0.25, 1.36],
          [0.255, 1.46],
          [0.2, 1.54],
          [0.11, 1.6],
          [0.075, 1.64],
        ],
        40,
        (point, angle, along) => {
          const drop = MathUtils.smoothstep(1.5 - point.y, 0, 0.55);
          const fold =
            Math.sin(angle * 7 + Math.sin(angle * 3) * 1.5) * 0.6 +
            Math.sin(angle * 13 + 1) * 0.4;
          const scale = 1 + drop * 0.07 * fold;
          point.x *= scale;
          point.z *= scale;
          if (along === 0) {
            point.y +=
              Math.sin(angle * 5) * 0.025 + Math.sin(angle * 11) * 0.01;
          }
        },
      ),
      1.5,
      0.8,
    ),
    plaid,
  );
  const belt = new Mesh(new TorusGeometry(0.205, 0.014, 5, 32), twine);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 1.1;

  const bandana = createCloth(BANDANA_GLSL, ["#000000", "#6b5d4e", "#e6dccb"]);
  const kerchief = new Mesh(
    scaleUv(
      createLathe(
        [
          [0.215, 1.525],
          [0.18, 1.565],
          [0.135, 1.61],
          [0.095, 1.645],
        ],
        32,
        (point, angle, along) => {
          // Knotted at the back, its point hanging down the chest.
          const front = Math.max(0, Math.cos(angle)) ** 4;
          if (along === 0) {
            point.y -= front * 0.14;
            point.z += front * 0.08;
          }
          point.x *= 1 + Math.sin(angle * 9) * 0.04;
        },
      ),
      0.8,
      0.15,
    ),
    bandana,
  );

  body.add(
    shirt,
    belt,
    kerchief,
    createStraw(
      straw,
      blade,
      [
        [[0, 0.93, 0], 0.24, [0, -1, 0], 0.5, 0.2, 150],
        [[0, 1.08, 0], 0.2, [0, -0.6, 0], 0.4, 0.09, 40],
      ],
      31,
    ),
  );

  const left = createSleeve(-1, sleeves, straw, blade);
  const right = createSleeve(1, sleeves, straw, blade);
  const head = createScarecrowHead(straw, blade, twine);

  group.add(post, bar, body, left.sleeve, right.sleeve, head);
  group.rotation.y = -0.4;
  // The post has settled a little off true.
  group.rotation.x = 0.03;
  castsShadows(group);

  return {
    group,
    head,
    sleeves: [left.loose, right.loose],
    accent: { color: bandana.uniforms.uA.value },
  };
}

// ---------------------------------------------------------------- Halloween

// A pumpkin of unit radius: eight lobes with sharp grooves, squashed, with
// dimpled poles.
function createPumpkinGeometry() {
  let geometry = new SphereGeometry(1, 40, 24);
  geometry.deleteAttribute("uv");
  geometry.deleteAttribute("normal");
  geometry = mergeVertices(geometry);
  const positions = geometry.attributes.position;
  const point = new Vector3();
  for (let index = 0; index < positions.count; index++) {
    point.fromBufferAttribute(positions, index);
    const around = Math.atan2(point.z, point.x);
    const lobes = 0.9 + 0.1 * Math.abs(Math.sin(around * 4)) ** 0.5;
    const reach = Math.hypot(point.x, point.z);
    point.x *= lobes;
    point.z *= lobes;
    point.y *= 0.72 * (0.72 + 0.28 * Math.min(1, reach * 1.8));
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// The carved face, drawn in the pumpkin's fragment shader from its own
// coordinates: two triangle eyes, a nose and a toothy grin facing +z.
const CARVING_GLSL = `
  uniform vec3 uCarved;
  uniform float uCarvedGlow;
  varying vec3 vPumpkin;
  float triangleUp(vec2 p, vec2 centre, float halfWidth, float height) {
    vec2 d = p - centre;
    float top = height * 0.5 - d.y;
    float bottom = d.y + height * 0.5;
    float side = halfWidth * top / height - abs(d.x);
    return min(min(top, bottom), side);
  }
  float carving() {
    if (vPumpkin.z <= 0.0) return 0.0;
    vec2 p = vec2(atan(vPumpkin.x, vPumpkin.z), vPumpkin.y / 0.72);
    float eyes = max(
      triangleUp(p, vec2(-0.36, 0.24), 0.16, 0.24),
      triangleUp(p, vec2(0.36, 0.24), 0.16, 0.24));
    float nose = triangleUp(p, vec2(0.0, 0.02), 0.08, 0.13);
    float top = -0.16 + 0.3 * p.x * p.x;
    float tooth = step(abs(abs(p.x) - 0.2), 0.055);
    top -= tooth * 0.08;
    float bottom = -0.44 + 0.42 * p.x * p.x;
    float mouth = min(min(top - p.y, p.y - bottom), 0.55 - abs(p.x));
    float shape = max(max(eyes, nose), mouth);
    float blur = fwidth(shape) + 0.002;
    return smoothstep(-blur, blur, shape);
  }`;

function createPumpkinMaterial() {
  const uniforms = {
    uCarved: { value: new Color() },
    uCarvedGlow: { value: 0 },
  };
  const skin = new MeshStandardMaterial({ roughness: 0.55 });
  extendShader(skin, {
    uniforms,
    vertex: {
      common: "varying vec3 vPumpkin;",
      begin_vertex: "vPumpkin = position;",
    },
    fragment: {
      common: CARVING_GLSL,
      color_fragment:
        "float carved = carving();\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03, 0.012, 0.004), carved);",
      emissivemap_fragment:
        "totalEmissiveRadiance += uCarved * uCarvedGlow * carved;",
    },
  });
  return { skin, uniforms };
}

// Three carved pumpkins. In the dark theme a steady warm light inside each
// lights the ground just around it; in the light theme they read by colour
// and their dark faces, with a faint inner glow and no halo. The glow never
// flickers.
function createHalloween() {
  const geometry = createPumpkinGeometry();
  const { skin, uniforms } = createPumpkinMaterial();
  const stalk = new MeshStandardMaterial({ color: "#5a5426", roughness: 0.9 });
  const stalkGeometry = new CylinderGeometry(0.05, 0.085, 0.28, 6)
    .translate(0, 0.14, 0)
    .rotateZ(0.25);

  const pumpkins = [...PUMPKINS_AT_FEET, PUMPKIN_BY_PINES].map(
    ([, , radius, turn]) => {
      const group = new Group();
      const body = new Mesh(geometry, skin);
      const stem = new Mesh(stalkGeometry, stalk);
      stem.position.y = 0.45;
      const light = new PointLight("#ff9a3c", 0, 2.4, 2);
      light.position.set(0, 0.1, 0.35);
      group.add(castsShadows(body), castsShadows(stem), light);
      group.rotation.y = turn;
      return { group, light, radius };
    },
  );

  const applyTheme = (look) => {
    skin.color.set(look.pumpkin);
    uniforms.uCarved.value.set(look.carved);
    uniforms.uCarvedGlow.value = look.carvedGlow;
    for (const { light } of pumpkins) {
      light.color.set(look.carved);
      light.intensity = look.pumpkinLight;
    }
  };

  return { pumpkins, applyTheme };
}

// ---------------------------------------------------------------- falling leaves

const LEAF_VERTEX_SHADER = `
  attribute vec4 release;
  attribute vec4 traits;
  uniform float uTime;
  uniform vec3 uSource;
  uniform vec3 uSpread;
  uniform float uDrift;
  uniform float uSize;
  uniform vec3 uTones[LEAF_TONES];
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    // Each leaf leaves the tree, falls to the ground over its life and
    // starts again; it fades in and out at both ends.
    float life = mix(9.0, 15.0, traits.w);
    float t = fract(uTime / life + release.w);
    vec3 p = uSource + (release.xyz * 2.0 - 1.0) * uSpread;
    p.y = mix(p.y, 0.05, t);
    // All of them share one slow gust; each also swings like a pendulum as
    // it falls, on its own rhythm.
    float gust = sin(uTime * 0.13) * 0.6 + sin(uTime * 0.31 + 1.7) * 0.3;
    float rate = 1.1 + traits.y * 0.9;
    float swing = sin(uTime * rate + release.w * 40.0);
    p.x += swing * 0.32 - t * uDrift * (0.6 + 0.4 * traits.y) - gust * 1.2 * t;
    p.y += abs(swing) * 0.08;
    p.z += cos(uTime * 0.6 + release.x * 30.0) * 0.3;
    vAlpha = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.86, 1.0, t));

    // Tumbling: a spin in the leaf's plane and a slower flip through it.
    float spin = uTime * (traits.y - 0.5) * 2.4 + release.w * 6.2832;
    float flip = uTime * mix(0.7, 1.9, traits.z) + release.x * 6.2832;
    vec3 corner = vec3(position.xy * mix(0.75, 1.25, traits.z) * uSize, 0.0);
    corner.xy = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * corner.xy;
    corner.xz = mat2(cos(flip), -sin(flip), sin(flip), cos(flip)) * corner.xz;
    // Turned edge-on it darkens, turned flat to the light it brightens.
    vColor = uTones[int(traits.x * float(LEAF_TONES) * 0.999)] * mix(0.62, 1.0, abs(cos(flip)));
    vUv = position.xy * 2.0;
    vSeed = release.y * 40.0;
    gl_Position = projectionMatrix * viewMatrix * vec4(p + corner, 1.0);
  }`;

const LEAF_FRAGMENT_SHADER = `
  uniform float uContour;
  uniform vec4 uCopyLines[MAX_COPY_LINES];
  uniform float uCopyCaps[MAX_COPY_LINES];
  uniform int uCopyLineCount;
  uniform vec2 uCopyEdge;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    // A pointed leaf along x with a few lobes on its edge, a midrib and a
    // short stem.
    float along = vUv.x;
    float halfWidth = 0.46 * (1.0 - along * along) * (1.0 + 0.2 * along);
    halfWidth *= 1.0 + 0.14 * sin(along * 14.0 + vSeed);
    float edge = halfWidth - abs(vUv.y);
    float stem = step(-1.0, along) * step(along, -0.78) * step(abs(vUv.y), 0.035);
    float blur = fwidth(edge) + 0.01;
    float shape = max(smoothstep(-blur, blur, edge) * step(abs(along), 0.98), stem);
    float alpha = shape * vAlpha;
    // Behind a line of the page's copy a leaf is held under that line's
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
    // The midrib, and on cream a thin darker contour, keep the shape.
    float rib = 1.0 - smoothstep(0.02, 0.05, abs(vUv.y)) * step(along, 0.9);
    float contour = uContour * (1.0 - smoothstep(0.0, 0.07, edge));
    vec3 col = vColor * (1.0 - 0.38 * max(rib, max(contour, stem)));
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }`;

// One instanced-quad mesh, one draw call, animated in the vertex shader.
function createFallingLeaves(palette) {
  const random = createRandom(97);
  const geometry = new InstancedBufferGeometry().copy(new PlaneGeometry(1, 1));
  const release = new Float32Array(MAX_LEAVES * 4);
  const traits = new Float32Array(MAX_LEAVES * 4);
  for (let index = 0; index < release.length; index++) {
    release[index] = random();
    traits[index] = random();
  }
  geometry.setAttribute("release", new InstancedBufferAttribute(release, 4));
  geometry.setAttribute("traits", new InstancedBufferAttribute(traits, 4));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    defines: { MAX_COPY_LINES, LEAF_TONES },
    uniforms: {
      uTime: { value: 0 },
      uSource: { value: new Vector3() },
      uSpread: { value: new Vector3() },
      uDrift: { value: 4 },
      uSize: { value: 0.24 },
      uTones: palette.tones,
      uContour: palette.contour,
      // Filled by the copy guard, in drawing-buffer pixels.
      uCopyLines: {
        value: Array.from({ length: MAX_COPY_LINES }, () => new Vector4()),
      },
      uCopyCaps: { value: new Array(MAX_COPY_LINES).fill(1) },
      uCopyLineCount: { value: 0 },
      uCopyEdge: { value: new Vector2() },
    },
    vertexShader: LEAF_VERTEX_SHADER,
    fragmentShader: LEAF_FRAGMENT_SHADER,
  });

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return { mesh, geometry, uniforms: material.uniforms };
}

// ---------------------------------------------------------------- copy guard

// Text keeps at least 4.5:1 (3:1 for the name) against anything drawn behind
// it (spec 1.9). Only falling leaves cross the copy, so each line of text in
// the page's "copy" hook gets a cap on leaf opacity, worked out from that
// line's colour, the page background and every colour a leaf can be drawn
// in. The cap holds even where two leaves overlap, so the leaves fade away
// from the copy.

// Room around a line before leaves start to recover, and the width of the
// recovery, in CSS pixels.
const COPY_PAD = 4;
const COPY_FEATHER = 14;
const COPY_RATIO = 4.5;
const NAME_RATIO = 3;
// Longer than the slowest transition on the copy (the 1.8 s hero lift).
const COPY_TRANSITION_WATCH_MS = 2000;
// The darkest and lightest a leaf is shaded, as multiples of its tone.
const LEAF_SHADES = [0.62 * 0.62, 1];

const toLinear = (channel) => {
  const value = channel / 255;
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

// WCAG relative luminance of an sRGB colour with 0-255 channels.
const luminance = ([red, green, blue]) =>
  0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);

const contrastRatio = (first, second) =>
  (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

// A solid colour as 0-255 sRGB channels, or null when it cannot be read or
// is translucent, since what shows through it is unknown.
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

// Every colour a leaf can show, as 0-255 sRGB channels: each tone at its
// darkest and lightest shading. Shading is applied in linear light.
function leafColors(look) {
  const colors = [];
  const color = new Color();
  for (const tone of look.leaves) {
    for (const shade of LEAF_SHADES) {
      color.set(tone).multiplyScalar(shade);
      const srgb = color.getRGB(new Color(), SRGBColorSpace);
      colors.push([srgb.r * 255, srgb.g * 255, srgb.b * 255]);
    }
  }
  return colors;
}

// The strongest leaf opacity at which text of this colour still holds its
// ratio against the page background with any leaf colour behind it, two
// leaves deep. The canvas blends in sRGB, so the mix is done there too.
function leafCap(text, background, colors, ratio) {
  const textLuminance = luminance(text);
  const holds = (alpha) =>
    colors.every((leaf) => {
      const behind = background.map(
        (channel, index) => channel + (leaf[index] - channel) * alpha,
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

// Every line box of text in the copy, with the element that colours it.
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
  const { host, renderer } = stage;
  const copy = host.parentElement?.querySelector("[data-scene-copy]") ?? null;
  let colors = [];
  let pageColor = [];
  // Caps by text colour and ratio, for the current theme.
  const caps = new Map();

  // Called on every theme change, after the page has switched theme.
  const setLook = (look) => {
    colors = leafColors(look);
    const page = readPageColor(host, "--fm-bg", new Color()).getRGB(
      new Color(),
      SRGBColorSpace,
    );
    pageColor = [page.r * 255, page.g * 255, page.b * 255];
    caps.clear();
  };

  // The leaf cap for one text node, from its colour and its role.
  const capFor = (owner) => {
    const color = getComputedStyle(owner).color;
    const ratio = owner.closest('[data-scene-accent="name"]')
      ? NAME_RATIO
      : COPY_RATIO;
    const key = `${color} ${ratio}`;
    if (!caps.has(key)) {
      const text = parseCssColor(color);
      // A colour that cannot be read keeps leaves out entirely.
      caps.set(key, text ? leafCap(text, pageColor, colors, ratio) : 0);
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
      // gl_FragCoord counts from the bottom left of the drawing buffer.
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

  return { copy, setLook, measure };
}

// ---------------------------------------------------------------- blob shadows

// The lighter form has no shadow map: a soft dark blob sits under each
// object instead.
function createBlobShadows(count) {
  const strength = { value: 0.5 };
  const geometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uStrength: strength },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        float falloff = smoothstep(1.0, 0.0, length(vUv - 0.5) * 2.0);
        gl_FragColor = vec4(0.08, 0.05, 0.03, falloff * falloff * uStrength);
        #include <colorspace_fragment>
      }`,
  });

  const group = new Group();
  const blobs = Array.from({ length: count }, () => {
    const blob = new Mesh(geometry, material);
    blob.renderOrder = 1;
    group.add(blob);
    return blob;
  });

  // Lay one blob under an object standing at (x, z), offset away from the sun.
  const place = (index, { x, z }, radius) => {
    const blob = blobs[index];
    const shadowX = x + radius * 0.45;
    const shadowZ = z - radius * 0.2;
    blob.position.set(shadowX, groundHeight(shadowX, shadowZ) + 0.06, shadowZ);
    blob.scale.set(radius * 3.4, 1, radius * 1.7);
  };

  return { group, place, strength };
}

// ---------------------------------------------------------------- scene

function buildWorld(stage, pine, context) {
  const form = context.lighter ? FORMS.lighter : FORMS.full;
  const palette = createPalette();
  const environment = createEnvironment(stage);

  const ground = new Mesh(
    createGroundGeometry(form.groundSegments),
    createGroundMaterial(palette),
  );
  ground.receiveShadow = true;

  const pines = createPines(pine);
  const tree = createTree();
  const scarecrow = createScarecrow();
  const leaves = createFallingLeaves(palette);
  leaves.geometry.instanceCount = form.leaves;
  const copyGuard = createCopyGuard(stage, leaves.uniforms);
  const halloween = context.occasions.includes("halloween")
    ? createHalloween()
    : null;
  const pumpkins = halloween?.pumpkins ?? [];
  // One blob under each pine, the tree, the scarecrow and each pumpkin.
  const blobShadows = createBlobShadows(pines.length + 2 + pumpkins.length);
  blobShadows.group.visible = form.shadowMap === 0;

  stage.scene.add(
    ground,
    ...pines,
    tree.group,
    scarecrow.group,
    ...pumpkins.map((pumpkin) => pumpkin.group),
    blobShadows.group,
    leaves.mesh,
  );

  return {
    palette,
    environment,
    ground,
    pines,
    tree,
    scarecrow,
    leaves,
    copyGuard,
    blobShadows,
    halloween,
  };
}

function applyTheme(stage, world, theme) {
  const look = THEMES[theme] ?? THEMES.dark;
  const { sun, hemisphere, renderer, scene, host } = stage;

  sun.color.set(look.sun);
  sun.intensity = look.sunIntensity;
  sun.position.set(...look.sunPosition);
  hemisphere.color.set(look.sky);
  hemisphere.groundColor.set(look.bounce);
  hemisphere.intensity = look.hemisphereIntensity;
  renderer.toneMappingExposure = look.exposure;
  renderer.shadowMap.needsUpdate = true;

  // Fog in the page background colour; scarf and hat band in the accent.
  readPageColor(host, "--fm-bg", scene.fog.color);
  readPageColor(host, "--fm-accent", world.scarecrow.accent.color);

  const { palette } = world;
  look.leaves.forEach((tone, index) => {
    palette.tones.value[index].set(tone);
  });
  palette.soil.value.set(look.soil);
  palette.contour.value = look.leafContour;

  world.environment.applyTheme(look);
  world.tree.applyTheme(look);
  world.copyGuard.setLook(look);
  world.copyGuard.measure();
  world.blobShadows.strength.value = look.blobShadow;
  world.halloween?.applyTheme(look);
}

// Fits the scene to the host: pines on the left, the scarecrow on the right
// with the deciduous tree behind him. On a narrow hero everything shrinks so
// that it sits below the copy.
function layOut(stage, world) {
  const { host, renderer, camera, sun } = stage;
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) {
    return;
  }

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const scale = MathUtils.clamp(camera.aspect / 1.4, 0.55, 1);
  const xAt = (fraction, z) =>
    fraction * HALF_FOV_TAN * camera.aspect * (CAMERA_Z - z);
  const stand = (group, x, z, sink = 0.05) => {
    group.position.set(x, groundHeight(x, z) - sink, z);
  };
  let blob = 0;

  world.pines.forEach((pine, index) => {
    const [fraction, z, pineHeight] = PINES[index];
    const x = xAt(fraction, z);
    stand(pine, x, z, 0.06);
    pine.scale.setScalar(scale);
    world.blobShadows.place(blob++, { x, z }, pineHeight * 0.22 * scale);
  });

  const [treeFraction, treeZ] = TREE;
  const treeX = xAt(treeFraction, treeZ);
  stand(world.tree.group, treeX, treeZ, 0.06);
  world.tree.group.scale.setScalar(scale);
  world.blobShadows.place(blob++, { x: treeX, z: treeZ }, 0.9 * scale);

  const scarecrowX = xAt(SCARECROW_X, SCARECROW_Z);
  const { group } = world.scarecrow;
  stand(group, scarecrowX, SCARECROW_Z, 0.1);
  group.scale.setScalar(0.92 * scale);
  world.blobShadows.place(
    blob++,
    { x: scarecrowX, z: SCARECROW_Z },
    0.45 * scale,
  );

  const pumpkins = world.halloween?.pumpkins ?? [];
  const pumpkinSpots = [
    ...PUMPKINS_AT_FEET.map(([dx, dz]) => [
      scarecrowX + dx * scale,
      SCARECROW_Z + dz,
    ]),
    [xAt(PUMPKIN_BY_PINES[0], PUMPKIN_BY_PINES[1]), PUMPKIN_BY_PINES[1]],
  ];
  pumpkins.forEach((pumpkin, index) => {
    const [x, z] = pumpkinSpots[index];
    const radius = pumpkin.radius * scale;
    stand(pumpkin.group, x, z, radius * 0.12);
    // The lowest ring of the squashed body sits about 0.6 radii down.
    pumpkin.group.position.y += radius * 0.6;
    pumpkin.group.scale.setScalar(radius);
    world.blobShadows.place(blob++, { x, z }, radius * 0.9);
  });

  // Leaves leave the crown of the tree, a little in front of it as well, and
  // drift across towards the copy.
  const halfWidth = HALF_FOV_TAN * camera.aspect * 22;
  const { uniforms } = world.leaves;
  uniforms.uSource.value.set(
    treeX - 0.3 * scale,
    world.tree.group.position.y + CROWN_CENTRE.y * scale,
    treeZ + 3,
  );
  uniforms.uSpread.value.set(1.6 * scale, 0.7 * scale, 3.2);
  uniforms.uDrift.value = halfWidth * 0.32;
  uniforms.uSize.value = 0.24 * MathUtils.clamp(scale * 1.2, 0.8, 1);

  const shadowCamera = sun.shadow.camera;
  shadowCamera.left = -halfWidth;
  shadowCamera.right = halfWidth;
  shadowCamera.top = 9;
  shadowCamera.bottom = -6;
  shadowCamera.near = 1;
  shadowCamera.far = 40;
  shadowCamera.updateProjectionMatrix();
  renderer.shadowMap.needsUpdate = true;

  world.copyGuard.measure();
}

// Moves the scarecrow: the head follows the pointer and the loose end of a
// sleeve sways whenever the shared gust picks up. He does not wave.
function animateScarecrow(stage, scarecrow, pointer, clock) {
  const { group, head, sleeves } = scarecrow;
  const ease = 1 - 0.94 ** (clock.delta * 60);

  const headOnScreen = head.position
    .clone()
    .applyMatrix4(group.matrixWorld)
    .project(stage.camera);
  const turn = MathUtils.clamp(
    (pointer.x - headOnScreen.x) * 0.9 + 0.4,
    -0.5,
    1.2,
  );
  const nod = MathUtils.clamp(pointer.y * 0.25, -0.2, 0.25);
  head.rotation.y += (turn - head.rotation.y) * ease;
  head.rotation.x += (nod - head.rotation.x) * ease;

  const gust = gustAt(clock.time);
  const strength = MathUtils.smoothstep(Math.abs(gust), 0.3, 0.85);
  // The shirt's hem and the straw tips move in the same wind.
  SCARECROW_WIND.uGust.value = gust * strength;
  SCARECROW_WIND.uTime.value = clock.time;
  sleeves.forEach((sleeve, index) => {
    const side = index === 0 ? -1 : 1;
    // The far sleeve, on the gust's lee side, moves less. Each sleeve is
    // built for the right and mirrored, so the sway's sign follows the side
    // to keep both moving the same way.
    const reach = side === 1 ? 1 : 0.45;
    sleeve.rotation.z =
      -0.32 +
      side *
        reach *
        strength *
        (gust * 0.35 + Math.sin(clock.time * 3.3 + index) * 0.16);
    sleeve.rotation.x = reach * strength * Math.sin(clock.time * 2.1) * 0.12;
  });
  group.rotation.z = gust * 0.008;
}

// Switches a running full-form scene to the lighter form. Antialiasing is
// fixed when the WebGL context is created, so that one setting stays.
function applyLighterForm(stage, world) {
  const form = FORMS.lighter;
  stage.sun.castShadow = false;
  // Release the shadow map now rather than at destroy.
  stage.sun.shadow.dispose();
  world.blobShadows.group.visible = true;
  world.leaves.geometry.instanceCount = form.leaves;
  world.ground.geometry.dispose();
  world.ground.geometry = createGroundGeometry(form.groundSegments);
  stage.renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, form.pixelRatio),
  );
}

function disposeScene(scene) {
  scene.traverse((object) => {
    if (!object.isMesh) {
      return;
    }
    object.geometry.dispose();
    for (const material of [object.material].flat()) {
      material.map?.dispose();
      material.dispose();
    }
    object.dispose?.();
  });
}

// Tracks the pointer over the hero. The host itself takes no pointer events,
// so a click or text selection is never intercepted.
function trackPointer(stage, isLighter) {
  const pointer = { x: 0, y: 0 };
  const hero = stage.host.parentElement;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  // The lighter form skips pointer follow on touch devices.
  if (!hero || (isLighter && isTouch)) {
    return {
      pointer,
      stop: () => {
        // Nothing was attached.
      },
    };
  }

  const onMove = (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  hero.addEventListener("pointermove", onMove, { passive: true });
  return {
    pointer,
    stop: () => hero.removeEventListener("pointermove", onMove),
  };
}

export async function mount(host, context) {
  let isLighter = Boolean(context.lighter);
  let theme = context.theme;
  let form = isLighter ? FORMS.lighter : FORMS.full;

  // Throws when WebGL is unavailable; the site treats that as a silent miss.
  const stage = createStage(host, form, isLighter);
  const { renderer, canvas, scene, camera } = stage;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, form.pixelRatio));

  let world = null;
  try {
    const pine = await loadPine(context.assets);
    await nextTask();
    world = buildWorld(stage, pine, context);
    await nextTask();
    applyTheme(stage, world, theme);
    host.append(canvas);
    layOut(stage, world);
    // Compile shaders without blocking scrolling or taps.
    await renderer.compileAsync(scene, camera);
  } catch (error) {
    canvas.remove();
    disposeScene(scene);
    world?.environment.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  }

  const tracking = trackPointer(stage, isLighter);
  const clock = { time: 0, delta: 0 };
  let frameRequest = null;
  let lastFrame = 0;
  let frameSlot = 0;
  let framesDrawn = 0;
  let isInView = true;
  let isContextLost = false;
  let isDestroyed = false;
  // The copy moves without resizing when it transitions (the hero lift,
  // link hovers), so it is measured every frame until shortly after.
  let copyMovingUntil = 0;

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

    world.leaves.uniforms.uTime.value = clock.time;
    if (now < copyMovingUntil) {
      world.copyGuard.measure();
    }
    animateScarecrow(stage, world.scarecrow, tracking.pointer, clock);
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
  const copyObserver = new ResizeObserver(() => world.copyGuard.measure());
  const onCopyMeasure = () => world.copyGuard.measure();
  const onCopyTransition = () => {
    copyMovingUntil = performance.now() + COPY_TRANSITION_WATCH_MS;
  };
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
  viewObserver.observe(host);
  const { copy } = world.copyGuard;
  if (copy) {
    copyObserver.observe(copy);
    copy.addEventListener("transitionrun", onCopyTransition);
    copy.addEventListener("transitionend", onCopyMeasure);
    copy.addEventListener("transitioncancel", onCopyMeasure);
  }
  document.fonts.addEventListener("loadingdone", onCopyMeasure);
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
        applyLighterForm(stage, world);
        layOut(stage, world);
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
      copyObserver.disconnect();
      copy?.removeEventListener("transitionrun", onCopyTransition);
      copy?.removeEventListener("transitionend", onCopyMeasure);
      copy?.removeEventListener("transitioncancel", onCopyMeasure);
      document.fonts.removeEventListener("loadingdone", onCopyMeasure);
      tracking.stop();
      document.removeEventListener("visibilitychange", syncLoop);
      canvas.removeEventListener("webglcontextlost", onContextLost);

      // Release graphics memory, then the context itself.
      disposeScene(scene);
      world.environment.dispose();
      // Out of the host first: releasing the context fires a context-lost
      // event, which must not look like a failure to the site.
      canvas.remove();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
