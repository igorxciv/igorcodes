// Winter scene, ambient layer: pines, a snowman and snowfall behind the hero
// copy, with Christmas lights and a star on the trees during the Christmas
// occasion.
//
// The site decides when this loads and passes a context: theme, current
// occasions, the lighter-form flag and the URLs of the files in assets/.
// Everything inside the host element is owned here, including the fade-in
// and pausing while nothing can be seen.
//
// Pine: Quaternius "Pine" (poly.pizza/m/79gmlLnweB, CC0), geometry only, with
// its foliage mask and bark colour as separate 256 px textures.
import {
  ACESFilmicToneMapping,
  BackSide,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  FrontSide,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
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
const MAX_FLAKES = 760;
// Lines of copy the snowfall keeps dim behind (spec 1.9); more are ignored.
const MAX_COPY_LINES = 24;

// The full form and the lighter form: same composition, lower cost.
const FORMS = {
  full: {
    pixelRatio: 2,
    shadowMap: 1024,
    flakes: MAX_FLAKES,
    groundSegments: [220, 110],
    fps: 60,
  },
  lighter: {
    pixelRatio: 1.5,
    shadowMap: 0,
    flakes: 320,
    groundSegments: [90, 45],
    fps: 30,
  },
};

// Per-theme look. Dark is cool moonlight; light is "Blue shadow": a low warm
// sun on cream, with snow drawn by cool shading instead of a painted sky.
const THEMES = {
  dark: {
    sun: "#bfd4ff",
    sunIntensity: 2.3,
    sky: "#31466e",
    bounce: "#10141c",
    hemisphereIntensity: 1.4,
    envTop: "#1a2a4a",
    envHorizon: "#0b0f18",
    envIntensity: 0.7,
    exposure: 0.95,
    sheen: "#9db7ff",
    rim: 0,
    rimColor: "#ffffff",
    treeSnow: 0.8,
    flake: "#ffffff",
    flakeShade: "#ffffff",
    flakeShadeAmount: 0,
    flakeOpacity: 0.95,
    flakeSize: 1,
    blobShadow: 0.5,
    // Glowing bulbs.
    bulbColors: ["#ffc857", "#ff5d5d", "#7fe9ff", "#fff1c9"],
    bulbGlow: 1.9,
    bulbTwinkle: 0.45,
    bulbSize: 0.045,
    bulbRoughness: 1,
    bulbClearcoat: 0,
    star: "#ffd76a",
    starGlowColor: "#ffb92e",
    starGlow: 1.4,
  },
  light: {
    sun: "#ffe9c8",
    sunIntensity: 3,
    sky: "#8fb4f5",
    bounce: "#7f98c4",
    hemisphereIntensity: 0.7,
    envTop: "#7fa8ee",
    envHorizon: "#c9d6ea",
    envIntensity: 0.5,
    exposure: 0.92,
    sheen: "#bfd6ff",
    rim: 0.6,
    rimColor: "#7d97c2",
    treeSnow: 0.8,
    flake: "#ffffff",
    flakeShade: "#6a80a6",
    flakeShadeAmount: 1,
    flakeOpacity: 1,
    flakeSize: 1.45,
    blobShadow: 0.3,
    // Glossy ornaments that read by colour, not glow.
    bulbColors: ["#d81e3a", "#f09a00", "#008fa8", "#2f8f3c"],
    bulbGlow: 0.25,
    bulbTwinkle: 0.15,
    bulbSize: 0.07,
    bulbRoughness: 0.18,
    bulbClearcoat: 1,
    star: "#f2a900",
    starGlowColor: "#f2a900",
    starGlow: 0.35,
  },
};

// [x as a fraction of the half-width at that depth, z, height, turn]
const TREES = [
  [-0.84, -4.2, 4.2, 0],
  [-0.62, -7, 3.6, 2],
  [-0.44, -3.2, 2.2, 4],
  [0.9, -7.5, 3.2, 1],
];
const SNOWMAN_X = 0.62;
const SNOWMAN_Z = -2;
const BULBS_PER_TREE = 20;
// The crown's top spike, as a fraction of the tree's height.
const CROWN_SPIKE = 0.03;
// How far the star's centre sits below the top of the crown, in scene
// units: the spike runs into the star and its lower points overlap the
// first branches, so it reads as fixed to the tree rather than floating.
const STAR_SINK = 0.04;

// Ground height: broad swells plus small lumps.
const groundHeight = (x, z) =>
  0.3 * Math.sin(x * 0.33 + 1) * Math.cos(z * 0.4) +
  0.1 * Math.sin(x * 1.1 + z * 0.9) +
  0.04 * Math.sin(x * 3.1) * Math.sin(z * 2.7);

const nextTask = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

// Park-Miller generator: the same bulbs and flakes on every visit.
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
  sun.position.set(-7, 6, 6);
  sun.castShadow = form.shadowMap > 0;
  sun.shadow.mapSize.set(form.shadowMap || 1, form.shadowMap || 1);
  sun.shadow.radius = 5;
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

// ---------------------------------------------------------------- snow

function createSnowMaterials() {
  // Rim shading: tint the snow toward a cool shade where it turns away from
  // the viewer, so a white ball keeps an edge against a cream page.
  const rim = { value: 0 };
  const rimColor = { value: new Color() };

  const snow = new MeshPhysicalMaterial({
    color: "#f4f7fb",
    roughness: 0.85,
    sheen: 1,
    sheenRoughness: 0.45,
  });
  snow.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = rim;
    shader.uniforms.uRimColor = rimColor;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uRim;\nuniform vec3 uRimColor;",
      )
      .replace(
        "#include <opaque_fragment>",
        // biome-ignore lint/security/noSecrets: GLSL source, not a secret.
        "outgoingLight = mix(outgoingLight, outgoingLight * uRimColor, pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 2.2) * uRim);\n#include <opaque_fragment>",
      );
  };

  // The ground recedes and fades to transparent, so the page background
  // shows through in either theme.
  const ground = snow.clone();
  ground.transparent = true;
  ground.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      "#include <dithering_fragment>\ngl_FragColor.a *= 1.0 - smoothstep(19.0, 30.0, vViewPosition.z);",
    );
  };

  const applyTheme = (look) => {
    snow.sheenColor.set(look.sheen);
    ground.sheenColor.set(look.sheen);
    rim.value = look.rim;
    rimColor.value.set(look.rimColor);
  };

  return { snow, ground, applyTheme };
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

// A lumpy, slightly squashed snowball: a welded icosphere pushed around by a
// few sines, with smooth normals.
function createSnowball(radius, seed, material) {
  let geometry = new IcosahedronGeometry(radius, 5);
  geometry.deleteAttribute("uv");
  geometry.deleteAttribute("normal");
  geometry = mergeVertices(geometry);

  const positions = geometry.attributes.position;
  const point = new Vector3();
  for (let index = 0; index < positions.count; index++) {
    point.fromBufferAttribute(positions, index);
    const lump =
      0.04 * Math.sin(point.x * 5 + seed) * Math.sin(point.y * 4.3 + seed * 2) +
      0.025 * Math.sin(point.z * 9 + seed) * Math.sin(point.x * 7.7) +
      0.012 * Math.sin(point.y * 19 + point.z * 17);
    point.multiplyScalar(1 + (lump / radius) * 0.9);
    point.y *= 0.9;
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return new Mesh(geometry, material);
}

// ---------------------------------------------------------------- snowman

function createSnowmanArm(side, material) {
  const pivot = new Group();
  pivot.position.set(side * 0.38, 1.4, 0);
  const stick = new Mesh(new CylinderGeometry(0.012, 0.024, 0.75, 6), material);
  stick.position.y = 0.37;
  pivot.add(stick);
  for (const [angle, y] of [
    [0.7, 0.55],
    [-0.6, 0.62],
  ]) {
    const fork = new Mesh(new CylinderGeometry(0.008, 0.012, 0.2, 5), material);
    fork.position.set(Math.sin(-angle) * 0.09, y + 0.07, 0);
    fork.rotation.z = angle;
    pivot.add(fork);
  }
  pivot.rotation.z = -side * 1.15;
  return pivot;
}

// The head is its own group so it can turn without the body.
function createSnowmanHead(snowMaterial, coal, accent) {
  const head = new Group();
  head.position.y = 1.93;
  head.add(createSnowball(0.3, 3, snowMaterial));
  for (const x of [-0.1, 0.1]) {
    const eye = new Mesh(new IcosahedronGeometry(0.035, 1), coal);
    eye.position.set(x, 0.08, 0.27);
    head.add(eye);
  }

  const nose = new Mesh(
    new ConeGeometry(0.045, 0.3, 10).rotateX(Math.PI / 2),
    new MeshStandardMaterial({ color: "#e8792b", roughness: 0.7 }),
  );
  nose.position.set(0, -0.01, 0.4);

  const felt = new MeshStandardMaterial({ color: "#1b1e24", roughness: 0.75 });
  const brim = new Mesh(new CylinderGeometry(0.3, 0.31, 0.035, 24), felt);
  brim.position.y = 0.22;
  const crown = new Mesh(new CylinderGeometry(0.2, 0.19, 0.3, 24), felt);
  crown.position.y = 0.38;
  const band = new Mesh(new CylinderGeometry(0.2, 0.2, 0.07, 24), accent);
  band.position.y = 0.27;
  const hat = new Group();
  hat.add(brim, crown, band);
  hat.rotation.z = -0.12;
  hat.position.x = 0.02;

  head.add(nose, hat);
  return head;
}

function createSnowman(snowMaterial) {
  const group = new Group();
  const coal = new MeshStandardMaterial({ color: "#15171a", roughness: 0.6 });
  const twig = new MeshStandardMaterial({ color: "#4a3423", roughness: 0.9 });
  // Scarf and hat band take the site accent colour.
  const accent = new MeshStandardMaterial({ roughness: 1 });

  const lower = createSnowball(0.62, 1, snowMaterial);
  lower.position.y = 0.5;
  const middle = createSnowball(0.45, 2, snowMaterial);
  middle.position.y = 1.3;
  group.add(lower, middle);

  for (const [y, z] of [
    [1.48, 0.4],
    [1.28, 0.44],
    [1.08, 0.4],
  ]) {
    const button = new Mesh(new IcosahedronGeometry(0.036, 1), coal);
    button.position.set(0, y, z);
    group.add(button);
  }

  const scarf = new Mesh(new TorusGeometry(0.3, 0.085, 10, 28), accent);
  scarf.rotation.x = Math.PI / 2;
  scarf.scale.set(1, 1, 0.8);
  scarf.position.y = 1.68;
  const scarfTail = new Mesh(
    new CylinderGeometry(0.06, 0.075, 0.42, 8),
    accent,
  );
  scarfTail.scale.z = 0.4;
  scarfTail.position.set(0.2, 1.48, 0.32);
  scarfTail.rotation.set(0.25, 0, -0.2);

  const head = createSnowmanHead(snowMaterial, coal, accent);
  const leftArm = createSnowmanArm(-1, twig);
  const wavingArm = createSnowmanArm(1, twig);
  group.add(scarf, scarfTail, head, leftArm, wavingArm);
  group.rotation.y = -0.4;

  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return { group, head, wavingArm, accent };
}

// ---------------------------------------------------------------- pines

async function loadPine(assets) {
  const textures = new TextureLoader();
  const [gltf, leaf, bark] = await Promise.all([
    new GLTFLoader().loadAsync(assets["pine.glb"]),
    textures.loadAsync(assets["leaf.webp"]),
    textures.loadAsync(assets["bark.webp"]),
  ]);
  for (const texture of [leaf, bark]) {
    texture.colorSpace = SRGBColorSpace;
    texture.flipY = false;
  }
  return { model: gltf.scene, leaf, bark };
}

const isFoliage = (mesh) => mesh.material.name.includes("Leaves");

// Snow blended onto upward-facing branches in the shader.
function addBranchSnow(material, amount) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = amount;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vUp;")
      .replace(
        "#include <beginnormal_vertex>",
        "#include <beginnormal_vertex>\nvUp = normalize(mat3(modelMatrix) * objectNormal).y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vUp;\nuniform float uSnow;",
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 1.0), smoothstep(0.45, 0.95, vUp) * uSnow);",
      );
  };
}

function createPines(pine) {
  const snowAmount = { value: 0.8 };
  const materials = {
    foliage: new MeshStandardMaterial({
      name: "Leaves",
      map: pine.leaf,
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.9,
    }),
    bark: new MeshStandardMaterial({
      name: "Bark",
      map: pine.bark,
      side: FrontSide,
      roughness: 0.9,
    }),
  };
  addBranchSnow(materials.foliage, snowAmount);
  addBranchSnow(materials.bark, snowAmount);

  pine.model.traverse((object) => {
    if (object.isMesh) {
      object.material = isFoliage(object) ? materials.foliage : materials.bark;
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  // One model, reused at several sizes and turns.
  const trees = TREES.map(([, , height, turn]) => {
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
    return { group, model, height };
  });

  return { trees, snowAmount };
}

// ---------------------------------------------------------------- Christmas

// A five-pointed star with flat faces, built by hand: an extruded Shape
// would pull three.js's curve and triangulation code into the bundle.
function createStarGeometry() {
  const halfDepth = 0.02;
  const outline = Array.from({ length: 10 }, (_, point) => {
    const radius = point % 2 ? 0.07 : 0.17;
    const angle = (point / 10) * Math.PI * 2 + Math.PI / 2;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });

  const vertices = [];
  outline.forEach(([x, y], point) => {
    const [nextX, nextY] = outline[(point + 1) % outline.length];
    vertices.push(
      // Front face, then back face, as fans around the centre.
      [0, 0, halfDepth],
      [x, y, halfDepth],
      [nextX, nextY, halfDepth],
      [0, 0, -halfDepth],
      [nextX, nextY, -halfDepth],
      [x, y, -halfDepth],
      // The edge between them.
      [x, y, halfDepth],
      [x, y, -halfDepth],
      [nextX, nextY, -halfDepth],
      [x, y, halfDepth],
      [nextX, nextY, -halfDepth],
      [nextX, nextY, halfDepth],
    );
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertices.flat()), 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

function findFoliage(tree) {
  let foliage = null;
  tree.model.traverse((object) => {
    if (object.isMesh && isFoliage(object)) {
      foliage = object;
    }
  });
  return foliage;
}

// The top of the crown, in the tree group's space: the pine ends in a thin
// spike that sits off the bounding box's centre, so the star is centred on
// the spike's own vertices rather than on the box.
function findCrownTop(tree) {
  const foliage = findFoliage(tree);
  if (!foliage) {
    return new Vector3(0, tree.height, 0);
  }

  tree.group.updateWorldMatrix(true, true);
  const positions = foliage.geometry.attributes.position;
  const points = Array.from({ length: positions.count }, (_, index) =>
    tree.group.worldToLocal(
      foliage.localToWorld(new Vector3().fromBufferAttribute(positions, index)),
    ),
  );
  const topY = Math.max(...points.map((point) => point.y));
  const spike = points.filter(
    (point) => point.y >= topY - tree.height * CROWN_SPIKE,
  );
  const top = new Vector3(0, topY, 0);
  for (const point of spike) {
    top.x += point.x / spike.length;
    top.z += point.z / spike.length;
  }
  return top;
}

// Points on the outer branch tips of one tree, in the tree group's space:
// foliage vertices near the silhouette.
function findBranchTips(tree, random) {
  const foliage = findFoliage(tree);
  if (!foliage) {
    return [];
  }

  tree.group.updateWorldMatrix(true, true);
  const positions = foliage.geometry.attributes.position;
  const box = new Box3().setFromBufferAttribute(positions);
  const centerX = (box.min.x + box.max.x) / 2;
  const centerZ = (box.min.z + box.max.z) / 2;
  const radius = (box.max.x - box.min.x) / 2;
  const tips = [];

  for (let tries = 0; tries < 4000 && tips.length < BULBS_PER_TREE; tries++) {
    const point = new Vector3().fromBufferAttribute(
      positions,
      Math.floor(random() * positions.count),
    );
    const level = (point.y - box.min.y) / (box.max.y - box.min.y);
    const reach = Math.hypot(point.x - centerX, point.z - centerZ);
    const isOuterTip =
      level >= 0.08 && level <= 0.9 && reach >= radius * (1 - level) * 0.72;
    if (isOuterTip) {
      foliage.localToWorld(point);
      tips.push(tree.group.worldToLocal(point));
    }
  }
  return tips;
}

// Coloured lights on the outer branch tips and a star on each tree. Dark
// theme: glowing bulbs. Light theme: glossy ornaments. They never flash; the
// glow breathes on a cycle of nearly three seconds.
function createChristmas(trees) {
  const random = createRandom(1225);
  const bulbGeometry = new IcosahedronGeometry(1, 1);
  const bulbMaterials = [0, 1, 2, 3].map(() => new MeshPhysicalMaterial());
  const starGeometry = createStarGeometry();
  const starMaterial = new MeshStandardMaterial({ roughness: 0.3 });
  const bulbs = [];
  const stars = [];
  let look = THEMES.dark;

  trees.forEach((tree, treeIndex) => {
    const star = new Mesh(starGeometry, starMaterial);
    star.position.copy(findCrownTop(tree));
    star.position.y -= STAR_SINK;
    tree.group.add(star);
    stars.push(star);

    findBranchTips(tree, random).forEach((tip, tipIndex) => {
      const bulb = new Mesh(
        bulbGeometry,
        bulbMaterials[(tipIndex + treeIndex) % bulbMaterials.length],
      );
      bulb.position.copy(tip);
      tree.group.add(bulb);
      bulbs.push(bulb);
    });
  });

  const applyTheme = (nextLook) => {
    look = nextLook;
    bulbMaterials.forEach((material, index) => {
      material.color.set(look.bulbColors[index]);
      material.emissive.set(look.bulbColors[index]);
      material.roughness = look.bulbRoughness;
      material.clearcoat = look.bulbClearcoat;
      material.needsUpdate = true;
    });
    for (const bulb of bulbs) {
      bulb.scale.setScalar(look.bulbSize);
    }
    starMaterial.color.set(look.star);
    starMaterial.emissive.set(look.starGlowColor);
    starMaterial.emissiveIntensity = look.starGlow;
  };

  const animate = (time) => {
    for (const star of stars) {
      star.rotation.y = time * 0.8;
    }
    bulbMaterials.forEach((material, index) => {
      material.emissiveIntensity =
        look.bulbGlow *
        (1 + Math.sin(time * 2.2 + index * 1.9) * look.bulbTwinkle);
    });
  };

  return { applyTheme, animate };
}

// ---------------------------------------------------------------- snowfall

const FLAKE_VERTEX_SHADER = `
  attribute vec4 seed;
  uniform float uTime;
  uniform float uFocus;
  uniform vec3 uBox;
  uniform float uSize;
  varying vec2 vLight;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vBlur;
  varying float vSeed;
  void main() {
    float fall = mix(0.55, 1.25, seed.w);
    vec3 p = seed.xyz * uBox;
    p.y -= uTime * fall;
    // Each flake drifts on its own unrelated sines, plus one slow gust that
    // all of them share.
    float gust = sin(uTime * 0.13) * 0.6 + sin(uTime * 0.31 + 1.7) * 0.3;
    vec2 drift = vec2(
      sin(uTime * 0.7 + seed.x * 40.0) + 0.5 * sin(uTime * 1.9 + seed.z * 31.0),
      cos(uTime * 0.5 + seed.y * 23.0)) * 0.25;
    p.xz += drift + vec2(gust * 1.6 + uTime * 0.12, 0.0);
    p = mod(p, uBox) - vec3(uBox.x * 0.5, 1.0, uBox.z * 0.5 + 4.0);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    // Flakes away from the focal depth grow, blur and fade.
    float base = mix(0.03, 0.075, seed.w * seed.w) * uSize;
    float coc = abs(-mv.z - uFocus) * 0.011;
    float size = base + coc;
    vAlpha = (base * base) / (size * size);
    vBlur = clamp(coc / size, 0.0, 1.0);
    float ang = seed.x * 6.283 + uTime * (seed.y - 0.5) * 3.0;
    mat2 r = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    // Light from the upper left, expressed in the flake's turning frame.
    vLight = vec2(-0.53, 0.85) * r;
    vec2 corner = r * (position.xy * vec2(1.0, mix(0.55, 1.0, abs(sin(uTime * 2.0 * seed.z + seed.y * 6.0)))));
    corner.y *= 1.0 + fall * 0.3;
    mv.xy += corner * size;
    vUv = position.xy * 2.0;
    vSeed = seed.z * 50.0;
    gl_Position = projectionMatrix * mv;
  }`;

const FLAKE_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform vec3 uShade;
  uniform float uShadeAmount;
  uniform vec4 uCopyLines[MAX_COPY_LINES];
  uniform float uCopyCaps[MAX_COPY_LINES];
  uniform int uCopyLineCount;
  uniform vec2 uCopyEdge;
  varying vec2 vLight;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vBlur;
  varying float vSeed;
  void main() {
    // A lumpy outline, not a disc.
    float r = length(vUv);
    float a = atan(vUv.y, vUv.x);
    float edge = 0.6 + 0.09 * sin(a * 2.0 + vSeed) + 0.07 * sin(a * 3.0 - vSeed * 1.7) + 0.04 * sin(a * 5.0 + vSeed * 0.3);
    float soft = mix(0.45, 1.0, vBlur);
    float alpha = smoothstep(edge, edge - soft * edge, r) * vAlpha * uOpacity;
    // Behind a line of the page's copy a flake is held under that line's
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
    // Lit side white, far side shaded: a flake with volume, not a speck.
    float lit = smoothstep(-0.5, 0.25, dot(vUv, vLight));
    vec3 col = mix(uColor, mix(uShade, uColor, lit), uShadeAmount);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }`;

// One instanced-quad mesh, one draw call, animated in the vertex shader.
function createSnowfall() {
  const random = createRandom(7);
  const geometry = new InstancedBufferGeometry().copy(new PlaneGeometry(1, 1));
  const seeds = new Float32Array(MAX_FLAKES * 4);
  for (let index = 0; index < seeds.length; index++) {
    seeds[index] = random();
  }
  geometry.setAttribute("seed", new InstancedBufferAttribute(seeds, 4));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    defines: { MAX_COPY_LINES },
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color() },
      uOpacity: { value: 1 },
      uShade: { value: new Color() },
      uShadeAmount: { value: 0 },
      uSize: { value: 1 },
      uFocus: { value: 15 },
      uBox: { value: new Vector3(26, 11, 20) },
      // Filled by the copy guard, in drawing-buffer pixels.
      uCopyLines: {
        value: Array.from({ length: MAX_COPY_LINES }, () => new Vector4()),
      },
      uCopyCaps: { value: new Array(MAX_COPY_LINES).fill(1) },
      uCopyLineCount: { value: 0 },
      uCopyEdge: { value: new Vector2() },
    },
    vertexShader: FLAKE_VERTEX_SHADER,
    fragmentShader: FLAKE_FRAGMENT_SHADER,
  });

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;

  const applyTheme = (look) => {
    material.uniforms.uColor.value.set(look.flake);
    material.uniforms.uShade.value.set(look.flakeShade);
    material.uniforms.uShadeAmount.value = look.flakeShadeAmount;
    material.uniforms.uOpacity.value = look.flakeOpacity;
    material.uniforms.uSize.value = look.flakeSize;
  };

  return { mesh, geometry, uniforms: material.uniforms, applyTheme };
}

// ---------------------------------------------------------------- copy guard

// Text keeps at least 4.5:1 (3:1 for the name) against anything drawn behind
// it (spec 1.9). Only flakes cross the copy, so each line of text in the
// page's "copy" hook gets a cap on flake opacity, worked out from that line's
// colour, the page background and the theme's flake colours. The cap holds
// even where two flakes overlap.

// Room around a line before flakes start to recover, and the width of the
// recovery, in CSS pixels.
const COPY_PAD = 4;
const COPY_FEATHER = 14;
const COPY_RATIO = 4.5;
const NAME_RATIO = 3;
// Longer than the slowest transition on the copy (the 1.8 s hero lift).
const COPY_TRANSITION_WATCH_MS = 2000;

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

// The strongest flake opacity at which text of this colour still holds its
// ratio against the page background with any flake colour behind it, two
// flakes deep. The canvas blends in sRGB, so the mix is done there too.
function flakeCap(text, background, flakeColors, ratio) {
  const textLuminance = luminance(text);
  const holds = (alpha) =>
    flakeColors.every((flake) => {
      const behind = background.map(
        (channel, index) => channel + (flake[index] - channel) * alpha,
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
  let flakeColors = [];
  let pageColor = [];
  // Caps by text colour and ratio, for the current theme.
  const caps = new Map();

  // Called on every theme change, after the page has switched theme.
  const setLook = (look) => {
    flakeColors = [look.flake, look.flakeShade].map((hex) =>
      [1, 3, 5].map((start) =>
        Number.parseInt(hex.slice(start, start + 2), 16),
      ),
    );
    const page = readPageColor(host, "--fm-bg", new Color()).getRGB(
      new Color(),
      SRGBColorSpace,
    );
    pageColor = [page.r * 255, page.g * 255, page.b * 255];
    caps.clear();
  };

  // The flake cap for one text node, from its colour and its role.
  const capFor = (owner) => {
    const color = getComputedStyle(owner).color;
    const ratio = owner.closest('[data-scene-accent="name"]')
      ? NAME_RATIO
      : COPY_RATIO;
    const key = `${color} ${ratio}`;
    if (!caps.has(key)) {
      const text = parseCssColor(color);
      // A colour that cannot be read keeps flakes out entirely.
      caps.set(key, text ? flakeCap(text, pageColor, flakeColors, ratio) : 0);
    }
    return caps.get(key);
  };

  const measure = () => {
    const box = host.getBoundingClientRect();
    if (!copy || flakeColors.length === 0 || !box.width || !box.height) {
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
        gl_FragColor = vec4(0.04, 0.07, 0.15, falloff * falloff * uStrength);
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
  const snow = createSnowMaterials();
  const environment = createEnvironment(stage);

  const ground = new Mesh(
    createGroundGeometry(form.groundSegments),
    snow.ground,
  );
  ground.receiveShadow = true;

  const snowman = createSnowman(snow.snow);
  const pines = createPines(pine);
  const snowfall = createSnowfall();
  snowfall.geometry.instanceCount = form.flakes;
  const copyGuard = createCopyGuard(stage, snowfall.uniforms);
  const blobShadows = createBlobShadows(pines.trees.length + 1);
  blobShadows.group.visible = form.shadowMap === 0;
  const christmas = context.occasions.includes("christmas")
    ? createChristmas(pines.trees)
    : null;

  stage.scene.add(
    ground,
    snowman.group,
    ...pines.trees.map((tree) => tree.group),
    blobShadows.group,
    snowfall.mesh,
  );

  return {
    snow,
    environment,
    ground,
    snowman,
    pines,
    snowfall,
    copyGuard,
    blobShadows,
    christmas,
  };
}

function applyTheme(stage, world, theme) {
  const look = THEMES[theme] ?? THEMES.dark;
  const { sun, hemisphere, renderer, scene, host } = stage;

  sun.color.set(look.sun);
  sun.intensity = look.sunIntensity;
  hemisphere.color.set(look.sky);
  hemisphere.groundColor.set(look.bounce);
  hemisphere.intensity = look.hemisphereIntensity;
  renderer.toneMappingExposure = look.exposure;

  // Fog in the page background colour; scarf and hat band in the accent.
  readPageColor(host, "--fm-bg", scene.fog.color);
  readPageColor(host, "--fm-accent", world.snowman.accent.color);

  world.snow.applyTheme(look);
  world.environment.applyTheme(look);
  world.pines.snowAmount.value = look.treeSnow;
  world.snowfall.applyTheme(look);
  world.copyGuard.setLook(look);
  world.copyGuard.measure();
  world.blobShadows.strength.value = look.blobShadow;
  world.christmas?.applyTheme(look);
}

// Fits the scene to the host: pines on the left, the snowman on the right
// with one pine behind him. On a narrow hero everything shrinks so that it
// sits below the copy.
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

  world.pines.trees.forEach((tree, index) => {
    const [fraction, z, treeHeight] = TREES[index];
    const x = xAt(fraction, z);
    tree.group.position.set(x, groundHeight(x, z) - 0.06, z);
    tree.group.scale.setScalar(scale);
    world.blobShadows.place(index, { x, z }, treeHeight * 0.22 * scale);
  });

  const { group } = world.snowman;
  const x = xAt(SNOWMAN_X, SNOWMAN_Z);
  group.position.set(x, groundHeight(x, SNOWMAN_Z) - 0.05, SNOWMAN_Z);
  group.scale.setScalar(0.92 * scale);
  world.blobShadows.place(
    world.pines.trees.length,
    { x, z: SNOWMAN_Z },
    0.6 * scale,
  );

  const halfWidth = HALF_FOV_TAN * camera.aspect * 22;
  const shadowCamera = sun.shadow.camera;
  shadowCamera.left = -halfWidth;
  shadowCamera.right = halfWidth;
  shadowCamera.top = 9;
  shadowCamera.bottom = -6;
  shadowCamera.near = 1;
  shadowCamera.far = 40;
  shadowCamera.updateProjectionMatrix();
  renderer.shadowMap.needsUpdate = true;

  world.snowfall.uniforms.uBox.value.set(halfWidth * 2 + 4, 11, 20);
  world.copyGuard.measure();
}

// Moves the snowman: the head follows the pointer, the body sways and one
// arm waves every few seconds.
function animateSnowman(stage, snowman, pointer, clock) {
  const { group, head, wavingArm } = snowman;
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

  group.rotation.z = Math.sin(clock.time * 0.9) * 0.012;

  const phase = clock.time % 7;
  const lift = phase < 1.8 ? Math.sin((phase / 1.8) * Math.PI) : 0;
  wavingArm.rotation.z =
    -1.15 + 0.5 * lift + Math.sin(phase * 10) * 0.28 * lift;
}

// Switches a running full-form scene to the lighter form. Antialiasing is
// fixed when the WebGL context is created, so that one setting stays.
function applyLighterForm(stage, world) {
  const form = FORMS.lighter;
  stage.sun.castShadow = false;
  world.blobShadows.group.visible = true;
  world.snowfall.geometry.instanceCount = form.flakes;
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

    world.snowfall.uniforms.uTime.value = clock.time;
    if (now < copyMovingUntil) {
      world.copyGuard.measure();
    }
    animateSnowman(stage, world.snowman, tracking.pointer, clock);
    world.christmas?.animate(clock.time);
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
