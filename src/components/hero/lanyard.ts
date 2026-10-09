/**
 * The hero's 3D ID card on a lanyard (three.js). Loaded on demand by
 * HeroIdCard via dynamic import(), so three.js is its own chunk, fetched after
 * the hero has painted; the hero's text and wall never wait for it.
 *
 * Adapted from a lanyard component (rope-constrained rigid body, XPBD-style
 * solve, printed strap band, PMREM studio lighting). Changes from it:
 *  1. Click = a flick into the wall + a decaying shake, then onActivate (About).
 *     The original tap-to-flip and its turn target are gone.
 *  2. Entrance = a drop from above the page, released on the hero's beat.
 *  3. Framing from the WALL element: the card is --card-h × the wall's width
 *     tall and its top rests at --card-top × the wall's height, so it scales
 *     with the layout (hero-wall.css).
 *  4. A shadow-only wall plane behind the card that the card also collides
 *     with: a flick knocks it back against the wall, and its shadow lands on
 *     the taped photos.
 *  5. The face is drawn as an ID card (photo, name, role, invitation).
 *  6. Hovering swings it gently away from the cursor; scrolling, it trails the
 *     page a little (parallax).
 *  7. No breeze: it settles still and stops rendering.
 */
import * as THREE from "three";
import { seeded } from "./seeded";

const CARD = [1.6, 2.25] as const;
const THICKNESS = 0.018;
const BEVEL = 0.007;
const JOINTS = 4;
const NODE_WEIGHT = 1 / 0.05;
const MAX_STEP = 1 / 960;
const ITERATIONS = 2;
const SAMPLES = 72;
const FOV = 24;
const STRAP_WIDTH = 0.36 * 0.65;
const RING_RADIUS = 0.095;
const RING_TUBE = 0.0135;
const EYELET_RADIUS = 0.036;
const CLAMP_BODY = 0.15;
const FACE_W = 1024;
const FACE_H = Math.round((FACE_W * CARD[1]) / CARD[0]);
const BAND_COLUMNS = [0, 0.07, 0.93, 1];
const BAND_BEND = [-0.95, -0.28, 0.28, 0.95];
// The wall sits this far behind the card's rest plane (world units). Sets both
// the shadow offset and where a flicked card stops.
const WALL_Z = -0.22;
// Flick: an impulse into the wall at the click point, then a decaying roll shake.
const FLICK = 2.2;
const SHAKE = 4.2;
// Hover: one push away from the cursor when it arrives, then at most one gentle
// push per HOVER_REST ms while it stays, so the card never keeps popping.
const HOVER_PUSH = 2.4;
const HOVER_NUDGE = 0.9;
const HOVER_REST = 2200;
const HOVER_REARM = 900;
// The card trails the page on scroll by this share of the scroll distance.
const PARALLAX = 0.3;
const KEY_DIR = new THREE.Vector3(-2.5, 4, 6);
const FILL_DIR = new THREE.Vector3(3, -1, 4);

type Layout = {
  width: number;
  height: number;
  radius: number;
  slot: { width: number; height: number; y: number };
  ringY: number;
  hangY: number;
};
type Body = {
  position: THREE.Vector3;
  previous: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  previousQuaternion: THREE.Quaternion;
  angular: THREE.Vector3;
  mass: number;
  inverseInertia: THREE.Vector3;
  hang: THREE.Vector3;
  corners: THREE.Vector3[];
};
type Grab = {
  local: THREE.Vector3;
  rotation: THREE.Quaternion;
  reach: number;
  from: THREE.Vector3;
  target: THREE.Vector3;
};
type Sim = {
  nodes: THREE.Vector3[];
  previous: THREE.Vector3[];
  velocities: THREE.Vector3[];
  lengths: Float64Array;
  impulses: Float64Array;
  rest: number;
  anchor: THREE.Vector3;
  body: Body;
  grab: Grab | null;
  twist: number;
  twistRaw: number;
  calm: number;
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// gravity 1, damping 0.62 (settles ~2s after landing), elasticity 0.5.
const PHYSICS = (() => {
  const gravity = 40;
  const springy = 0.5;
  const settle = 0.62;
  return {
    gravity,
    hold: gravity * mix(2.2, 5.5, springy),
    stiffness: gravity * 10 * JOINTS,
    spring: gravity * mix(0.1, 0.4, springy) * JOINTS,
    bandDamping: gravity * mix(0.3, 0.08, springy) * JOINTS,
    linearDrag: 0.25 * Math.pow(16, settle),
    angularDrag: 0.5 * Math.pow(12, settle),
    air: 0.15,
    broadside: 0.5,
    spinAir: 0.03,
    nodeDrag: 2,
    nodeAir: 0.2,
    twist: 30,
    twistDamping: 3,
    grip: 40,
    gripDamping: 6,
  };
})();

// ── Geometry ─────────────────────────────────────────────────────────────────
const traceRoundedRect = (path: THREE.Path, x: number, y: number, width: number, height: number, radius: number) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.bezierCurveTo(x + width - k, y, x + width, y + k, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.bezierCurveTo(x + width, y + height - k, x + width - k, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.bezierCurveTo(x + k, y + height, x, y + height - k, x, y + height - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
};

const cardLayout = (cornerRadius: number): Layout => {
  const [width, height] = CARD;
  const radius = mix(0.03, Math.min(width, height) * 0.2, cornerRadius);
  const slot = { width: 0.34, height: 0.07, y: height / 2 - 0.13 };
  const ringY = height / 2 - 0.055;
  return { width, height, radius, slot, ringY, hangY: ringY + RING_RADIUS };
};

const buildCardGeometry = (layout: Layout) => {
  const { width, height, radius, slot } = layout;
  const outline = new THREE.Shape();
  traceRoundedRect(outline, -width / 2 + BEVEL, -height / 2 + BEVEL, width - BEVEL * 2, height - BEVEL * 2, Math.max(radius - BEVEL, 0.005));
  const hole = new THREE.Path();
  traceRoundedRect(hole, -slot.width / 2 - BEVEL, slot.y - slot.height / 2 - BEVEL, slot.width + BEVEL * 2, slot.height + BEVEL * 2, slot.height / 2 + BEVEL);
  outline.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 5,
    curveSegments: 24,
  });
  body.translate(0, 0, -THICKNESS / 2);
  const face = new THREE.ShapeGeometry(outline, 24);
  const position = face.getAttribute("position");
  const uv = face.getAttribute("uv");
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + width / 2) / width, (position.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return { body, face };
};

const buildClampGeometry = (width: number) => {
  const shape = new THREE.Shape();
  const w = width * 1.16;
  traceRoundedRect(shape, -w / 2 + 0.014, -CLAMP_BODY / 2 + 0.014, w - 0.028, CLAMP_BODY - 0.028, 0.024);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 6,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -0.01);
  return geometry;
};

const buildBandGeometry = (count: number) => {
  const columns = BAND_COLUMNS.length;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * columns * 2), 2));
  const index: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = i * columns + c;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
};

// A small studio of emissive panels, baked to an environment map.
const buildEnvironment = (renderer: THREE.WebGLRenderer) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.035, 0.035, 0.04);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials: THREE.Material[] = [];
  const panel = (intensity: number, position: [number, number, number], scale: [number, number], rotation = 0) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotation);
    scene.add(mesh);
  };
  panel(2.6, [0, 4.5, 8], [9, 4]);
  panel(6, [-5.5, 0.5, 7], [0.9, 14]);
  panel(4, [5, -0.5, 8], [0.6, 14]);
  panel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3);
  panel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
  panel(1.4, [0, 6, -6], [12, 4]);
  panel(0.5, [0, -7, 1], [16, 6]);
  panel(0.9, [8, 0, -2], [4, 10]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  geometry.dispose();
  materials.forEach((m) => m.dispose());
  return target;
};

// ── Textures ─────────────────────────────────────────────────────────────────
const makeCanvasTexture = (canvas: HTMLCanvasElement, anisotropy: number) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

const normalTexture = (size: number, height: (x: number, y: number) => number, strength: number) => {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * strength;
      const ny = (height(x, y - 1) - height(x, y + 1)) * strength;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

// Fine card-stock grain for the faces.
const buildGrainTexture = () => {
  const size = 128;
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const wrap = (v: number) => ((v % size) + size) % size;
  const height = (x: number, y: number) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) sum += field[wrap(y + j) * size + wrap(x + i)];
    return (sum / 9) * 1.6;
  };
  const texture = normalTexture(size, height, 1);
  texture.repeat.set(5, 7);
  return texture;
};

// Woven strap.
const buildWeaveTexture = () => {
  const size = 128;
  const threads = 8;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = (f: number) => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const height = (x: number, y: number) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    const u = (px / size) * threads;
    const v = (py / size) * threads;
    const cu = Math.floor(u);
    const cv = Math.floor(v);
    const fu = u - cu - 0.5;
    const fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp = profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft = profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) + fiber[py * size + px] * 0.08;
  };
  return normalTexture(size, height, 1.6);
};

export type CardLabels = { name: string; role: string; cta: string; strap: string };

const setSpacing = (ctx: CanvasRenderingContext2D, px: number) => {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
};

// Front: photo, then the hierarchy name (largest, bold, ink) > role (regular,
// muted) > invitation (the smallest line, set apart at the foot, carried by
// weight and colour rather than size). The top band stays empty for the slot.
const paintFront = (canvas: HTMLCanvasElement, photo: HTMLImageElement | null, labels: CardLabels, family: string) => {
  canvas.width = FACE_W;
  canvas.height = FACE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const m = 76;
  const py = 188;
  const pw = FACE_W - m * 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  ctx.save();
  const clip = new Path2D();
  clip.roundRect(m, py, pw, pw, 18);
  ctx.clip(clip);
  ctx.fillStyle = "#e3e3e3";
  ctx.fillRect(m, py, pw, pw);
  if (photo) {
    ctx.imageSmoothingQuality = "high";
    const s = Math.max(pw / photo.width, pw / photo.height);
    ctx.drawImage(photo, m + (pw - photo.width * s) / 2, py + (pw - photo.height * s) / 2, photo.width * s, photo.height * s);
  }
  ctx.restore();
  ctx.fillStyle = "#1e1e1e";
  ctx.font = `700 88px ${family}`;
  setSpacing(ctx, -2.6);
  ctx.fillText(labels.name, m - 3, py + pw + 118);
  ctx.fillStyle = "#6f6f6f";
  ctx.font = `400 46px ${family}`;
  setSpacing(ctx, -1.2);
  ctx.fillText(labels.role, m, py + pw + 184);
  ctx.fillStyle = "#1e1e1e";
  ctx.font = `500 40px ${family}`;
  setSpacing(ctx, -0.6);
  ctx.fillText(labels.cta, m, FACE_H - 62);
};

const paintBack = (canvas: HTMLCanvasElement, labels: CardLabels, family: string) => {
  canvas.width = FACE_W;
  canvas.height = FACE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#1e1e1e";
  ctx.font = `700 64px ${family}`;
  setSpacing(ctx, -1.8);
  ctx.fillText(labels.name, FACE_W / 2, FACE_H / 2);
  ctx.fillStyle = "#6f6f6f";
  ctx.font = `400 38px ${family}`;
  setSpacing(ctx, -0.8);
  ctx.fillText(labels.role, FACE_W / 2, FACE_H / 2 + 64);
};

// Printed strap: one seamless tile of text, drawn landscape, then turned to run
// along the band. Returns the tile's length-to-width ratio.
const paintStrap = (canvas: HTMLCanvasElement, text: string, family: string) => {
  const across = 192;
  const font = `700 62px ${family}`;
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return 2;
  probe.font = font;
  setSpacing(probe, 6);
  const along = Math.max(64, Math.ceil(probe.measureText(text).width));
  const art = document.createElement("canvas");
  art.width = along;
  art.height = across;
  const a = art.getContext("2d");
  if (!a) return 2;
  a.fillStyle = "#1a1a1c";
  a.fillRect(0, 0, along, across);
  a.fillStyle = "rgba(255,255,255,0.16)";
  for (let x = 0; x < along; x += 18) {
    a.fillRect(x, 16, 10, 2);
    a.fillRect(x, across - 18, 10, 2);
  }
  a.font = font;
  setSpacing(a, 6);
  a.textBaseline = "middle";
  a.fillStyle = "rgba(255,255,255,0.86)";
  a.fillText(text, 0, across / 2 + 3);
  canvas.width = across;
  canvas.height = along;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 2;
  ctx.save();
  ctx.translate(across, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(art, 0, 0, along, across);
  ctx.restore();
  return along / across;
};

// ── Simulation ───────────────────────────────────────────────────────────────
const vectors = () => Array.from({ length: JOINTS + 1 }, () => new THREE.Vector3());
const createSimulation = (): Sim => ({
  nodes: vectors(),
  previous: vectors(),
  velocities: vectors(),
  lengths: new Float64Array(JOINTS),
  impulses: new Float64Array(JOINTS),
  rest: 1,
  anchor: new THREE.Vector3(),
  body: {
    position: new THREE.Vector3(),
    previous: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    previousQuaternion: new THREE.Quaternion(),
    angular: new THREE.Vector3(),
    mass: 1,
    inverseInertia: new THREE.Vector3(1, 1, 1),
    hang: new THREE.Vector3(),
    corners: [],
  },
  grab: null,
  twist: 0,
  twistRaw: 0,
  calm: 0,
});

const scratch = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  c: new THREE.Vector3(),
  d: new THREE.Vector3(),
  e: new THREE.Vector3(),
  f: new THREE.Vector3(),
  g: new THREE.Vector3(),
  pin: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  r: new THREE.Quaternion(),
};

const applyInverseInertia = (body: Body, vector: THREE.Vector3, out: THREE.Vector3) => {
  scratch.r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(scratch.r);
  out.set(out.x * body.inverseInertia.x, out.y * body.inverseInertia.y, out.z * body.inverseInertia.z);
  return out.applyQuaternion(body.quaternion);
};

const rotateBody = (q: THREE.Quaternion, w: THREE.Vector3) => {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
};

const bodyWeight = (body: Body, r: THREE.Vector3, normal: THREE.Vector3) => {
  const rn = scratch.c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));
};

const pushBody = (body: Body, r: THREE.Vector3, impulse: THREE.Vector3) => {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(body.quaternion, applyInverseInertia(body, scratch.e.crossVectors(r, impulse), scratch.f));
};

const solveSegment = (sim: Sim, i: number, h: number) => {
  const { nodes, body } = sim;
  const a = nodes[i];
  const wa = i === 0 ? 0 : NODE_WEIGHT;
  const last = i === JOINTS - 1;
  const r = scratch.g;
  let b = nodes[i + 1];
  if (last) {
    r.copy(body.hang).applyQuaternion(body.quaternion);
    b = scratch.b.copy(body.position).add(r);
  }
  const delta = scratch.a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - sim.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - sim.lengths[i]) / h;
  const tension =
    PHYSICS.hold * Math.tanh((PHYSICS.stiffness * stretch) / PHYSICS.hold) +
    PHYSICS.spring * stretch +
    PHYSICS.bandDamping * Math.max(0, rate);
  const room = tension * h * h - sim.impulses[i];
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  sim.impulses[i] += lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
};

const solvePin = (body: Body, grab: Grab, target: THREE.Vector3) => {
  const r = scratch.g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = scratch.a.copy(target).sub(body.position).sub(r);
  const distance = delta.length();
  if (distance < 1e-9) return;
  const normal = delta.divideScalar(distance);
  const lambda = distance / bodyWeight(body, r, normal);
  pushBody(body, r, normal.multiplyScalar(lambda));
};

// The card can't pass through the wall: positional contact at each corner, so
// it hits, rotates off the contact point and slides. Velocity is re-derived
// from positions afterwards, which makes the contact inelastic.
const wallR = new THREE.Vector3();
const wallN = new THREE.Vector3(0, 0, 1);
const wallJ = new THREE.Vector3();
const solveWall = (body: Body) => {
  for (const corner of body.corners) {
    wallR.copy(corner).applyQuaternion(body.quaternion);
    const depth = WALL_Z - (body.position.z + wallR.z);
    if (depth <= 0) continue;
    pushBody(body, wallR, wallJ.copy(wallN).multiplyScalar(depth / bodyWeight(body, wallR, wallN)));
  }
};

const configureSimulation = (sim: Sim, layout: Layout, length: number) => {
  sim.rest = length / JOINTS;
  const { width, height } = layout;
  const body = sim.body;
  const t = THICKNESS + BEVEL * 2;
  body.mass = 1;
  body.inverseInertia.set(12 / (height * height + t * t), 12 / (width * width + t * t), 12 / (width * width + height * height));
  body.hang.set(0, layout.hangY, 0);
  const hw = width / 2;
  const hh = height / 2;
  const ht = t / 2;
  body.corners = [];
  for (const z of [-ht, ht]) for (const y of [-hh, hh]) for (const x of [-hw, hw]) body.corners.push(new THREE.Vector3(x, y, z));
};

// "rest" = hanging straight down; "drop" = strap pointing UP from the anchor
// (all of it above the page), so the card free-falls into view.
const placeHanging = (sim: Sim, layout: Layout, mode: "rest" | "drop") => {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  const lean = -0.16;
  const dir = mode === "drop" ? new THREE.Vector3(Math.sin(lean), Math.cos(lean), 0) : new THREE.Vector3(0, -1, 0);
  for (let i = 1; i <= JOINTS; i++) nodes[i].copy(nodes[i - 1]).addScaledVector(dir, sim.rest);
  body.quaternion.identity();
  if (mode === "drop") body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.1);
  body.hang.set(0, layout.hangY, 0);
  const offset = scratch.a.copy(body.hang).applyQuaternion(body.quaternion);
  body.position.copy(nodes[JOINTS]).sub(offset);
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0, mode === "drop" ? 0.5 : 0);
  for (let i = 0; i <= JOINTS; i++) {
    previous[i].copy(nodes[i]);
    velocities[i].set(0, 0, 0);
  }
  sim.lengths.fill(sim.rest);
  sim.twist = 0;
  sim.twistRaw = 0;
  sim.calm = 0;
};

const stepSimulation = (sim: Sim, dt: number) => {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { nodes, previous, velocities, body } = sim;
  const grab = sim.grab;
  const pin = scratch.pin;
  const nodeDrag = Math.exp(-PHYSICS.nodeDrag * h);
  const linearDrag = Math.exp(-PHYSICS.linearDrag * h);
  const angularDrag = Math.exp(-PHYSICS.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i];
      v.y -= PHYSICS.gravity * h;
      previous[i].copy(nodes[i]);
      nodes[i].addScaledVector(v, h);
    }

    body.previous.copy(body.position);
    body.previousQuaternion.copy(body.quaternion);
    const q = body.quaternion;
    if (grab) {
      const turn = scratch.q.copy(grab.rotation).multiply(scratch.r.copy(q).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = scratch.a.set(turn.x, turn.y, turn.z).multiplyScalar(2 * PHYSICS.grip);
      torque.addScaledVector(body.angular, -PHYSICS.gripDamping);
      body.angular.addScaledVector(applyInverseInertia(body, torque, scratch.b), h);
    }
    const up = scratch.a.set(0, 1, 0).applyQuaternion(q);
    const front = scratch.b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = scratch.d.set(0, 0, 1).applyQuaternion(q);
      const raw = Math.atan2(scratch.e.crossVectors(front, facing).dot(up), front.dot(facing));
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned;
      sim.twistRaw = raw;
    }
    if (!grab) {
      // Always untwists back to facing front.
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(up, (PHYSICS.twist * -sim.twist - PHYSICS.twistDamping * spin) * h);
    }
    body.velocity.y -= PHYSICS.gravity * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, scratch.f.copy(body.angular).multiplyScalar(h));

    sim.impulses.fill(0);
    if (grab) pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < JOINTS; i++) solveSegment(sim, i, h);
      if (grab) solvePin(body, grab, pin);
      solveWall(body);
    }

    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i].subVectors(nodes[i], previous[i]).divideScalar(h).multiplyScalar(nodeDrag);
      v.multiplyScalar(1 / (1 + PHYSICS.nodeAir * v.length() * h));
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = scratch.q.copy(body.previousQuaternion).invert().premultiply(body.quaternion);
    body.angular.set(dq.x, dq.y, dq.z).multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = scratch.a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const across = body.velocity.dot(normal);
    const along = scratch.b.copy(body.velocity).addScaledVector(normal, -across);
    along.multiplyScalar(1 / (1 + PHYSICS.air * along.length() * h));
    body.velocity
      .copy(along)
      .addScaledVector(normal, across / (1 + PHYSICS.broadside * Math.abs(across) * h))
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(angularDrag / (1 + PHYSICS.spinAir * body.angular.length() * h));
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    nodes[JOINTS].copy(body.hang).applyQuaternion(body.quaternion).add(body.position);
    for (let i = 0; i < JOINTS; i++) sim.lengths[i] = nodes[i].distanceTo(nodes[i + 1]);
  }

  if (grab) grab.from.copy(grab.target);

  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (let i = 1; i < JOINTS; i++) energy += velocities[i].lengthSq() * 0.05;
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

export type LanyardAPI = {
  /** Hold the card out of view, ready to drop. */
  reset: () => void;
  /** Let it fall into place. */
  release: () => void;
  destroy: () => void;
};

/**
 * Builds the scene on `canvas` (which must span the hero section), framed off
 * `wall`. Resolves once every shader is compiled, so the hero's animation never
 * hitches on the card's first frame. Throws if WebGL is unavailable.
 */
export async function createLanyard({
  canvas,
  wall,
  reduce,
  photo,
  labels,
  family,
  onActivate,
}: {
  canvas: HTMLCanvasElement;
  wall: HTMLElement;
  reduce: boolean;
  /** Same-origin URL (WebGL needs a readable image: /api/hero-media). */
  photo: string;
  labels: CardLabels;
  /** CSS font-family for the printed text (the site's Noto Sans). */
  family: string;
  /** A click on the card: after the flick, take the visitor to About. */
  onActivate: () => void;
}): Promise<LanyardAPI> {
  const hero = (canvas.closest("section") as HTMLElement | null) ?? canvas.parentElement ?? document.body;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  const environment = buildEnvironment(renderer);
  scene.environment = environment.texture;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.radius = 9;
  keyLight.shadow.blurSamples = 16;
  keyLight.shadow.bias = -0.0004;
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
  scene.add(keyLight, keyLight.target, fillLight, fillLight.target);

  // Shadow-only wall: invisible except where the card and strap shade it, so
  // the shadow lands on the page (and on the photos) behind the transparent canvas.
  const shadowMaterial = new THREE.ShadowMaterial({ color: 0x0f172a, opacity: 0.2 });
  const wallPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), shadowMaterial);
  wallPlane.position.z = WALL_Z;
  wallPlane.receiveShadow = true;
  scene.add(wallPlane);

  const frontCanvas = document.createElement("canvas");
  const backCanvas = document.createElement("canvas");
  const strapCanvas = document.createElement("canvas");
  paintFront(frontCanvas, null, labels, family);
  paintBack(backCanvas, labels, family);
  let tileRatio = paintStrap(strapCanvas, labels.strap, family);
  const frontTexture = makeCanvasTexture(frontCanvas, anisotropy);
  const backTexture = makeCanvasTexture(backCanvas, anisotropy);
  const strapTexture = makeCanvasTexture(strapCanvas, anisotropy);
  strapTexture.wrapS = THREE.ClampToEdgeWrapping;
  strapTexture.wrapT = THREE.RepeatWrapping;
  const grain = buildGrainTexture();
  const weave = buildWeaveTexture();
  weave.repeat.set(2, 2 * tileRatio);

  const faceOptions = {
    normalMap: grain,
    normalScale: new THREE.Vector2(0.06, 0.06),
    roughness: 0.42,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  };
  const frontMaterial = new THREE.MeshPhysicalMaterial({ map: frontTexture, ...faceOptions });
  const backMaterial = new THREE.MeshPhysicalMaterial({ map: backTexture, ...faceOptions });
  // The printed faces always win the depth test over the body.
  [frontMaterial, backMaterial].forEach((m) => {
    m.polygonOffset = true;
    m.polygonOffsetFactor = -1;
    m.polygonOffsetUnits = -4;
  });
  const edgeMaterial = new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
  edgeMaterial.color.setRGB(0.92, 0.92, 0.92, THREE.SRGBColorSpace);
  const metalMaterial = new THREE.MeshStandardMaterial({ metalness: 1, color: "#d9dce2", roughness: 0.16 });
  const bandMaterial = new THREE.MeshPhysicalMaterial({
    map: strapTexture,
    normalMap: weave,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.68,
    sheen: 1,
    sheenRoughness: 0.42,
    sheenColor: new THREE.Color(0.32, 0.32, 0.34),
    side: THREE.DoubleSide,
  });

  const layout = cardLayout(0.2);
  const cardGeometry = buildCardGeometry(layout);
  const cardGroup = new THREE.Group();
  const bodyMesh = new THREE.Mesh(cardGeometry.body, edgeMaterial);
  const frontMesh = new THREE.Mesh(cardGeometry.face, frontMaterial);
  const backMesh = new THREE.Mesh(cardGeometry.face.clone(), backMaterial);
  frontMesh.position.z = THICKNESS / 2 + BEVEL + 0.0006;
  backMesh.rotation.y = Math.PI;
  backMesh.position.z = -(THICKNESS / 2 + BEVEL + 0.0006);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 18, 72), metalMaterial);
  ring.rotation.y = Math.PI / 2 - 0.7;
  ring.position.set(0, layout.ringY, 0);
  cardGroup.add(bodyMesh, frontMesh, backMesh, ring);
  scene.add(cardGroup);

  const bandGeometry = buildBandGeometry(SAMPLES);
  const band = new THREE.Mesh(bandGeometry, bandMaterial);
  band.frustumCulled = false;
  scene.add(band);

  const clampGroup = new THREE.Group();
  const clampMesh = new THREE.Mesh(buildClampGeometry(STRAP_WIDTH), metalMaterial);
  clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
  const eyelet = new THREE.Mesh(new THREE.TorusGeometry(EYELET_RADIUS, 0.0105, 14, 40), metalMaterial);
  clampGroup.add(clampMesh, eyelet);
  scene.add(clampGroup);
  const meshes = [bodyMesh, frontMesh, backMesh, ring, band, clampMesh, eyelet];
  meshes.forEach((m) => (m.castShadow = true));

  const sim = createSimulation();
  const restAnchor = new THREE.Vector3();
  const controls: THREE.Vector3[] = [];
  const mouth = new THREE.Vector3();
  const tuck = new THREE.Vector3();
  const curve = new THREE.CatmullRomCurve3(controls, false, "centripetal");
  const view = { width: 1, height: 1 };
  const target = { anchorX: 0, cardTop: 0, cardPx: 300 };
  let raf = 0;
  let last = performance.now();
  let time = 0;
  let visible = true;
  let alive = true;
  let placed = false;
  let held = !reduce;
  const kicks: { at: number; w: number }[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();

  // Where the card should rest, read off the wall (CSS owns the layout).
  const measure = () => {
    const h = hero.getBoundingClientRect();
    const w = wall.getBoundingClientRect();
    const cs = getComputedStyle(wall);
    target.cardPx = w.width * (parseFloat(cs.getPropertyValue("--card-h")) || 0.5);
    target.anchorX = w.left - h.left + w.width / 2;
    target.cardTop = w.top - h.top + w.height * (parseFloat(cs.getPropertyValue("--card-top")) || 0.15);
  };

  // Pixel framing: the camera scale makes the card exactly cardPx tall at its
  // rest plane, and the strap length lands its top edge at cardTop.
  const frameView = () => {
    const k = layout.height / target.cardPx;
    const viewHeight = view.height * k;
    camera.aspect = view.width / view.height;
    const distance = viewHeight / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    // Fit the depth range tightly around the scene (the card never travels more
    // than a few units off the wall). A tall hero (mobile) puts the camera far
    // back, and with near = 0.1 the depth buffer could no longer separate the
    // face from the body 0.0006 units behind it: the face vanished.
    camera.near = Math.max(0.1, distance - 8);
    camera.far = distance + 12;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const top = viewHeight / 2;
    const ax = (target.anchorX - view.width / 2) * k;
    const cardTop = top - target.cardTop * k;
    const hangTop = cardTop + (layout.hangY - layout.height / 2);
    const d = top - hangTop;
    const hangToBottom = layout.hangY + layout.height / 2;
    // High enough above the page that, for the drop, a strap pointing straight
    // up holds the whole card (and its shadow) out of view.
    const lift = Math.max(0.45, (hangToBottom + 0.8 - d) / 2);
    const sag = (JOINTS * PHYSICS.gravity) / (PHYSICS.stiffness + PHYSICS.spring);
    restAnchor.set(ax, top + lift, 0);
    configureSimulation(sim, layout, restAnchor.y - hangTop - sag);
    sim.anchor.copy(restAnchor);
    sim.nodes[0].copy(restAnchor);
    sim.previous[0].copy(restAnchor);
    const cy = cardTop - layout.height / 2;
    keyLight.target.position.set(ax, cy, 0);
    keyLight.position.copy(keyLight.target.position).add(KEY_DIR);
    fillLight.target.position.set(ax, cy, 0);
    fillLight.position.copy(fillLight.target.position).add(FILL_DIR);
    keyLight.target.updateMatrixWorld();
    fillLight.target.updateMatrixWorld();
    const sc = keyLight.shadow.camera;
    sc.left = -5;
    sc.right = 5;
    sc.top = 6;
    sc.bottom = -5;
    sc.near = 0.1;
    sc.far = 30;
    sc.updateProjectionMatrix();
  };

  const placeIntro = (mode: "rest" | "drop") => {
    sim.grab = null;
    kicks.length = 0;
    sim.anchor.copy(restAnchor);
    placeHanging(sim, layout, mode);
  };

  const points = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
  const sides = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
  const bends = BAND_BEND.map((angle) => [Math.cos(angle), Math.sin(angle)]);
  const work = {
    tangent: new THREE.Vector3(),
    toCamera: new THREE.Vector3(),
    basis: new THREE.Matrix4(),
    up: new THREE.Vector3(),
    across: new THREE.Vector3(),
    facing: new THREE.Vector3(),
    end: new THREE.Vector3(),
  };

  // Rebuilds the strap band along the rope each frame, twisting with the card.
  const updateBand = () => {
    const hang = sim.nodes[JOINTS];
    const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
    let guide = JOINTS - 1;
    while (guide > 0 && sim.nodes[guide].distanceTo(hang) < reach * 1.1) guide--;
    const axis = work.up.subVectors(sim.nodes[guide], hang);
    if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
    axis.normalize();
    mouth.copy(hang).addScaledVector(axis, reach);
    tuck.copy(hang).addScaledVector(axis, EYELET_RADIUS + CLAMP_BODY * 0.35);
    controls.length = 0;
    for (let i = 0; i <= guide; i++) controls.push(sim.nodes[i]);
    controls.push(mouth, tuck);
    curve.updateArcLengths();
    for (let i = 0; i < SAMPLES; i++) curve.getPointAt(i / (SAMPLES - 1), points[i]);
    const length = curve.getLength();
    const heldFrac = 1 - mouth.distanceTo(tuck) / Math.max(length, 0.001);
    const position = bandGeometry.getAttribute("position") as THREE.BufferAttribute;
    const normal = bandGeometry.getAttribute("normal") as THREE.BufferAttribute;
    const uv = bandGeometry.getAttribute("uv") as THREE.BufferAttribute;
    const columns = BAND_COLUMNS.length;
    const restLength = sim.rest * JOINTS;
    const repeats = restLength / (STRAP_WIDTH * tileRatio);
    const width = STRAP_WIDTH / Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);
    const { tangent, toCamera, across, facing } = work;
    for (let i = 0; i < SAMPLES; i++) {
      tangent.subVectors(points[Math.min(SAMPLES - 1, i + 1)], points[Math.max(0, i - 1)]);
      if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
      tangent.normalize();
      toCamera.subVectors(camera.position, points[i]).normalize();
      const side = sides[i].crossVectors(toCamera, tangent);
      if (side.lengthSq() < 1e-10) side.copy(i > 0 ? sides[i - 1] : scratch.a.set(1, 0, 0));
      side.normalize();
      if (i > 0 && side.dot(sides[i - 1]) < 0) side.negate();
      const angle = -sim.twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / heldFrac), 1.3);
      facing.crossVectors(tangent, side);
      across.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(facing, Math.sin(angle));
      facing.crossVectors(tangent, across);
      const p = points[i];
      const v = (1 - i / (SAMPLES - 1)) * repeats;
      for (let c = 0; c < columns; c++) {
        const k = i * columns + c;
        const offset = (BAND_COLUMNS[c] - 0.5) * width;
        const [bendCos, bendSin] = bends[c];
        position.setXYZ(k, p.x + across.x * offset, p.y + across.y * offset, p.z + across.z * offset);
        normal.setXYZ(
          k,
          facing.x * bendCos + across.x * bendSin,
          facing.y * bendCos + across.y * bendSin,
          facing.z * bendCos + across.z * bendSin,
        );
        uv.setXY(k, BAND_COLUMNS[c], v);
      }
    }
    work.end.copy(across);
    position.needsUpdate = true;
    normal.needsUpdate = true;
    uv.needsUpdate = true;
    across.copy(work.end).addScaledVector(axis, -work.end.dot(axis)).normalize();
    facing.crossVectors(across, axis).normalize();
    work.basis.makeBasis(across, axis, facing);
    clampGroup.quaternion.setFromRotationMatrix(work.basis);
    clampGroup.position.copy(hang);
  };

  const render = () => {
    cardGroup.position.copy(sim.body.position);
    cardGroup.quaternion.copy(sim.body.quaternion);
    updateBand();
    renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
    last = now;
    if (held) {
      render();
      return;
    }
    time += dt;
    for (let i = 0; i < kicks.length; i++) {
      if (time < kicks[i].at) continue;
      const n = scratch.a.set(0, 0, 1).applyQuaternion(sim.body.quaternion);
      sim.body.angular.addScaledVector(n, kicks[i].w);
      kicks.splice(i--, 1);
    }
    stepSimulation(sim, dt);
    const body = sim.body;
    if (!Number.isFinite(body.position.x + body.position.y + body.position.z + body.quaternion.w)) {
      sim.grab = null;
      placeIntro("rest");
    }
    render();
    // Settled and untouched → stop drawing until something moves it again.
    const resting = sim.calm > 1.2 && !sim.grab && kicks.length === 0;
    if (visible && !resting) raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (raf || !visible || !alive) return;
    sim.calm = 0;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  // ── Input: the HERO hit-tests the card (the canvas never takes events) ────
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let press: { x: number; y: number; time: number; point: THREE.Vector3 } | null = null;
  let hovering = false;
  let lastNudge = 0;
  let swallowClick = false;
  const toPointer = (e: { clientX: number; clientY: number }) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  };
  const pickCard = () => {
    cardGroup.updateMatrixWorld();
    return raycaster.intersectObjects([bodyMesh, frontMesh, backMesh], false)[0] ?? null;
  };
  // data-card on the hero drives the grab cursor (hero-wall.css) and tells the
  // wall not to tilt a paper the card is covering.
  const setCursor = (mode: "" | "hover" | "grab") => {
    if (mode) hero.dataset.card = mode;
    else delete hero.dataset.card;
  };

  // Flick: push into the wall at the click point (the card swings back off the
  // contact and knocks the wall), then a short decaying roll: the shake.
  const flick = (point: THREE.Vector3) => {
    const body = sim.body;
    const r = new THREE.Vector3().subVectors(point, body.position);
    const impulse = new THREE.Vector3(-r.x * 0.3, 0.35, -FLICK);
    body.velocity.addScaledVector(impulse, 1 / body.mass);
    body.angular.add(applyInverseInertia(body, new THREE.Vector3().crossVectors(r, impulse), new THREE.Vector3()));
    const side = r.x >= 0 ? -1 : 1;
    kicks.length = 0;
    [0.04, 0.12, 0.2, 0.28, 0.36].forEach((t, i) => {
      kicks.push({ at: time + t, w: SHAKE * side * (i % 2 ? -1 : 1) * Math.pow(0.66, i) });
    });
  };

  const onDown = (e: PointerEvent) => {
    swallowClick = false;
    if (e.button > 0 || held) return;
    toPointer(e);
    const hit = pickCard();
    if (!hit) return;
    e.preventDefault();
    e.stopPropagation();
    swallowClick = true;
    sim.grab = {
      local: hit.point.clone().sub(sim.body.position).applyQuaternion(sim.body.quaternion.clone().invert()),
      rotation: sim.body.quaternion.clone(),
      reach: hit.distance,
      from: hit.point.clone(),
      target: hit.point.clone(),
    };
    press = { x: e.clientX, y: e.clientY, time: performance.now(), point: hit.point.clone() };
    hero.setPointerCapture?.(e.pointerId);
    setCursor("grab");
    start();
  };
  const onMove = (e: PointerEvent) => {
    toPointer(e);
    if (sim.grab) {
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) press = null;
      raycaster.ray.at(sim.grab.reach, sim.grab.target);
      start();
      return;
    }
    if (e.pointerType === "touch" || held) return;
    const hit = pickCard();
    // Hovering pushes the card away from the cursor, so it swings: one push
    // when the cursor arrives, then a long rest between gentle nudges.
    if (hit && !reduce) {
      const now = performance.now();
      if ((!hovering && now - lastNudge > HOVER_REARM) || now - lastNudge > HOVER_REST) {
        lastNudge = now;
        const away = new THREE.Vector3().subVectors(sim.body.position, hit.point);
        away.z = 0;
        if (away.lengthSq() > 1e-6) {
          away.normalize();
          sim.body.velocity.addScaledVector(away, hovering ? HOVER_NUDGE : HOVER_PUSH);
          sim.body.velocity.z -= 0.3;
          start();
        }
      }
    }
    const over = !!hit;
    if (over !== hovering) {
      hovering = over;
      setCursor(over ? "hover" : "");
    }
  };
  const onUp = (e: PointerEvent) => {
    if (!sim.grab) return;
    sim.grab = null;
    if (press && e.type === "pointerup" && performance.now() - press.time < 350) {
      flick(press.point);
      // A click is also the way in: after the flick, go to About.
      const t = setTimeout(() => {
        timers.delete(t);
        onActivate();
      }, 650);
      timers.add(t);
    }
    press = null;
    if (hero.hasPointerCapture?.(e.pointerId)) hero.releasePointerCapture(e.pointerId);
    setCursor(hovering && e.pointerType !== "touch" ? "hover" : "");
    const t = setTimeout(() => {
      timers.delete(t);
      swallowClick = false;
    }, 0);
    timers.add(t);
    start();
  };
  const onClick = (e: MouseEvent) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  };
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1 || held) return;
    toPointer(e.touches[0]);
    if (pickCard()) e.preventDefault();
  };
  const onLeave = () => {
    if (hovering && !sim.grab) {
      hovering = false;
      setCursor("");
    }
  };

  const resize = () => {
    view.width = Math.max(1, hero.clientWidth);
    view.height = Math.max(1, hero.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(view.width, view.height, false);
    measure();
    frameView();
    if (!placed) {
      placeIntro(reduce ? "rest" : "drop");
      placed = true;
    } else if (held) {
      placeIntro("drop");
    }
    render();
    start();
  };

  // Theme: the shadow is stronger on the dark wall.
  const root = document.documentElement;
  const setDark = () => {
    const theme = root.dataset.theme;
    const dark = theme ? theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    shadowMaterial.opacity = dark ? 0.5 : 0.2;
    if (placed) render();
  };
  const themeObserver = new MutationObserver(setDark);

  // Scroll parallax: the card trails the page a little.
  let parRaf = 0;
  const parallax = () => {
    parRaf = 0;
    canvas.style.setProperty("--par", `${(Math.min(window.scrollY, window.innerHeight) * PARALLAX).toFixed(1)}px`);
  };
  const onScroll = () => {
    if (!parRaf) parRaf = requestAnimationFrame(parallax);
  };

  // Compile every shader before the first frame (in parallel where the driver
  // allows), so the hero's animation doesn't hitch when the card arrives.
  await renderer.compileAsync(scene, camera);

  hero.addEventListener("pointerdown", onDown, true);
  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerup", onUp);
  hero.addEventListener("pointercancel", onUp);
  hero.addEventListener("lostpointercapture", onUp);
  hero.addEventListener("pointerleave", onLeave);
  hero.addEventListener("click", onClick, true);
  hero.addEventListener("touchstart", onTouchStart, { passive: false });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);
  resizeObserver.observe(wall);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  });
  intersection.observe(hero);
  const onVisibility = () => {
    if (!document.hidden) start();
  };
  document.addEventListener("visibilitychange", onVisibility);
  themeObserver.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  if (!reduce) {
    window.addEventListener("scroll", onScroll, { passive: true });
    parallax();
  }
  setDark();
  resize();

  // Paint the faces once the font and the photo are in.
  const ready = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  Promise.all([ready, loadImage(photo)]).then(([, img]) => {
    if (!alive) return;
    paintFront(frontCanvas, img, labels, family);
    paintBack(backCanvas, labels, family);
    tileRatio = paintStrap(strapCanvas, labels.strap, family);
    weave.repeat.set(2, 2 * tileRatio);
    frontTexture.needsUpdate = true;
    backTexture.needsUpdate = true;
    strapTexture.needsUpdate = true;
    render();
  });

  return {
    reset() {
      if (reduce || !alive) return;
      held = true;
      time = 0;
      placeIntro("drop");
      render();
    },
    release() {
      if (reduce || !alive) return;
      held = false;
      start();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(parRaf);
      timers.forEach(clearTimeout);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      hero.removeEventListener("pointerdown", onDown, true);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerup", onUp);
      hero.removeEventListener("pointercancel", onUp);
      hero.removeEventListener("lostpointercapture", onUp);
      hero.removeEventListener("pointerleave", onLeave);
      hero.removeEventListener("click", onClick, true);
      hero.removeEventListener("touchstart", onTouchStart);
      setCursor("");
      [...meshes, wallPlane].forEach((m) => m.geometry.dispose());
      [frontMaterial, backMaterial, edgeMaterial, metalMaterial, bandMaterial, shadowMaterial].forEach((m) => m.dispose());
      [frontTexture, backTexture, strapTexture, grain, weave].forEach((t) => t.dispose());
      environment.dispose();
      renderer.dispose();
    },
  };
}
