// PROTOTYPE, throwaway. Round 2 of variant B: a natural-looking hero scene.
// Lighting, shadows, environment, uneven ground, a lumpy procedural snowman,
// one CC0 pine (Quaternius "Pine", poly.pizza/m/79gmlLnweB) with snow added in
// the shader, and irregular tumbling flakes with depth blur.
import {
  ACESFilmicToneMapping,
  BackSide,
  Box3,
  BufferAttribute,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
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
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector3,
  VSMShadowMap,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const ASSETS = "/assets/prototype/assets/";
const FOV = 30;
const CAM_Y = 1.25;
const CAM_Z = 13;
const TAN = Math.tan(MathUtils.degToRad(FOV / 2));

const THEMES = {
  dark: {
    sun: 0xbf_d4_ff,
    sunI: 2.3,
    sky: 0x31_46_6e,
    gnd: 0x10_14_1c,
    hemiI: 1.4,
    envTop: 0x1a_2a_4a,
    envHor: 0x0b_0f_18,
    envI: 0.7,
    exposure: 0.95,
    sheen: 0x9d_b7_ff,
    flake: 0xff_ff_ff,
    flakeA: 0.95,
    treeSnow: 0.8,
    accent: 0x00_d9_ff,
  },
  light: {
    sun: 0xff_e9_c8,
    sunI: 2.5,
    sky: 0x8f_b4_f5,
    gnd: 0xd9_d2_c4,
    hemiI: 1.25,
    envTop: 0x7f_a8_ee,
    envHor: 0xf3_ea_d8,
    envI: 0.9,
    exposure: 0.92,
    sheen: 0xbf_d6_ff,
    flake: 0x84_92_a8,
    flakeA: 0.8,
    treeSnow: 0.7,
    accent: 0x00_6a_80,
  },
};

// Ground height: broad swells plus small lumps.
const groundY = (x, z) =>
  0.3 * Math.sin(x * 0.33 + 1) * Math.cos(z * 0.4) +
  0.1 * Math.sin(x * 1.1 + z * 0.9) +
  0.04 * Math.sin(x * 3.1) * Math.sin(z * 2.7);

export async function start({ canvas, christmas }) {
  const root = document.documentElement;
  const theme = () => THEMES[root.dataset.theme === "light" ? "light" : "dark"];

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 80);
  camera.position.set(0, CAM_Y, CAM_Z);
  // Pitch up so the horizon sits about 27% up the hero.
  camera.lookAt(0, CAM_Y + CAM_Z * 0.1205, 0);

  const sun = new DirectionalLight();
  sun.position.set(-7, 6, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(
    innerWidth < 700 ? 512 : 1024,
    innerWidth < 700 ? 512 : 1024,
  );
  sun.shadow.radius = 5;
  sun.shadow.blurSamples = 16;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  const hemi = new HemisphereLight();
  scene.add(sun, sun.target, hemi);

  // Zero-byte environment light: a gradient sky sphere filtered with PMREM.
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new Scene();
  const skyGeo = new SphereGeometry(20, 24, 12);
  skyGeo.setAttribute(
    "color",
    new BufferAttribute(
      new Float32Array(skyGeo.attributes.position.count * 3),
      3,
    ),
  );
  envScene.add(
    new Mesh(
      skyGeo,
      new MeshBasicMaterial({ side: BackSide, vertexColors: true }),
    ),
  );
  let envTarget = null;

  // ---- materials
  const snowMat = new MeshPhysicalMaterial({
    color: 0xf4_f7_fb,
    roughness: 0.85,
    sheen: 1,
    sheenRoughness: 0.45,
  });
  const groundMat = snowMat.clone();
  groundMat.transparent = true;
  // Fade the far ground to transparent so it dissolves into the page.
  groundMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <dithering_fragment>",
      "#include <dithering_fragment>\ngl_FragColor.a *= 1.0 - smoothstep(19.0, 30.0, vViewPosition.z);",
    );
  };
  const accentMat = new MeshStandardMaterial({ roughness: 1 });
  const treeSnow = { value: 0.85 };
  const addTreeSnow = (mat) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uSnow = treeSnow;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vUp;")
        .replace(
          "#include <beginnormal_vertex>",
          "#include <beginnormal_vertex>\nvUp = normalize(mat3(modelMatrix) * objectNormal).y;",
        );
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying float vUp;\nuniform float uSnow;",
        )
        .replace(
          "#include <color_fragment>",
          "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.96, 1.0), smoothstep(0.45, 0.95, vUp) * uSnow);",
        );
    };
  };

  // ---- ground
  const gg = new PlaneGeometry(70, 36, 220, 110)
    .rotateX(-Math.PI / 2)
    .translate(0, 0, -6);
  const gp = gg.attributes.position;
  for (let i = 0; i < gp.count; i++)
    gp.setY(i, groundY(gp.getX(i), gp.getZ(i)));
  gg.computeVertexNormals();
  const ground = new Mesh(gg, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- snowman: lumpy welded icospheres, head in its own group
  function lumpyBall(r, seed) {
    let geo = new IcosahedronGeometry(r, 5);
    geo.deleteAttribute("uv");
    geo.deleteAttribute("normal");
    geo = mergeVertices(geo);
    const p = geo.attributes.position;
    const v = new Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n =
        0.04 * Math.sin(v.x * 5 + seed) * Math.sin(v.y * 4.3 + seed * 2) +
        0.025 * Math.sin(v.z * 9 + seed) * Math.sin(v.x * 7.7) +
        0.012 * Math.sin(v.y * 19 + v.z * 17);
      v.multiplyScalar(1 + (n / r) * 0.9);
      v.y *= 0.9;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return new Mesh(geo, snowMat);
  }
  const man = new Group();
  const coal = new MeshStandardMaterial({ color: 0x15_17_1a, roughness: 0.6 });
  const twig = new MeshStandardMaterial({ color: 0x4a_34_23, roughness: 0.9 });
  const lower = lumpyBall(0.62, 1);
  lower.position.y = 0.5;
  const middle = lumpyBall(0.45, 2);
  middle.position.y = 1.3;
  man.add(lower, middle);
  for (const [y, z] of [
    [1.48, 0.4],
    [1.28, 0.44],
    [1.08, 0.4],
  ]) {
    const c = new Mesh(new IcosahedronGeometry(0.036, 1), coal);
    c.position.set(0, y, z);
    man.add(c);
  }
  const scarf = new Mesh(new TorusGeometry(0.3, 0.085, 10, 28), accentMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.scale.set(1, 1, 0.8);
  scarf.position.y = 1.68;
  const tail = new Mesh(new CylinderGeometry(0.06, 0.075, 0.42, 8), accentMat);
  tail.scale.z = 0.4;
  tail.position.set(0.2, 1.48, 0.32);
  tail.rotation.set(0.25, 0, -0.2);
  man.add(scarf, tail);

  const head = new Group();
  head.position.y = 1.93;
  head.add(lumpyBall(0.3, 3));
  for (const x of [-0.1, 0.1]) {
    const e = new Mesh(new IcosahedronGeometry(0.035, 1), coal);
    e.position.set(x, 0.08, 0.27);
    head.add(e);
  }
  const nose = new Mesh(
    new ConeGeometry(0.045, 0.3, 10).rotateX(Math.PI / 2),
    new MeshStandardMaterial({ color: 0xe8_79_2b, roughness: 0.7 }),
  );
  nose.position.set(0, -0.01, 0.4);
  const hatMat = new MeshStandardMaterial({
    color: 0x1b_1e_24,
    roughness: 0.75,
  });
  const brim = new Mesh(new CylinderGeometry(0.3, 0.31, 0.035, 24), hatMat);
  brim.position.y = 0.22;
  const crown = new Mesh(new CylinderGeometry(0.2, 0.19, 0.3, 24), hatMat);
  crown.position.y = 0.38;
  const band = new Mesh(new CylinderGeometry(0.2, 0.2, 0.07, 24), accentMat);
  band.position.y = 0.27;
  const hat = new Group();
  hat.add(brim, crown, band);
  hat.rotation.z = -0.12;
  hat.position.x = 0.02;
  head.add(nose, hat);
  man.add(head);

  const arm = (side) => {
    const pivot = new Group();
    pivot.position.set(side * 0.38, 1.4, 0);
    const stick = new Mesh(new CylinderGeometry(0.012, 0.024, 0.75, 6), twig);
    stick.position.y = 0.37;
    for (const [a, y] of [
      [0.7, 0.55],
      [-0.6, 0.62],
    ]) {
      const f = new Mesh(new CylinderGeometry(0.008, 0.012, 0.2, 5), twig);
      f.position.set(Math.sin(-a) * 0.09, y + 0.07, 0);
      f.rotation.z = a;
      pivot.add(f);
    }
    pivot.add(stick);
    pivot.rotation.z = -side * 1.15;
    man.add(pivot);
    return pivot;
  };
  arm(-1);
  const armR = arm(1);
  man.traverse((m) => {
    if (m.isMesh) m.castShadow = m.receiveShadow = true;
  });
  scene.add(man);

  // ---- pines
  const tex = new TextureLoader();
  const [gltf, leaf, bark] = await Promise.all([
    new GLTFLoader().loadAsync(`${ASSETS}pine.glb`),
    tex.loadAsync(`${ASSETS}leaf.webp`),
    tex.loadAsync(`${ASSETS}bark.webp`),
  ]);
  for (const t of [leaf, bark]) {
    t.colorSpace = SRGBColorSpace;
    t.flipY = false;
  }
  gltf.scene.traverse((m) => {
    if (!m.isMesh) return;
    const isLeaf = /Leaves/.test(m.material.name);
    m.material = new MeshStandardMaterial({
      name: m.material.name,
      map: isLeaf ? leaf : bark,
      alphaTest: isLeaf ? 0.5 : 0,
      side: isLeaf ? DoubleSide : 0,
      roughness: 0.9,
    });
    addTreeSnow(m.material);
    m.castShadow = m.receiveShadow = true;
  });
  const bulbGeo = new IcosahedronGeometry(1, 1);
  const bulbMats = [0xff_c8_57, 0xff_5d_5d, 0x7f_e9_ff, 0xff_f1_c9].map(
    (c) =>
      new MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 2.2,
      }),
  );
  const starShape = new Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.07 : 0.17;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    starShape[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
  }
  const starGeo = new ExtrudeGeometry(starShape, {
    depth: 0.04,
    bevelEnabled: false,
  }).translate(0, 0, -0.02);
  const starMat = new MeshStandardMaterial({
    color: 0xff_d7_6a,
    emissive: 0xff_b9_2e,
    emissiveIntensity: 1.4,
  });
  const stars = [];

  // [x as a fraction of the half-width at that depth, z, height, turn]
  const TREES = [
    [-0.84, -4.2, 4.2, 0],
    [-0.62, -7, 3.6, 2],
    [-0.44, -3.2, 2.2, 4],
    [0.9, -7.5, 3.2, 1],
  ];
  const trees = TREES.map(([, , height, turn], ti) => {
    const model = gltf.scene.clone();
    const box = new Box3().setFromObject(model);
    const s = height / (box.max.y - box.min.y);
    const inner = new Group();
    inner.add(model);
    model.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    inner.scale.setScalar(s);
    inner.rotation.y = turn;
    const tree = new Group();
    tree.add(inner);
    if (christmas) {
      const star = new Mesh(starGeo, starMat);
      star.position.y = height + 0.08;
      tree.add(star);
      stars.push(star);
      // Bulbs on outer branch tips: sample foliage vertices near the silhouette.
      let leafMesh = null;
      model.traverse((m) => {
        if (m.isMesh && /Leaves/.test(m.material.name)) leafMesh = m;
      });
      tree.updateWorldMatrix(true, true);
      const lp = leafMesh.geometry.attributes.position;
      const lb = new Box3().setFromBufferAttribute(lp);
      const v = new Vector3();
      const cx = (lb.min.x + lb.max.x) / 2;
      const cz = (lb.min.z + lb.max.z) / 2;
      const R = (lb.max.x - lb.min.x) / 2;
      let placed = 0;
      for (let tries = 0; tries < 4000 && placed < 20; tries++) {
        v.fromBufferAttribute(lp, Math.floor(Math.random() * lp.count));
        const yn = (v.y - lb.min.y) / (lb.max.y - lb.min.y);
        const r = Math.hypot(v.x - cx, v.z - cz);
        if (yn < 0.08 || yn > 0.9 || r < R * (1 - yn) * 0.72) continue;
        const b = new Mesh(bulbGeo, bulbMats[(placed + ti) % bulbMats.length]);
        leafMesh.localToWorld(v);
        tree.worldToLocal(v);
        b.position.copy(v);
        b.scale.setScalar(0.045);
        tree.add(b);
        placed++;
      }
    }
    scene.add(tree);
    return tree;
  });

  // ---- falling snow: instanced quads, irregular outline, depth blur, tumble
  const N = innerWidth < 700 ? 320 : 760;
  const fg = new InstancedBufferGeometry().copy(new PlaneGeometry(1, 1));
  fg.instanceCount = N;
  const seed = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) seed[i] = Math.random();
  fg.setAttribute("seed", new InstancedBufferAttribute(seed, 4));
  const flakeMat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color() },
      uOpacity: { value: 1 },
      uFocus: { value: 15 },
      uBox: { value: new Vector3(26, 11, 20) },
    },
    vertexShader: `
      attribute vec4 seed;
      uniform float uTime;
      uniform float uFocus;
      uniform vec3 uBox;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vBlur;
      varying float vSeed;
      void main() {
        float fall = mix(0.55, 1.25, seed.w);
        vec3 p = seed.xyz * uBox;
        p.y -= uTime * fall;
        float gust = sin(uTime * 0.13) * 0.6 + sin(uTime * 0.31 + 1.7) * 0.3;
        vec2 drift = vec2(
          sin(uTime * 0.7 + seed.x * 40.0) + 0.5 * sin(uTime * 1.9 + seed.z * 31.0),
          cos(uTime * 0.5 + seed.y * 23.0)) * 0.25;
        p.xz += drift + vec2(gust * 1.6 + uTime * 0.12, 0.0);
        p = mod(p, uBox) - vec3(uBox.x * 0.5, 1.0, uBox.z * 0.5 + 4.0);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float base = mix(0.03, 0.075, seed.w * seed.w);
        float coc = abs(-mv.z - uFocus) * 0.011;
        float size = base + coc;
        vAlpha = (base * base) / (size * size);
        vBlur = clamp(coc / size, 0.0, 1.0);
        float ang = seed.x * 6.283 + uTime * (seed.y - 0.5) * 3.0;
        mat2 r = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
        vec2 corner = r * (position.xy * vec2(1.0, mix(0.55, 1.0, abs(sin(uTime * 2.0 * seed.z + seed.y * 6.0)))));
        corner.y *= 1.0 + fall * 0.3;
        mv.xy += corner * size;
        vUv = position.xy * 2.0;
        vSeed = seed.z * 50.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vBlur;
      varying float vSeed;
      void main() {
        float r = length(vUv);
        float a = atan(vUv.y, vUv.x);
        float edge = 0.6 + 0.09 * sin(a * 2.0 + vSeed) + 0.07 * sin(a * 3.0 - vSeed * 1.7) + 0.04 * sin(a * 5.0 + vSeed * 0.3);
        float soft = mix(0.45, 1.0, vBlur);
        float alpha = smoothstep(edge, edge - soft * edge, r) * vAlpha * uOpacity;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uColor, alpha);
        #include <colorspace_fragment>
      }`,
  });
  const flakes = new Mesh(fg, flakeMat);
  flakes.frustumCulled = false;
  flakes.renderOrder = 2;
  scene.add(flakes);

  // ---- theme, layout, loop
  function applyTheme() {
    const t = theme();
    sun.color.set(t.sun);
    sun.intensity = t.sunI;
    hemi.color.set(t.sky);
    hemi.groundColor.set(t.gnd);
    hemi.intensity = t.hemiI;
    renderer.toneMappingExposure = t.exposure;
    for (const m of [snowMat, groundMat]) m.sheenColor = new Color(t.sheen);
    accentMat.color.set(t.accent);
    treeSnow.value = t.treeSnow;
    flakeMat.uniforms.uColor.value.set(t.flake);
    flakeMat.uniforms.uOpacity.value = t.flakeA;
    const col = skyGeo.attributes.color;
    const pos = skyGeo.attributes.position;
    const top = new Color(t.envTop);
    const hor = new Color(t.envHor);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      c.lerpColors(hor, top, Math.max(0, pos.getY(i) / 20));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    envTarget?.dispose();
    envTarget = pmrem.fromScene(envScene, 0.02);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = t.envI;
  }

  function layout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const k = MathUtils.clamp(camera.aspect / 1.4, 0.55, 1);
    const xAt = (f, z) => f * TAN * camera.aspect * (CAM_Z - z);
    trees.forEach((tree, i) => {
      const [f, z] = TREES[i];
      const x = xAt(f, z);
      tree.position.set(x, groundY(x, z) - 0.06, z);
      tree.scale.setScalar(k);
    });
    const mz = -2;
    const mx = xAt(0.62, mz);
    man.position.set(mx, groundY(mx, mz) - 0.05, mz);
    man.scale.setScalar(0.92 * k);
    man.rotation.y = -0.4;
    const half = TAN * camera.aspect * 22;
    const sc = sun.shadow.camera;
    sc.left = -half;
    sc.right = half;
    sc.top = 9;
    sc.bottom = -6;
    sc.near = 1;
    sc.far = 40;
    sc.updateProjectionMatrix();
    flakeMat.uniforms.uBox.value.set(half * 2 + 4, 11, 20);
  }

  applyTheme();
  layout();
  new ResizeObserver(layout).observe(canvas);
  new MutationObserver(applyTheme).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  let visible = true;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
  }).observe(canvas);

  let px = 0;
  let py = 0;
  addEventListener("pointermove", (e) => {
    px = (e.clientX / innerWidth) * 2 - 1;
    py = (e.clientY / innerHeight) * 2 - 1;
  });
  const v = new Vector3();
  const t0 = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden || !visible) return;
    const t = (performance.now() - t0) / 1000;
    flakeMat.uniforms.uTime.value = t;
    // Head follows the pointer (kept from round 1), relative to where the
    // snowman sits on screen.
    v.copy(head.position).applyMatrix4(man.matrixWorld).project(camera);
    const tx = MathUtils.clamp((px - v.x) * 0.9 + 0.4, -0.5, 1.2);
    head.rotation.y += (tx - head.rotation.y) * 0.06;
    head.rotation.x +=
      (MathUtils.clamp(py * 0.25, -0.2, 0.25) - head.rotation.x) * 0.06;
    man.rotation.z = Math.sin(t * 0.9) * 0.012;
    const ph = t % 7;
    const lift = ph < 1.8 ? Math.sin((ph / 1.8) * Math.PI) : 0;
    armR.rotation.z = -1.15 + 0.5 * lift + Math.sin(ph * 10) * 0.28 * lift;
    for (const s of stars) s.rotation.y = t * 0.8;
    bulbMats.forEach((m, i) => {
      m.emissiveIntensity = 1.6 + Math.sin(t * 2.2 + i * 1.9) * 0.9;
    });
    renderer.render(scene, camera);
    // Feedback round 2: the scene must not pop in. Once a few frames have
    // rendered (shaders compiled, shadows drawn), fade the canvas in slowly.
    if (++frames === 3) canvas.classList.add("proto-in");
  }
  let frames = 0;
  frame();
}
