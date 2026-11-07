// Royal Crest concept posters v2: renderer, lighting rigs, auto-framing and the four layout families.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mats } from './kit.js';

export const SIZES = { sq: [1080, 1080], feed: [1080, 1350], grid: [1080, 1440], story: [1080, 1920], wide: [1920, 1080] };
export const SITE = 'royalcrestzw.vercel.app', PHONE = '+263 714 404 090';

/* text block (tb) and hero regions, [x, y, w, h] in px */
const R_STUDIO = {
  sq: { stack: { tb: [64, 175, 952, 300], hero: [64, 500, 952, 430] }, beside: { tb: [64, 190, 470, 560], hero: [560, 130, 480, 820] } },
  feed: { stack: { tb: [72, 215, 936, 400], hero: [60, 640, 960, 560] }, beside: { tb: [72, 230, 520, 620], hero: [600, 190, 450, 990] } },
  grid: { stack: { tb: [72, 230, 936, 430], hero: [60, 690, 960, 600] }, beside: { tb: [72, 250, 520, 680], hero: [600, 220, 450, 1090] } },
  story: { stack: { tb: [72, 430, 936, 520], hero: [72, 990, 936, 590] } },
  wide: { beside: { tb: [110, 230, 760, 600], hero: [950, 100, 900, 860] } },
};
const R_CORNER = {
  sq: { tb: [64, 165, 560, 300], hero: [420, 330, 620, 590] },
  feed: { tb: [64, 225, 600, 320], hero: [300, 510, 720, 610] },
  grid: { tb: [64, 240, 600, 330], hero: [280, 570, 740, 660] },
  story: { tb: [64, 420, 760, 360], hero: [150, 800, 880, 620] },
  wide: { tb: [96, 200, 760, 330], hero: [900, 110, 920, 770] },
};
const R_EDIT = {
  sq: { tc: [90, 128, 900, 330], hero: [120, 470, 840, 450], foot: 952 },
  feed: { tc: [90, 150, 900, 390], hero: [100, 565, 880, 610], foot: 1210 },
  grid: { tc: [90, 165, 900, 410], hero: [100, 610, 880, 660], foot: 1302 },
  story: { tc: [80, 370, 920, 430], hero: [80, 830, 920, 640], foot: 1500 },
  wide: { tc: [1130, 230, 690, 560], hero: [70, 80, 1020, 900], foot: 860 },
};

const CREST = '../../assets/brand/crest-640.webp';
const WA = (c) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5l1.3-4.1A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 8.6c.2 2.6 3.4 5.9 6.3 6.3l1.1-1.3-1.9-1-1 .8c-1-.4-2.4-1.8-2.8-2.8l.8-1-1-1.9z" fill="${c}" stroke-width="1"/></svg>`;

export async function run(C, sizeKey) {
  const [W, H] = SIZES[sizeKey]; const fam = C.family;
  document.documentElement.style.setProperty('--w', W + 'px'); document.documentElement.style.setProperty('--h', H + 'px');
  document.body.className = 'fam-' + fam + ' size-' + sizeKey;
  await Promise.all(['900 100px Archivo', '700 100px Archivo', '500 100px Newsreader', 'italic 400 100px Newsreader', '600 20px Jakarta', '600 20px Mono'].map((f) => document.fonts.load(f)));

  const night = fam === 'night';
  const BG = { studio: '#f1eee8', corner: '#f1efea', editorial: '#f2ecdf', night: '#0a1331' }[fam];
  const SWEEP = { studio: '#f4f1ec', corner: '#f4f2ee', editorial: '#f4eee2', night: '#0e1a4c' }[fam];

  /* renderer + scene */
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  const PR = 1.5; renderer.setPixelRatio(PR); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = night ? 1.0 : 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(BG);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = night ? .22 : .38;
  const camera = new THREE.PerspectiveCamera(C.view?.fov || 26, W / H, 0.1, 400);

  /* seamless sweep */
  {
    const Rr = 7, D = 16, prof = [new THREE.Vector2(-40, 0)];
    for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI / 2; prof.push(new THREE.Vector2(D - Rr + Math.sin(a) * Rr, Rr - Math.cos(a) * Rr)); }
    prof.push(new THREE.Vector2(D, 40));
    const curve = new THREE.CatmullRomCurve3(prof.map((p) => new THREE.Vector3(0, p.y, -p.x + 7)));
    const geo = new THREE.PlaneGeometry(90, 1, 1, 260), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const p = curve.getPointAt(pos.getY(i) + .5); pos.setXYZ(i, pos.getX(i), p.y, p.z); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: SWEEP, roughness: .95, side: THREE.DoubleSide }));
    m.receiveShadow = true; scene.add(m);
  }

  /* hero */
  const M = mats();
  const hero = C.build(M, { scene, night, fam });
  scene.add(hero); hero.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(hero), ctr = box.getCenter(new THREE.Vector3()), rad = box.getSize(new THREE.Vector3()).length() / 2;

  /* lighting rig: warm key, coloured rim, bounce-tinted fill (2:1) */
  const key = new THREE.DirectionalLight(night ? '#ffd9a8' : (fam === 'editorial' ? '#ffe8c8' : '#fff1dc'), night ? 2.2 : 2.2);
  const kd = new THREE.Vector3(...(C.keyDir || [-0.55, 0.85, 0.6])).normalize();
  key.position.copy(ctr).addScaledVector(kd, rad * 6); key.target.position.copy(ctr);
  key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -0.0003; key.shadow.normalBias = .02;
  const sc = key.shadow.camera, ext = rad * 2.2; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = .1; sc.far = rad * 14;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(night ? '#8fb2ff' : '#ffffff', night ? 1.3 : .8);
  rim.position.copy(ctr).add(new THREE.Vector3(rad * 3, rad * 2.2, -rad * 5)); rim.target.position.copy(ctr); scene.add(rim, rim.target);
  const rim2 = new THREE.DirectionalLight(night ? '#ffcf8a' : '#fff6e8', night ? .9 : .35);
  rim2.position.copy(ctr).add(new THREE.Vector3(-rad * 4, rad * 1.5, -rad * 4)); rim2.target.position.copy(ctr); scene.add(rim2, rim2.target);
  scene.add(new THREE.HemisphereLight(night ? '#4a63c2' : '#eef2ff', night ? '#0a1331' : '#e6dccb', night ? .3 : .38));
  if (night) { // pool of light on the back wall
    const pool = new THREE.SpotLight('#5070d8', 240, 80, .4, 1, 1.4); pool.position.set(ctr.x, ctr.y + 10, ctr.z + 14); pool.target.position.set(ctr.x, ctr.y + 1.5, -9); scene.add(pool, pool.target);
  }
  if (fam === 'corner' || C.gobo) { // window-light gobo
    const g = document.createElement('canvas'); g.width = g.height = 1024; const x = g.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 1024, 1024); x.fillStyle = '#fff';
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) x.fillRect(170 + c * 236, 200 + r * 316, 210, 290);
    x.filter = 'blur(10px)'; x.drawImage(g, 0, 0);
    const t = new THREE.CanvasTexture(g); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.SpotLight('#fff1d8', 620, 90, .5, .3, 1.6); sp.map = t; sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -.0004;
    sp.position.set(ctr.x - 10, ctr.y + 9, ctr.z + 7); sp.target.position.set(ctr.x + 3.5, ctr.y + 2, -6); scene.add(sp, sp.target);
    key.intensity *= .4; rim.intensity *= .5; rim2.intensity *= .5; scene.environmentIntensity *= .8;
  }

  /* layout first (so the hero region is known), then frame the camera into it */
  const L = layout(C, sizeKey, W, H);
  frame(camera, hero, L.hero, C.view || {}, W, H);

  /* post: GTAO contact shading + gentle bloom for emissive parts */
  const rt = new THREE.WebGLRenderTarget(W * PR, H * PR, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(PR); composer.setSize(W, H);
  const DBG = new URLSearchParams(location.search).get('dbg') || '';
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, W * PR, H * PR);
  ao.updateGtaoMaterial({ radius: rad * .22, distanceExponent: 1.5, thickness: rad * .25, scale: 1.1, samples: 16 });
  ao.blendIntensity = night ? .7 : .85; if (!DBG.includes('noao')) composer.addPass(ao);
  if (!DBG.includes('nobloom')) composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), night ? .3 : .3, .45, night ? 3.0 : 2.1));
  composer.addPass(new OutputPass());
  if (DBG.includes('direct')) renderer.render(scene, camera); else composer.render();

  /* 2D overlay drawn in screen space (dashed paths and so on) */
  if (C.overlay) {
    const ink = document.getElementById('ink'); ink.width = W * 2; ink.height = H * 2; const ix = ink.getContext('2d'); ix.scale(2, 2);
    const toScreen = (p) => { const v = p.clone().project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
    C.overlay(ix, toScreen, hero, { night, W, H });
  }
  window.ready = true;
}

/* place the camera so the hero fills its region: iterate distance on the projected silhouette, then shift with a view offset */
function frame(camera, hero, region, view, W, H) {
  const [rx, ry, rw, rh] = region, fill = view.fill || .9;
  const pts = []; hero.traverse((m) => {
    if (!m.isMesh || m.userData.noFrame) return; const p = m.geometry.attributes.position, step = Math.max(1, Math.floor(p.count / 1500));
    for (let i = 0; i < p.count; i += step) pts.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld));
  });
  const box = new THREE.Box3().setFromPoints(pts), ctr = box.getCenter(new THREE.Vector3());
  const az = THREE.MathUtils.degToRad(view.az ?? -18), el = THREE.MathUtils.degToRad(view.el ?? 14);
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  let d = box.getSize(new THREE.Vector3()).length() * 2.4, cx = W / 2, cy = H / 2;
  for (let it = 0; it < 6; it++) {
    camera.clearViewOffset(); camera.position.copy(ctr).addScaledVector(dir, d); camera.lookAt(ctr); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { const v = p.clone().project(camera); const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const s = Math.max((x1 - x0) / (rw * fill), (y1 - y0) / (rh * fill)); d *= s; cx = (x0 + x1) / 2 / 1; cy = (y0 + y1) / 2;
    if (Math.abs(s - 1) < .004) break;
  }
  // recompute centre at final distance
  camera.position.copy(ctr).addScaledVector(dir, d); camera.lookAt(ctr); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of pts) { const v = p.clone().project(camera); const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const ax = view.alignX ?? .5, ay = view.alignY ?? .5; // where the hero sits inside its region
  const tx = rx + (rw - (x1 - x0)) * ax + (x1 - x0) / 2, ty = ry + (rh - (y1 - y0)) * ay + (y1 - y0) / 2;
  camera.setViewOffset(W, H, (x0 + x1) / 2 - tx, (y0 + y1) / 2 - ty, W, H); camera.updateProjectionMatrix();
}

/* ---------------- layouts ---------------- */
function fitH1(el, maxW, maxH, start, min = 40) {
  let s = start; el.style.fontSize = s + 'px';
  while (s > min && (el.scrollWidth > maxW + 1 || el.offsetHeight > maxH)) { s -= 2; el.style.fontSize = s + 'px'; }
  return s;
}
const lock = (light, small) => `<div class="lock${light ? ' light' : ''}${small ? ' small' : ''}"><img src="${CREST}" alt=""><div><b>Royal Crest Academy</b><i>SCIENCE · INNOVATION · SKILL</i></div></div>`;

function layout(C, sizeKey, W, H) {
  const ui = document.getElementById('ui'); const fam = C.family, night = fam === 'night', story = sizeKey === 'story', wide = sizeKey === 'wide';
  const M = wide ? 110 : (sizeKey === 'sq' ? 64 : 72), top = story ? 262 : (wide ? 64 : 54);
  const subPx = { sq: 27, feed: 31, grid: 32, story: 38, wide: 33 }[sizeKey];

  if (fam === 'studio' || fam === 'night') {
    const arr = (R_STUDIO[sizeKey][C.arr] ? C.arr : Object.keys(R_STUDIO[sizeKey])[0]);
    let { tb, hero } = R_STUDIO[sizeKey][arr];
    if (night && C.mirror && arr === 'beside' && !wide) { tb = [W - tb[0] - tb[2], tb[1], tb[2], tb[3]]; hero = [W - hero[0] - hero[2], hero[1], hero[2], hero[3]]; }
    if (wide && night && C.mirror) { tb = [W - tb[0] - tb[2], tb[1], tb[2], tb[3]]; hero = [W - hero[0] - hero[2], hero[1], hero[2], hero[3]]; }
    const lines = C.h.map((t, i) => `<span class="${i === C.key ? 'k' : ''}">${t}</span>`).join('');
    const ink = night ? '#f3efe6' : '#0b1533';
    ui.innerHTML = `
      <div class="abs" style="left:${M}px;top:${top}px">${lock(night)}</div>
      <div class="abs contact${night ? ' light' : ''}" style="left:${M + 2}px;top:${top + 88}px">${WA(ink)}<span>${PHONE}</span>${story ? `<span class="dot">·</span><span>${SITE}</span>` : ''}</div>
      <div class="abs tb" style="left:${tb[0]}px;top:${tb[1]}px;width:${tb[2]}px">
        <h1 class="h-grot">${lines}</h1><div class="rule"></div><p class="sub" style="font-size:${subPx}px">${C.sub}</p>
        ${story ? `<div class="pill" style="margin-top:34px"><em>FORM 1 · 2027</em>Enrolment open</div>` : ''}
      </div>
      ${story ? '' : `<div class="abs pill" style="left:${M}px;bottom:${wide ? 64 : 54}px"><em>FORM 1 · 2027</em>Enrolment open</div>
      <div class="abs site" style="right:${M}px;bottom:${wide ? 82 : 72}px">${SITE}</div>`}`;
    const h1 = ui.querySelector('h1'), sub = ui.querySelector('.sub');
    fitH1(h1, tb[2], tb[3] - sub.offsetHeight - 70 - (story ? 110 : 0), { sq: 150, feed: 150, grid: 156, story: 160, wide: 150 }[sizeKey]);
    if (arr === 'stack') { const b = ui.querySelector('.tb').getBoundingClientRect().bottom, t = b + (story ? 40 : 24), bot = story ? 1600 : H - 128; hero = [hero[0], t, hero[2], bot - t]; }
    return { hero };
  }

  if (fam === 'corner') {
    const { tb } = R_CORNER[sizeKey]; let hero = R_CORNER[sizeKey].hero;
    const metaPx = { sq: 18, feed: 19, grid: 20, story: 24, wide: 21 }[sizeKey];
    const bot = story ? 330 : (wide ? 60 : 52);
    const metasY = story ? 1440 : null;
    ui.innerHTML = `
      <div class="abs" style="left:${M}px;top:${top}px">${lock(false, true)}</div>
      <div class="abs meta r" style="right:${M}px;top:${top + 4}px;font-size:${metaPx}px"><b>${C.meta[0]}</b><span>${C.meta[1]}</span></div>
      <div class="abs tb" style="left:${tb[0]}px;top:${tb[1]}px;width:${tb[2]}px">
        <h1 class="h-grot one"><span class="k">${C.big}</span></h1>
        <p class="caps" style="font-size:${subPx + 3}px">${C.sub}</p>
      </div>
      <div class="abs meta" style="left:${M}px;${metasY ? `top:${metasY}px` : `bottom:${bot + 110}px`};font-size:${metaPx}px"><b>${C.note[0]}</b><span>${C.note[1]}</span></div>
      <div class="abs meta r" style="right:${M}px;${metasY ? `top:${metasY}px` : `bottom:${bot + 110}px`};font-size:${metaPx}px"><b>Form 1 · 2027</b><span>Enrolment open</span></div>
      <div class="abs contact" style="left:${M}px;bottom:${bot}px">${WA('#0b1533')}<span>${PHONE}</span></div>
      <div class="abs site" style="right:${M}px;bottom:${bot + 4}px">${SITE}</div>`;
    const h1 = ui.querySelector('h1'), cap = ui.querySelector('.caps');
    fitH1(h1, tb[2], tb[3] - cap.offsetHeight - 16, { sq: 150, feed: 150, grid: 156, story: 170, wide: 150 }[sizeKey]);
    if (!wide) { const b = ui.querySelector('.tb').getBoundingClientRect().bottom + 20, lim = story ? 1420 : H - bot - 150; hero = [hero[0], Math.min(hero[1], b), hero[2], lim - Math.min(hero[1], b)]; }
    return { hero };
  }

  // editorial (the "Oxford" look): framed page, centred serif headline, small caps details
  const E = R_EDIT[sizeKey]; const tc = E.tc; const left = wide;
  ui.innerHTML = `
    <div class="frame"></div>
    <div class="abs ${left ? '' : 'cx'}" style="${left ? `left:${tc[0]}px` : 'left:0;right:0'};top:${story ? 262 : (wide ? 92 : 52)}px">${lock(false, true)}</div>
    <div class="abs tc ${left ? 'l' : ''}" style="left:${tc[0]}px;top:${tc[1]}px;width:${tc[2]}px">
      <div class="eyebrow"><i></i><span>${C.eyebrow}</span><i></i></div>
      <h1 class="h-serif"><span>${C.h[0]}</span><span class="it">${C.h[1]}</span></h1>
      <p class="sub" style="font-size:${subPx}px">${C.sub}</p>
    </div>
    <div class="abs foot ${left ? 'l' : ''}" style="${left ? `left:${tc[0]}px;width:${tc[2]}px` : 'left:0;right:0'};top:${E.foot}px">
      <div class="hair"></div>
      <b>FORM 1 · JANUARY 2027 · ENROLMENT OPEN</b>
      <span>${WA('#525a70')} WhatsApp ${PHONE} · ${SITE}</span>
    </div>`;
  const h1 = ui.querySelector('h1'), rest = ui.querySelector('.eyebrow').offsetHeight + ui.querySelector('.sub').offsetHeight + 60;
  fitH1(h1, tc[2], tc[3] - rest, { sq: 104, feed: 112, grid: 118, story: 124, wide: 112 }[sizeKey], 40);
  let hero = E.hero;
  if (!wide) { const t = ui.querySelector('.tc').getBoundingClientRect().bottom + 22, b = E.foot - 24; hero = [hero[0], t, hero[2], b - t]; }
  return { hero };
}
