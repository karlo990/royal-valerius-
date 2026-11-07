// Royal Crest concept posters v2: modelling kit.
// Everything is built in metres-ish units with the floor at y = 0 and objects about 2–4 units across.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const COL = {
  navy: '#13215a', navyDeep: '#0c1640', ivory: '#f3efe6', paper: '#fbfaf5', gold: '#d6ad45',
  yellow: '#f8c828', wood: '#b47b48', clay: '#b9694a', ink: '#0b1533', green: '#6f9e43',
};

export function mats() {
  const P = (o) => new THREE.MeshPhysicalMaterial(o);
  return {
    navy: P({ color: COL.navy, roughness: .38, clearcoat: .55, clearcoatRoughness: .28 }),
    navyMatte: P({ color: COL.navy, roughness: .7 }),
    navyDeep: P({ color: COL.navyDeep, roughness: .45, clearcoat: .4 }),
    ivory: P({ color: COL.ivory, roughness: .6, sheen: .4, sheenColor: '#ffffff' }),
    paper: P({ color: COL.paper, roughness: .85, side: THREE.DoubleSide }),
    gold: P({ color: COL.gold, metalness: 1, roughness: .26 }),
    goldSatin: P({ color: '#d9b04c', metalness: .85, roughness: .42 }),
    goldPaper: P({ color: '#d7ae47', roughness: .62, side: THREE.DoubleSide }),
    yellow: P({ color: COL.yellow, roughness: .32, clearcoat: .7, clearcoatRoughness: .2 }),
    yellowGlow: new THREE.MeshStandardMaterial({ color: '#ffd45a', emissive: '#ffc93a', emissiveIntensity: 4 }),
    wood: P({ color: COL.wood, roughness: .55, clearcoat: .2 }),
    clay: P({ color: COL.clay, roughness: .85 }),
    black: P({ color: '#15171f', roughness: .35, metalness: .4 }),
    glass: P({ color: '#ffffff', metalness: 0, roughness: .04, transmission: 1, thickness: .25, ior: 1.45, transparent: true }),
    green: P({ color: COL.green, roughness: .5, clearcoat: .3, side: THREE.DoubleSide }),
    soil: P({ color: '#5a3a26', roughness: 1 }),
    white: P({ color: '#ffffff', roughness: .5 }),
  };
}

export const shadow = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
export const mesh = (g, m) => shadow(new THREE.Mesh(g, m));
export const rbox = (w, h, d, r, m, seg = 4) => mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2)), m);
export const cyl = (rt, rb, h, m, seg = 48) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
export const sph = (r, m, seg = 48) => mesh(new THREE.SphereGeometry(r, seg, seg / 2), m);
export const torus = (R, r, m, arc = Math.PI * 2) => mesh(new THREE.TorusGeometry(R, r, 24, 96, arc), m);
export const lathe = (pts, m, seg = 96) => mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), m);
export const tube = (pts, r, m, closed = false) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed), 160, r, 16, closed), m);
export function extrude(shape, depth, m, bevel = .03) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 48 });
  g.translate(0, 0, -depth / 2); return mesh(g, m);
}
export function at(o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.setScalar(s); return o; }
export const group = (...c) => { const g = new THREE.Group(); c.forEach((x) => x && g.add(x)); return g; };

export function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9 >>> 0) / 4294967296); }
export { rng };

/* crumpled paper ball */
export function crumple(r, seed, m) {
  const g = new THREE.IcosahedronGeometry(r, 5);
  const R = rng(seed), pos = g.attributes.position, v = new THREE.Vector3();
  const dents = Array.from({ length: 70 }, () => [new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize(), .06 + R() * .22, (R() - .45) * .38]);
  const hash = (n) => { const h = Math.sin(n.x * 127.1 + n.y * 311.7 + n.z * 74.7 + seed) * 43758.5453; return h - Math.floor(h); };
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); const n = v.clone().normalize(); let k = 1;
    for (const [d, w, a] of dents) { const dd = n.dot(d); if (dd > 1 - w) k += a * Math.pow((dd - (1 - w)) / w, .6); }
    k *= 0.95 + hash(n) * 0.1; v.copy(n).multiplyScalar(r * k); pos.setXYZ(i, v.x, v.y * .88, v.z);
  }
  g.computeVertexNormals();
  const mm = (m || new THREE.MeshStandardMaterial({ color: '#fbfbf8', roughness: .9 })).clone(); mm.flatShading = true;
  return mesh(g, mm);
}

/* closed hardback book lying flat: cover colour, page block, spine band */
export function book(w, h, d, cover, M, band) {
  const g = new THREE.Group();
  g.add(rbox(w, h, d, .035, cover));
  const pages = rbox(w - .08, h * .78, d - .05, .01, M.paper); pages.position.x = .05; g.add(pages);
  if (band) { const b = rbox(.12, h * 1.01, d * 1.005, .01, band); b.position.x = -w / 2 + .28; g.add(b); }
  return shadow(g);
}

/* open book: two curved page blocks on a cover */
export function openBook(w, d, cover, M) {
  const g = new THREE.Group();
  g.add(at(rbox(w + .14, .06, d + .14, .02, cover), 0, .03, 0));
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(w / 2, .16, d, 24, 1, 1); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + w / 4; const t = x / (w / 2); p.setY(i, p.getY(i) + Math.sin(t * Math.PI) * .07 + (1 - t) * -.05 + .05); }
    geo.computeVertexNormals();
    const m = mesh(geo, M.paper); m.position.set(s * w / 4, .14, 0); if (s < 0) m.rotation.y = Math.PI; g.add(m);
  }
  return shadow(g);
}

/* hexagonal pencil, pointing +x */
export function pencil(len, paint, M) {
  const g = new THREE.Group(); const r = .085;
  const body = cyl(r, r, len, paint, 6); body.rotation.z = Math.PI / 2; g.add(body);
  const wood = cyl(.02, r * .98, .32, M.wood, 32); wood.rotation.z = -Math.PI / 2; wood.position.x = len / 2 + .16; g.add(wood);
  const lead = cyl(0, .022, .07, M.black, 16); lead.rotation.z = -Math.PI / 2; lead.position.x = len / 2 + .355; g.add(lead);
  const fer = cyl(r * 1.04, r * 1.04, .22, M.goldSatin, 32); fer.rotation.z = Math.PI / 2; fer.position.x = -len / 2 - .11; g.add(fer);
  const er = rbox(.16, r * 1.9, r * 1.9, .05, M.ivory); er.position.x = -len / 2 - .29; g.add(er);
  return shadow(g);
}

/* keycap with a canvas legend on top */
export function keycap(label, M, opts = {}) {
  const { size = 1, base = COL.navyDeep, ink = '#f8d05a', font = '700 300px Archivo', sub = null } = opts;
  const tex = canvasTex(1024, 1024, (x) => {
    x.fillStyle = base; x.fillRect(0, 0, 1024, 1024); x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = font; x.fillText(label, 512, sub ? 430 : 520); if (sub) sub(x);
  });
  const body = new THREE.MeshPhysicalMaterial({ color: base, roughness: .4, clearcoat: .5, clearcoatRoughness: .3 });
  const g = new THREE.Group();
  const s = new THREE.Shape(), w = 1.9, d = 1.9, r = .26, x0 = -w / 2, y0 = -d / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); s.lineTo(x0 + w, y0 + d - r);
  s.quadraticCurveTo(x0 + w, y0 + d, x0 + w - r, y0 + d); s.lineTo(x0 + r, y0 + d); s.quadraticCurveTo(x0, y0 + d, x0, y0 + d - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  const h = 1.15, geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .12, bevelSize: .1, bevelSegments: 6, curveSegments: 12 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -h / 2, 0);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + h / 2) / h; const k = 1 - .12 * Math.max(0, Math.min(1, t)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  geo.computeVertexNormals(); g.add(mesh(geo, body));
  const face = mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshPhysicalMaterial({ map: tex, roughness: .4, clearcoat: .5 }));
  face.rotation.x = -Math.PI / 2; face.position.y = h / 2 + .124; face.scale.setScalar(.92); g.add(face);
  g.scale.setScalar(size * .5); return shadow(g);
}

/* mortarboard (graduation cap) with a tassel */
export function mortarboard(M, tassel) {
  const g = new THREE.Group();
  g.add(at(rbox(1.7, .07, 1.7, .03, M.navy), 0, .62, 0, 0, Math.PI / 4));
  g.add(at(cyl(.62, .66, .55, M.navy, 64), 0, .3, 0));
  g.add(at(cyl(.07, .07, .06, tassel, 24), 0, .69, 0));
  const cordPts = [[0, .69, 0], [.45, .67, .15], [.86, .66, .3], [.98, .5, .34], [1.0, .3, .35]];
  g.add(tube(cordPts, .018, tassel));
  g.add(at(cyl(.05, .09, .28, tassel, 24), 1.0, .16, .35));
  return shadow(g);
}

/* shield outline like the crest, centred at origin, height ~2 */
export function shieldShape(w = 1.6, h = 2) {
  const s = new THREE.Shape(), hw = w / 2;
  s.moveTo(-hw, h * .5); s.lineTo(hw, h * .5); s.lineTo(hw, -h * .05);
  s.quadraticCurveTo(hw, -h * .38, 0, -h * .5); s.quadraticCurveTo(-hw, -h * .38, -hw, -h * .05); s.lineTo(-hw, h * .5);
  return s;
}

export function gearShape(R, teeth, tooth = .18, hole = .25) {
  const s = new THREE.Shape(); const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, q = i % 4, r = (q === 1 || q === 2) ? R + tooth : R;
    const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  const hp = new THREE.Path(); hp.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(hp);
  return s;
}

export function puzzleShape(u = 1, tabs = [1, 1, -1, -1]) {
  // tabs: top, right, bottom, left (1 = out, -1 = in, 0 = flat)
  const s = new THREE.Shape(), h = u / 2, t = u * .17, k = u * .2;
  s.moveTo(-h, -h);
  const edge = (ax, ay, bx, by, tab, nx, ny) => {
    const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = (bx - ax) / u, dy = (by - ay) / u;
    s.lineTo(mx - dx * k, my - dy * k);
    if (tab) s.bezierCurveTo(mx - dx * k * 1.9 + nx * t * 2.2 * tab, my - dy * k * 1.9 + ny * t * 2.2 * tab, mx + dx * k * 1.9 + nx * t * 2.2 * tab, my + dy * k * 1.9 + ny * t * 2.2 * tab, mx + dx * k, my + dy * k);
    s.lineTo(bx, by);
  };
  edge(-h, -h, h, -h, tabs[2], 0, -1); edge(h, -h, h, h, tabs[1], 1, 0); edge(h, h, -h, h, tabs[0], 0, 1); edge(-h, h, -h, -h, tabs[3], -1, 0);
  return s;
}
