// Royal Crest concept posters v2: 27 concepts (copy, captions and 3D builders).
// Families: studio (ivory + gold foil), night (navy + crest yellow), editorial (framed serif), corner (metadata system).
// No flyer is numbered. Facts come from the school's prospectus data in /studio/data and the sources listed in README.md.
import * as THREE from 'three';
import { COL, rbox, cyl, sph, torus, lathe, tube, extrude, at, group, canvasTex, crumple, book, openBook, pencil, keycap, mortarboard, shieldShape, gearShape, puzzleShape, mesh, shadow } from './kit.js';

const leafShape = (l = .55, w = .2) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(l * .45, w, l, 0); s.quadraticCurveTo(l * .45, -w, 0, 0); return s; };

export const CONCEPTS = [
/* ------------------------------------------------------------------ */
{ id: 'talent-needs-direction', family: 'studio', arr: 'stack', h: ['Talent', 'needs', 'direction.'], key: 2,
  sub: 'Specialist teachers. Supervised boarding. One clear path.',
  view: { az: 0, el: 9, fov: 26, fill: .94, alignX: .85 },
  caption: ['🎯 Talent needs direction.', '', 'Every child has talent. At Royal Crest, specialist teachers, supervised boarding and a clear daily routine help them aim it.', '', 'ZIMSEC, Cambridge and HEXCO under one roof, plus one practical trade every year.'],
  status: '🎯 Talent needs direction. Form 1 2027 enrolment is open at Royal Crest Academy.', tags: ['#Boarding', '#Education'],
  build(M) {
    const G = new THREE.Group();
    const tgt = new THREE.Group();
    const face = canvasTex(2048, 2048, (x) => { const r = ['#13215a', '#f6f3ec', '#13215a', '#f6f3ec', '#13215a', '#d2ae4c']; r.forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(1024, 1024, 1024 * (1 - i / 6), 0, 7); x.fill(); }); });
    const disc = mesh(new THREE.CylinderGeometry(1.7, 1.7, .32, 128), [M.navyDeep, new THREE.MeshPhysicalMaterial({ map: face, roughness: .45, clearcoat: .3 }), M.navyDeep]);
    disc.rotation.x = Math.PI / 2; tgt.add(disc, at(torus(1.7, .05, M.gold), 0, 0, .165));
    const leg = (x, z, rx, rz, len) => tgt.add(at(cyl(.055, .065, len, M.wood, 16), x, -len / 2 * .96, z, rx, 0, rz));
    leg(-.55, -.25, -.12, -.2, 2.7); leg(.55, -.25, -.12, .2, 2.7); leg(0, -.7, .42, 0, 2.62);
    tgt.scale.setScalar(.92); tgt.position.set(0, 2.7 * .92 * .96 - .04, 0); tgt.rotation.y = -1.12; G.add(shadow(tgt));
    // gold paper plane in the bullseye
    const L = 1.55 * .72, S = .78 * .72, K = .26 * .72, P = (a, b, c) => new THREE.Vector3(a, b, c);
    const v = [[P(0, 0, 0), P(-L, .04, S), P(-L, 0, 0)], [P(0, 0, 0), P(-L, 0, 0), P(-L, .04, -S)], [P(0, 0, 0), P(-L, 0, 0), P(-L, -K, 0)]].flat().flatMap((p) => [p.x, p.y, p.z]);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); pg.computeVertexNormals();
    const plane = mesh(pg, M.goldPaper);
    const nrm = new THREE.Vector3(0, 0, 1).applyEuler(tgt.rotation), bull = nrm.clone().multiplyScalar(.15).add(tgt.position);
    const fwd = nrm.clone().negate().add(P(0, -.22, 0)).normalize(), up = P(0, 1, 0).addScaledVector(P(0, .2, 1).normalize(), .9).normalize();
    const zA = new THREE.Vector3().crossVectors(fwd, up).normalize(); up.crossVectors(zA, fwd).normalize();
    plane.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd, up, zA)); plane.position.copy(bull).addScaledVector(fwd, .06); G.add(plane);
    const balls = [[-3.85, 1.3, .38, 7], [-2.35, 2.3, .34, 3], [-5.05, 2.7, .42, 11], [-1.05, 3.3, .4, 5], [-.2, 4.3, .46, 21], [-1.9, 4.15, .4, 17], [1.55, 2.3, .36, 9], [-5.4, 4.6, .5, 23]];
    const bo = balls.map(([x, z, r, s]) => { const b = at(crumple(r, s), x, r * .78, z, s, s * 2, s * 3); b.userData.noFrame = true; G.add(b); return b; });
    G.userData.path = [bo[1].position.clone().add(P(.05, .38, 0)), new THREE.Vector3(-L, 0, 0).applyQuaternion(plane.quaternion).add(plane.position)];
    return G;
  },
  overlay(ix, toScreen, hero, { night }) {
    const [s, t] = hero.userData.path, c = s.clone().lerp(t, .5).add(new THREE.Vector3(-.5, .9, 0));
    const path = new THREE.QuadraticBezierCurve3(s, c, t); ix.setLineDash([14, 12]); ix.lineWidth = 3; ix.strokeStyle = '#0b1533'; ix.lineCap = 'round';
    ix.beginPath(); path.getPoints(80).forEach((p, i) => { const [x, y] = toScreen(p); i ? ix.lineTo(x, y) : ix.moveTo(x, y); }); ix.stroke();
    const [ax, ay] = toScreen(path.getPoint(1)), [bx, by] = toScreen(path.getPoint(.96)), a = Math.atan2(ay - by, ax - bx);
    ix.setLineDash([]); ix.lineWidth = 3.4; ix.beginPath(); ix.moveTo(ax - 22 * Math.cos(a - .45), ay - 22 * Math.sin(a - .45)); ix.lineTo(ax, ay); ix.lineTo(ax - 22 * Math.cos(a + .45), ay - 22 * Math.sin(a + .45)); ix.stroke();
  } },
/* ------------------------------------------------------------------ */
{ id: 'delete-the-mindset', family: 'corner', big: 'Delete', sub: '“I’m not a science<br>person” mindset.',
  meta: ['Mindset', 'for Grade 7 parents'], note: ['Every child can learn science', 'with the right teacher.'],
  view: { az: 0, el: 13, fov: 26, fill: .95 },
  caption: ['🗑️ Delete the “I’m not a science person” mindset.', '', 'Nobody is born “bad at science”. With specialist teachers and lessons that start in the lab, every learner can understand how the world works.', '', 'Biology, Chemistry and Physics, taught by specialists at Royal Crest Academy.'],
  status: '🗑️ Delete “I’m not a science person”. Science for every learner at Royal Crest.', tags: ['#Science', '#GrowthMindset'],
  build(M) {
    const G = new THREE.Group();
    const a = canvasTex(512, 512, (x) => { x.clearRect(0, 0, 512, 512); x.strokeStyle = '#fff'; x.lineWidth = 7; for (let i = -512; i < 1024; i += 34) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 512, 512); x.stroke(); x.beginPath(); x.moveTo(i + 512, 0); x.lineTo(i, 512); x.stroke(); } }, false);
    a.wrapS = a.wrapT = THREE.RepeatWrapping; a.repeat.set(9, 3);
    const binMat = new THREE.MeshStandardMaterial({ color: '#141821', roughness: .45, metalness: .5, alphaMap: a, alphaTest: .5, side: THREE.DoubleSide });
    const bin = group(at(mesh(new THREE.CylinderGeometry(1.55, 1.2, 2.6, 96, 1, true), binMat), 0, 1.3, 0), at(torus(1.55, .06, M.black), 0, 2.6, 0, Math.PI / 2), at(cyl(1.2, 1.2, .06, M.black, 64), 0, .03, 0));
    [[0, .55, 0, .55, 2], [-.6, .7, .3, .5, 4], [.55, .75, -.2, .5, 6], [.2, 1.25, .45, .48, 8], [-.35, 1.35, -.45, .5, 10], [.65, 1.6, .5, .42, 12], [-.7, 1.75, .15, .44, 14], [.1, 1.95, -.2, .5, 16], [-.2, 2.2, .55, .42, 18], [.75, 2.25, -.35, .4, 20]]
      .forEach(([x, y, z, r, s], i) => bin.add(at(crumple(r, s, i % 3 ? M.paper : M.ivory), x, y, z, s, s, s)));
    bin.scale.setScalar(.8); G.add(bin);
    const sub = (x) => { x.strokeStyle = '#f8d05a'; x.lineWidth = 30; x.lineJoin = x.lineCap = 'round'; x.beginPath(); x.moveTo(380, 560); x.lineTo(644, 560); x.stroke(); x.beginPath(); x.moveTo(460, 560); x.lineTo(470, 520); x.lineTo(554, 520); x.lineTo(564, 560); x.stroke(); x.beginPath(); x.moveTo(405, 600); x.lineTo(430, 820); x.lineTo(594, 820); x.lineTo(619, 600); x.stroke(); x.beginPath(); x.moveTo(478, 640); x.lineTo(484, 770); x.moveTo(546, 640); x.lineTo(540, 770); x.stroke(); };
    G.add(at(keycap('Delete', M, { size: 1.2, font: '700 210px Archivo', sub }), .65, 2.5, .45, .9, .25, -.38));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'potential-needs-structure', family: 'editorial', eyebrow: 'How we teach', h: ['Potential needs', 'structure.'],
  sub: 'Specialist teachers, steady routines, real support.',
  view: { az: -24, el: 20, fov: 24, fill: .92 },
  caption: ['🌱 Potential needs structure.', '', 'A seedling grows straight when it has support. So does a learner: specialist teachers, a steady daily routine and someone who checks in.', '', 'That is the Royal Crest way, from Form 1.'],
  status: '🌱 Potential needs structure. Form 1 2027 at Royal Crest Academy.', tags: ['#Education', '#Parenting'],
  build(M) {
    const G = group(openBook(3.2, 2.2, M.navy, M));
    G.add(at(sph(.42, M.soil), 0, .26, .05, 0, 0, 0)); G.children.at(-1).scale.set(1, .42, .9);
    const stem = [[0, .32, .05], [.05, .75, .05], [-.04, 1.2, .07], [.02, 1.68, .05]];
    G.add(tube(stem, .032, M.gold));
    [[.05, .75, .5, .1], [-.03, 1.05, 2.6, .3], [.0, 1.4, .3, .5], [.01, 1.62, 2.8, .7]].forEach(([x, y, ry, rz], i) => {
      const l = extrude(leafShape(.5 - i * .05, .17), .012, M.gold, .006); l.position.set(x, y, .05); l.rotation.set(-.3, ry, rz); G.add(l);
    });
    G.add(at(cyl(.032, .032, 1.9, M.navy, 16), .3, 1.05, -.1, 0, 0, -.06));
    [.7, 1.25].forEach((y) => G.add(at(torus(.17, .014, M.ivory), .17, y, -.02, Math.PI / 2, 0, .1)));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'small-steps-big-results', family: 'night', arr: 'stack', h: ['Small steps.', 'Big results.'], key: 1,
  sub: 'The five core subjects, taught by specialists.',
  view: { az: -32, el: 14, fov: 24, fill: .9 },
  caption: ['📚 Small steps. Big results.', '', 'Under the Heritage-Based Curriculum, Forms 1–4 share five compulsory learning areas: Mathematics, English, an indigenous language, Combined Science and Heritage Studies.', '', 'At Royal Crest all five are taught by specialists, with ChiShona and isiNdebele both on offer, one step at a time.'],
  status: '📚 Small steps, big results. The five core subjects, taught by specialists.', tags: ['#HeritageBasedCurriculum', '#Form1'],
  build(M) {
    const G = new THREE.Group(), covers = [M.navy, M.ivory, M.yellow, M.navy, M.ivory];
    covers.forEach((c, i) => G.add(at(book(2.4, .34, 1.7, c, M, i % 2 ? M.navy : M.goldSatin), i * .46, .17 + i * .345, 0, 0, (i % 2 ? .03 : -.03))));
    G.add(at(mortarboard(M, M.yellow), 4 * .46 + .35, .34 * 5 + .02, 0, 0, .5, 0, .62));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'practice-makes-permanent', family: 'studio', arr: 'stack', h: ['Practice', 'makes', 'permanent.'], key: 2,
  sub: 'Daily prep, past papers and patient teachers.',
  view: { az: -34, el: 30, fov: 24, fill: .96 },
  caption: ['✏️ Practice makes permanent.', '', 'Pencils get shorter. Skills get stronger. Daily prep, past-paper practice and mock exams build the habits that last.', '', 'Examination preparation aligned to ZIMSEC and Cambridge at Royal Crest Academy.'],
  status: '✏️ Practice makes permanent. Exam preparation at Royal Crest Academy.', tags: ['#ExamPrep', '#StudyTips'],
  build(M) {
    const G = new THREE.Group();
    [3.0, 2.5, 2.0, 1.5, 1.0, .55].forEach((len, i) => G.add(at(pencil(len, i % 2 ? M.yellow : M.navy, M), 1.25 - (len / 2 + .39), .085, -.65 + i * .26, 0, 0, 0)));
    const cup = lathe([[0, 0], [.42, 0], [.42, .1], [.14, .14], [.1, .48], [.16, .6], [.46, .9], [.52, 1.28], [.48, 1.3], [0, 1.3]], M.gold);
    const tro = group(at(rbox(.9, .32, .9, .06, M.navy), 0, .16, 0), at(cup, 0, .32, 0), at(torus(.22, .045, M.gold, Math.PI), .5, 1.32, 0, 0, 0, -Math.PI / 2), at(torus(.22, .045, M.gold, Math.PI), -.5, 1.32, 0, 0, Math.PI, -Math.PI / 2));
    G.add(at(tro, 2.15, 0, -.05, 0, -.3, 0, .9));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'unlock-their-potential', family: 'night', arr: 'beside', h: ['Unlock', 'their', 'potential.'], key: 2,
  sub: 'Teachers who find what each child does best.',
  view: { az: -28, el: 10, fov: 24, fill: .88 },
  caption: ['🔑 Unlock their potential.', '', 'Every learner has a key subject, a key skill, a key moment. Our job is to find it, with specialist teachers, clubs, sport and a practical trade every year.', '', 'Royal Crest Academy opens 1 January 2027.'],
  status: '🔑 Unlock their potential. Royal Crest Academy, Form 1 2027.', tags: ['#Potential', '#Form1'],
  build(M) {
    const G = new THREE.Group();
    G.add(at(extrude(shieldShape(1.72, 2.12), .4, M.gold, .03), 0, 1.06, -.08));
    G.add(at(extrude(shieldShape(1.6, 2), .55, M.navy, .06), 0, 1.06, 0));
    G.add(at(torus(.5, .1, M.gold, Math.PI), 0, 2.32, 0), at(cyl(.1, .1, .5, M.gold), -.5, 2.1, 0), at(cyl(.1, .1, .5, M.gold), .5, 2.1, 0));
    const kh = new THREE.Shape(); kh.absarc(0, .12, .14, 0, Math.PI * 2); const kt = new THREE.Shape(); kt.moveTo(-.07, .05); kt.lineTo(.07, .05); kt.lineTo(.11, -.3); kt.lineTo(-.11, -.3);
    G.add(at(extrude(kh, .02, M.black, 0), 0, 1.05, .36), at(extrude(kt, .02, M.black, 0), 0, 1.05, .36));
    const key = group(at(cyl(.06, .06, .9, M.gold), 0, 0, .45, Math.PI / 2), at(torus(.24, .065, M.gold), 0, 0, 1.12, 0, Math.PI / 2), at(rbox(.04, .22, .12, .02, M.gold), 0, -.1, .18), at(rbox(.04, .14, .1, .02, M.gold), 0, -.07, .34));
    G.add(at(key, 0, 1.17, .3, 0, 0, .5));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'a-second-home', family: 'editorial', eyebrow: 'Boarding', h: ['A second', 'home.'],
  sub: 'Supervised boarding with four homemade meals a day.',
  view: { az: -30, el: 16, fov: 24, fill: .9 },
  caption: ['🏡 A second home.', '', 'Fully supervised boarding, a calm place to study, daily devotions and four homemade meals a day.', '', 'Boarding places are scarce: for the 2026 intake, the Ministry of Primary and Secondary Education reported about 30,000 government Form 1 boarding places nationwide. Speak to us early about January 2027.'],
  status: '🏡 A second home: supervised boarding at Royal Crest Academy.', tags: ['#Boarding', '#BoardingSchool'],
  build(M) {
    const G = new THREE.Group();
    [[0, .015, 0, .05], [.08, .045, .05, -.06], [-.05, .075, -.04, .1]].forEach(([x, y, z, r]) => G.add(at(rbox(3.0, .03, 2.1, .01, M.paper), x, y, z, 0, r)));
    const H = new THREE.Group();
    H.add(at(rbox(1.6, 1.1, 1.2, .02, M.paper), 0, .55, 0));
    H.add(at(rbox(1.78, .04, .86, .01, M.goldPaper), 0, 1.36, -.3, -.72), at(rbox(1.78, .04, .86, .01, M.goldPaper), 0, 1.36, .3, .72));
    H.add(at(rbox(.22, .4, .22, .01, M.paper), .45, 1.5, -.25));
    for (const x of [-.45, .45]) H.add(at(mesh(new THREE.PlaneGeometry(.3, .32), M.yellowGlow), x, .72, .605));
    H.add(at(mesh(new THREE.PlaneGeometry(.3, .5), M.navyMatte), 0, .27, .605));
    for (const z of [-.25, .25]) H.add(at(mesh(new THREE.PlaneGeometry(.26, .3), M.yellowGlow), .805, .72, z, 0, Math.PI / 2));
    const pl = new THREE.PointLight('#ffc970', 3, 3, 2); pl.position.set(0, .7, 0); H.add(pl);
    G.add(at(H, 0, .09, 0, 0, .2));
    [[-1.25, -.45, .75], [1.2, .55, .6], [-1.0, .65, .5]].forEach(([x, z, s]) => G.add(at(group(cyl(0, .36, 1.0, M.navyMatte, 6), at(cyl(.05, .05, .2, M.wood, 8), 0, -.55, 0)), x, .09 + .6 * s, z, 0, 0, 0, s)));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'curiosity-is-the-spark', family: 'night', arr: 'beside', mirror: true, h: ['Curiosity', 'is the', 'spark.'], key: 2,
  sub: 'Hands-on science from the very first week.',
  view: { az: -20, el: 12, fov: 24, fill: .9 },
  caption: ['💡 Curiosity is the spark.', '', 'Why does it glow? Why does it float? Why does it rust? At Royal Crest, questions lead straight to the lab bench.', '', 'Biology, Chemistry, Physics and Computer Science, taught by specialists.'],
  status: '💡 Curiosity is the spark. Science at Royal Crest Academy.', tags: ['#STEM', '#Science'],
  build(M) {
    const G = group(at(book(2.0, .26, 1.4, M.navy, M, M.goldSatin), 0, .13, 0, 0, .1), at(book(1.8, .24, 1.25, M.ivory, M, M.navy), .05, .38, 0, 0, -.08));
    const B = new THREE.Group(); B.scale.setScalar(1.25);
    const ridges = []; for (let i = 0; i <= 8; i++) ridges.push([i % 2 ? .3 : .34, i * .07]); ridges.unshift([0, 0]); ridges.push([.33, .58], [0, .58]);
    B.add(lathe(ridges, M.gold));
    B.add(at(lathe([[0, 0], [.14, 0], [.0, -.1]], M.black), 0, 0, 0));
    const glass = lathe([[.3, .56], [.33, .72], [.42, .95], [.66, 1.3], [.72, 1.6], [.64, 1.95], [.4, 2.16], [0, 2.24]], M.glass); glass.castShadow = false; B.add(glass);
    const coil = []; for (let i = 0; i <= 60; i++) { const t = i / 60; coil.push([(t - .5) * .5, 1.55 + Math.sin(t * Math.PI * 10) * .045, Math.cos(t * Math.PI * 10) * .045]); }
    B.add(tube(coil, .012, M.yellowGlow)); B.add(at(cyl(.008, .008, .95, M.gold, 8), -.25, 1.08, 0, 0, 0, .12), at(cyl(.008, .008, .95, M.gold, 8), .25, 1.08, 0, 0, 0, -.12));
    const pl = new THREE.PointLight('#ffd27a', 6, 6, 1.6); pl.position.set(0, 1.55, 0); B.add(pl);
    G.add(at(B, .05, .5, 0, 0, 0, 0, 1.25));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'ideas-you-can-build', family: 'studio', arr: 'stack', h: ['Ideas you', 'can build.'], key: 1,
  sub: 'From Technical Graphics to Building Technology.',
  view: { az: -28, el: 22, fov: 24, fill: .93 },
  caption: ['🌉 Ideas you can build.', '', 'Draw it right, then build it right. Learners go from line types and title blocks in Technical Graphics to foundations and roofs in Building Technology.', '', 'Technical and vocational subjects at Royal Crest Academy, Bikita.'],
  status: '🌉 Ideas you can build. Technical subjects at Royal Crest Academy.', tags: ['#TechnicalGraphics', '#Engineering'],
  build(M) {
    const G = new THREE.Group();
    const bp = canvasTex(2048, 1280, (x, w, h) => { x.fillStyle = '#1a2f74'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; for (let i = 0; i < w; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let j = 0; j < h; j += 64) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); } x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 5; x.strokeRect(60, 60, w - 120, h - 120); x.strokeRect(w - 560, h - 260, 500, 200); x.beginPath(); x.moveTo(300, 820); x.lineTo(1700, 820); x.moveTo(300, 820); x.lineTo(450, 560); x.lineTo(1550, 560); x.lineTo(1700, 820); for (let k = 0; k <= 8; k++) { const xx = 450 + k * 137.5; x.moveTo(xx, 560); x.lineTo(xx, 820); } x.stroke(); });
    G.add(at(mesh(new THREE.BoxGeometry(4.6, .02, 2.9), [M.paper, M.paper, new THREE.MeshStandardMaterial({ map: bp, roughness: .8 }), M.paper, M.paper, M.paper]), 0, .01, 0));
    const balsa = new THREE.MeshPhysicalMaterial({ color: '#d9b283', roughness: .6 });
    G.add(at(rbox(.55, .5, .8, .03, M.ivory), -1.6, .27, 0), at(rbox(.55, .5, .8, .03, M.ivory), 1.6, .27, 0));
    G.add(at(rbox(3.5, .06, .56, .01, balsa), 0, .55, 0));
    const bar = (a, b, r = .028) => { const A = new THREE.Vector3(...a), B2 = new THREE.Vector3(...b), m = cyl(r, r, A.distanceTo(B2), balsa, 8); m.position.copy(A).add(B2).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B2.clone().sub(A).normalize()); G.add(m); };
    for (const z of [-.26, .26]) { bar([-1.5, .58, z], [1.5, .58, z]); bar([-1.15, 1.1, z], [1.15, 1.1, z]); bar([-1.5, .58, z], [-1.15, 1.1, z]); bar([1.5, .58, z], [1.15, 1.1, z]);
      for (let k = 0; k <= 6; k++) { const x = -1.15 + k * (2.3 / 6); bar([x, .58, z], [x, 1.1, z]); if (k < 6) bar([x, .58, z], [x + 2.3 / 6, 1.1, z]); } }
    for (let k = 0; k <= 6; k++) bar([-1.15 + k * (2.3 / 6), 1.1, -.26], [-1.15 + k * (2.3 / 6), 1.1, .26], .02);
    G.add(at(pencil(2.0, M.navy, M), .6, .1, 1.05, 0, .35, 0));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'ask-then-test-it', family: 'corner', big: 'Ask.', sub: 'Then test it<br>in a real lab.',
  meta: ['Science', 'at Royal Crest'], note: ['Biology, Chemistry, Physics', 'taught by specialists.'],
  view: { az: -14, el: 12, fov: 24, fill: .92 },
  caption: ['🧪 Ask. Then test it.', '', 'Good science starts with a question and ends with evidence. Our learners plan it, test it and write it up, the way ZIMSEC and Cambridge practicals expect.', '', 'Science labs and specialist teachers at Royal Crest Academy.'],
  status: '🧪 Ask, then test it. Practical science at Royal Crest Academy.', tags: ['#Chemistry', '#Science'],
  build(M) {
    const G = group(at(book(2.6, .14, 1.9, M.navy, M, M.goldSatin), 0, .07, 0, 0, .08));
    const F = new THREE.Group();
    const gm = M.glass.clone(); gm.side = THREE.DoubleSide; gm.thickness = .3; gm.roughness = .06; gm.attenuationColor = new THREE.Color('#9fb0e0'); gm.attenuationDistance = .6; gm.specularIntensity = 1;
    const fl = lathe([[0, .005], [.82, .005], [.86, .07], [.34, 1.28], [.28, 1.84], [.34, 1.9], [.3, 1.92]], gm); fl.castShadow = false; F.add(fl);
    const liq = new THREE.MeshPhysicalMaterial({ color: '#f8c828', roughness: .12, clearcoat: 1, emissive: '#f0a800', emissiveIntensity: .45 });
    F.add(lathe([[0, .03], [.79, .03], [.8, .06], [.58, .58], [0, .58]], liq));
    const bub = new THREE.MeshPhysicalMaterial({ color: '#fff6d6', roughness: .1, clearcoat: 1, transmission: .3, thickness: .1 });
    [[.1, .75, .05, .07], [-.08, 1.0, .02, .05], [.05, 1.3, -.03, .045], [-.03, 1.62, .02, .04], [.06, 2.05, .0, .05], [-.05, 2.35, .05, .035]].forEach(([x, y, z, r]) => F.add(at(sph(r, bub, 24), x, y, z)));
    G.add(at(F, 0, .14, 0));
    G.add(at(cyl(.025, .025, 2.0, gm, 16), 1.05, .62, .4, 0, 0, .55));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'every-question-counts', family: 'editorial', eyebrow: 'In the classroom', h: ['Every question', 'counts.'],
  sub: 'Teachers who make time for every question.',
  view: { az: -18, el: 10, fov: 24, fill: .9 },
  caption: ['🔍 Every question counts.', '', 'The best learners are not the ones with all the answers. They are the ones who keep asking. Our teachers make time for every question.', '', 'Private lessons and small-group support are also available, Form 1 to Upper 6.'],
  status: '🔍 Every question counts. Royal Crest Academy, Form 1 2027.', tags: ['#Learning', '#Teachers'],
  build(M) {
    const G = new THREE.Group();
    G.add(tube([[-.5, 1.55, 0], [-.42, 1.92, 0], [0, 2.1, 0], [.42, 1.95, 0], [.5, 1.55, 0], [.2, 1.22, 0], [.02, .98, 0], [0, .72, 0]], .15, M.gold));
    G.add(at(sph(.17, M.gold), 0, .17, 0));
    const mag = group(torus(.55, .07, M.navy), at(cyl(.53, .53, .03, M.glass, 64), 0, 0, 0, Math.PI / 2), at(cyl(.07, .085, 1.1, M.navy, 24), 0, -1.15, 0), at(cyl(.09, .09, .14, M.gold, 24), 0, -.6, 0));
    mag.children[1].castShadow = false;
    G.add(at(mag, .85, 1.15, .55, .15, -.55, -.5));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'aim-higher', family: 'night', arr: 'beside', h: ['Aim', 'higher.'], key: 1,
  sub: 'Ambition, with the support to reach it.',
  view: { az: -22, el: 8, fov: 24, fill: .9, alignY: .55 },
  caption: ['🚀 Aim higher.', '', 'Doctor, engineer, chef, coder, entrepreneur. Big goals need a launch pad: strong academics, a practical trade every year and teachers who believe in them.', '', 'Form 1 enrolment for January 2027 is open.'],
  status: '🚀 Aim higher. Form 1 2027 at Royal Crest Academy.', tags: ['#Ambition', '#Careers'],
  build(M) {
    const G = group(at(book(2.6, .3, 1.8, M.ivory, M, M.navy), 0, .15, 0, 0, -.12), at(book(2.2, .28, 1.5, M.navy, M, M.goldSatin), 0, .44, 0, 0, .1));
    const R = new THREE.Group();
    R.add(lathe([[0, 0], [.3, 0], [.34, .25], [.36, 1.2], [.31, 1.62], [.17, 1.95], [0, 2.1]], M.ivory));
    R.add(at(lathe([[0, 1.66], [.3, 1.66], [.17, 1.96], [0, 2.11]], M.yellow), 0, 0, 0, 0, 0, 0, 1.012));
    R.add(at(torus(.13, .025, M.gold), 0, 1.15, .345), at(cyl(.12, .12, .02, M.glass, 32), 0, 1.15, .34, Math.PI / 2));
    for (let i = 0; i < 3; i++) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.42, -.1); s.lineTo(.42, .2); s.lineTo(0, .75); const f = extrude(s, .05, M.navy, .015); f.position.set(Math.cos(i * 2.094) * .32, .05, Math.sin(i * 2.094) * .32); f.rotation.y = -i * 2.094; R.add(f); }
    const fl = at(cyl(.24, 0, .8, M.yellowGlow, 32), 0, -.42, 0); fl.castShadow = false; R.add(fl);
    const pl = new THREE.PointLight('#ffc451', 8, 5, 1.6); pl.position.set(0, -.5, 0); R.add(pl);
    G.add(at(R, 0, 1.55, 0, 0, 0, .1));
    [[-.5, .7, .3, .32], [.45, .72, .2, .3], [0, .7, -.4, .28], [-.2, .78, .5, .24], [.7, .66, -.2, .22], [-.8, .64, -.1, .22]].forEach(([x, y, z, r], i) => { const p = at(sph(r, M.white, 32), x, y, z); p.scale.y = .8; G.add(p); });
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'time-well-spent', family: 'editorial', eyebrow: 'Routine', h: ['Time well', 'spent.'],
  sub: 'A timetable that makes every hour count.',
  view: { az: -16, el: 8, fov: 24, fill: .88 },
  caption: ['⏳ Time well spent.', '', 'Assembly and devotion, lessons, practicals, prep, sport and lights out. A steady routine is one of the quiet secrets of good results.', '', 'Supervised boarding at Royal Crest Academy, Bikita.'],
  status: '⏳ Time well spent: the Royal Crest routine.', tags: ['#Routine', '#Boarding'],
  build(M) {
    const G = new THREE.Group();
    G.add(at(cyl(.78, .82, .16, M.navy, 64), 0, .08, 0), at(cyl(.82, .78, .16, M.navy, 64), 0, 2.36, 0));
    for (let i = 0; i < 3; i++) G.add(at(cyl(.045, .045, 2.12, M.gold, 16), Math.cos(i * 2.094 + .5) * .66, 1.22, Math.sin(i * 2.094 + .5) * .66));
    const g = lathe([[.03, .16], [.5, .2], [.58, .46], [.48, .82], [.09, 1.22], [.48, 1.62], [.58, 1.98], [.5, 2.24], [.03, 2.28]], M.glass); g.castShadow = false; G.add(g);
    G.add(lathe([[0, .2], [.5, .21], [.3, .42], [0, .52]], M.goldSatin), lathe([[0, 1.3], [.22, 1.4], [.42, 1.58], [.46, 1.72], [0, 1.72]], M.goldSatin), at(cyl(.012, .012, .8, M.goldSatin, 8), 0, .9, 0));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'mind-and-body', family: 'studio', arr: 'beside', h: ['Mind', 'and', 'body.'], key: 2,
  sub: 'Ten sports, ten clubs and five indoor games.',
  view: { az: -26, el: 14, fov: 24, fill: .9 },
  caption: ['🏉 Mind and body.', '', 'Rugby, hockey, basketball, netball, tennis and more, plus chess, debate, robotics and music. Ten sports, ten clubs and five indoor games.', '', 'Because a strong body helps a strong mind, at Royal Crest Academy.'],
  status: '🏉 Mind and body: 10 sports, 10 clubs and 5 indoor games at Royal Crest.', tags: ['#Sport', '#Clubs'],
  build(M) {
    const G = group(at(book(2.5, .32, 1.8, M.navy, M, M.goldSatin), 0, .16, 0, 0, .06), at(book(2.3, .3, 1.7, M.ivory, M, M.navy), .04, .47, 0, 0, -.07), at(book(2.1, .28, 1.5, M.navy, M, M.goldSatin), -.02, .76, 0, 0, .12));
    const prof = []; for (let i = 0; i <= 48; i++) { const t = i / 48, y = (t - .5) * 2.3; prof.push([Math.max(.001, Math.sin(t * Math.PI) ** 1.05 * .62), y]); }
    const leather = new THREE.MeshPhysicalMaterial({ color: COL.navy, roughness: .55, clearcoat: .25, sheen: .3 });
    const ball = group(lathe(prof, leather), at(torus(.535, .03, M.yellow), 0, .42, 0, Math.PI / 2), at(torus(.535, .03, M.yellow), 0, -.42, 0, Math.PI / 2));
    G.add(at(ball, 0, .9 + .6, 0, 0, -.5, Math.PI / 2));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'speak-with-confidence', family: 'night', arr: 'beside', mirror: true, h: ['Speak', 'with', 'confidence.'], key: 2,
  sub: 'Debate and public speaking, from Form 1.',
  view: { az: -24, el: 8, fov: 24, fill: .9 },
  caption: ['🎙️ Speak with confidence.', '', 'Interviews, presentations, leadership. The Debate & Public Speaking club gives learners a stage, a structure and the nerve to use their voice.', '', 'One of ten clubs at Royal Crest Academy.'],
  status: '🎙️ Speak with confidence: Debate & Public Speaking at Royal Crest.', tags: ['#Debate', '#PublicSpeaking'],
  build(M) {
    const G = new THREE.Group();
    G.add(at(cyl(.75, .8, .09, M.navy, 64), 0, .045, 0), at(cyl(.16, .2, .12, M.gold, 32), 0, .15, 0), at(cyl(.035, .035, 2.2, M.gold, 16), 0, 1.25, 0));
    const a = canvasTex(256, 256, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#fff'; for (let i = 0; i < 256; i += 16) for (let j = 0; j < 256; j += 16) { x.beginPath(); x.arc(i + 8, j + 8, 5.5, 0, 7); x.fill(); } }, false);
    a.wrapS = a.wrapT = THREE.RepeatWrapping; a.repeat.set(14, 7);
    const grille = new THREE.MeshPhysicalMaterial({ color: '#d9dbe2', metalness: 1, roughness: .32, alphaMap: a, alphaTest: .5, side: THREE.DoubleSide });
    const mic = group(sph(.38, M.black), sph(.42, grille), at(torus(.42, .035, M.gold), 0, -.05, 0, Math.PI / 2), at(lathe([[0, 0], [.2, 0], [.25, .9], [.34, .98], [.34, 1.02], [0, 1.02]], M.navy), 0, -1.38, 0));
    G.add(at(mic, .25, 2.75, 0, 0, 0, -.42));
    G.add(at(rbox(.18, .2, .3, .05, M.gold), .1, 2.35, 0, 0, 0, -.42));
    G.add(tube([[0, .08, 0], [.6, .03, .5], [1.3, .03, .3], [1.6, .03, -.3], [1.1, .03, -.7]], .035, M.black));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'build-what-others-use', family: 'corner', big: 'Code.', sub: 'Build what others<br>only use.',
  meta: ['Computer Science', '& Robotics club'], note: ['Apps, games and robots,', 'built by learners.'],
  view: { az: -12, el: 44, fov: 24, fill: .95 },
  caption: ['⌨️ Code. Build what others only use.', '', 'Computer Science at Royal Crest goes beyond typing and clicking. Learners write programs, build games and wire robots in the Robotics & Coding club.', '', 'Computer Science from Form 1 at Royal Crest Academy.'],
  status: '⌨️ Code: build what others only use. Computer Science at Royal Crest.', tags: ['#Coding', '#Robotics'],
  build(M) {
    const G = new THREE.Group();
    ['C', 'O', 'D', 'E'].forEach((l, i) => { const y = i === 3; G.add(at(keycap(l, M, { size: 1, base: y ? '#f8c828' : COL.navyDeep, ink: y ? COL.navy : '#f8d05a', font: '800 560px Archivo' }), -2.4 + i * 1.6, .36 - (i === 2 ? .06 : 0), (i % 2) * .2, 0, (i - 1.5) * .12, 0)); });
    G.add(tube([[2.9, .05, .2], [3.4, .03, .9], [3.9, .03, .4], [4.2, .03, 1.3]], .045, M.black));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'measure-twice-build-once', family: 'studio', arr: 'stack', h: ['Measure twice.', 'Build once.'], key: 1,
  sub: 'Technical Graphics, taught the precise way.',
  view: { az: -20, el: 40, fov: 24, fill: .93 },
  caption: ['📐 Measure twice. Build once.', '', 'Line types, scale, projection and title blocks. Technical Graphics teaches learners to think on paper before they cut, weld or build.', '', 'Technical and vocational subjects at Royal Crest Academy.'],
  status: '📐 Measure twice, build once. Technical Graphics at Royal Crest.', tags: ['#TechnicalGraphics', '#Drawing'],
  build(M) {
    const G = new THREE.Group();
    const dw = canvasTex(2048, 1400, (x, w, h) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1f2f6e'; x.lineWidth = 4; x.strokeRect(50, 50, w - 100, h - 100); x.strokeRect(w - 600, h - 230, 550, 180); x.lineWidth = 3; x.strokeRect(300, 380, 520, 420); x.strokeRect(1000, 380, 340, 420); x.setLineDash([18, 12]); x.beginPath(); x.moveTo(300, 590); x.lineTo(820, 590); x.stroke(); x.setLineDash([]); x.beginPath(); x.moveTo(820, 380); x.lineTo(1000, 380); x.moveTo(820, 800); x.lineTo(1000, 800); x.stroke(); });
    G.add(at(mesh(new THREE.BoxGeometry(4.4, .02, 3.0), [M.paper, M.paper, new THREE.MeshStandardMaterial({ map: dw, roughness: .85 }), M.paper, M.paper, M.paper]), 0, .01, 0));
    const rt = canvasTex(2048, 256, (x, w, h) => { x.fillStyle = '#f6f3ec'; x.fillRect(0, 0, w, h); x.fillStyle = '#13215a'; for (let i = 0; i <= 300; i++) { const X = 40 + i * 6.6; x.fillRect(X, 0, 2.5, i % 10 ? (i % 5 ? 40 : 64) : 96); if (i % 10 === 0) { x.font = '600 34px Archivo'; x.fillText(String(i / 10), X - 8, 140); } } });
    G.add(at(mesh(new THREE.BoxGeometry(3.4, .05, .42), [M.ivory, M.ivory, new THREE.MeshPhysicalMaterial({ map: rt, roughness: .4, clearcoat: .4 }), M.ivory, M.ivory, M.ivory]), -.2, .045, .95, 0, .06));
    const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(1.7, 0); tri.lineTo(0, 1.7); tri.lineTo(0, 0);
    const hole = new THREE.Path(); hole.moveTo(.28, .28); hole.lineTo(.28, 1.0); hole.lineTo(1.0, .28); hole.lineTo(.28, .28); tri.holes.push(hole);
    const acr = new THREE.MeshPhysicalMaterial({ color: '#f8c828', roughness: .08, transmission: .55, thickness: .1, clearcoat: 1 });
    G.add(at(extrude(tri, .03, acr, .01), .2, .05, .2, -Math.PI / 2, 0, .3));
    const C2 = group(at(cyl(.1, .1, .22, M.gold, 24), 0, 1.5, 0), at(cyl(.025, .025, .3, M.gold), 0, 1.74, 0), at(cyl(.035, .012, 1.45, M.gold, 16), -.28, .8, 0, 0, 0, -.38), at(cyl(.035, .012, 1.45, M.gold, 16), .28, .8, 0, 0, 0, .38));
    G.add(at(C2, 1.3, .02, -.55, 0, -.4, 0));
    G.add(at(pencil(1.8, M.navy, M), -.9, .1, -.75, 0, -.5, 0));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'good-food-good-focus', family: 'editorial', eyebrow: 'Boarding life', h: ['Good food.', 'Good focus.'],
  sub: 'Four homemade meals a day for every boarder.',
  view: { az: -24, el: 12, fov: 24, fill: .88 },
  caption: ['🍎 Good food. Good focus.', '', 'Peanut butter porridge, queen cakes, sadza and beef stew. Boarders at Royal Crest get four homemade meals every single day.', '', 'Because hungry learners can’t concentrate.'],
  status: '🍎 Good food, good focus. Four homemade meals a day for every boarder.', tags: ['#Boarding', '#SchoolMeals'],
  build(M) {
    const G = group(at(book(2.4, .3, 1.7, M.navy, M, M.goldSatin), 0, .15, 0, 0, .08), at(book(2.2, .28, 1.6, M.ivory, M, M.navy), .03, .44, 0, 0, -.1), at(book(2.0, .26, 1.4, M.navy, M, M.goldSatin), -.02, .71, 0, 0, .05));
    const skin = new THREE.MeshPhysicalMaterial({ color: '#b3141f', roughness: .32, clearcoat: .85, clearcoatRoughness: .18, sheen: .25, sheenColor: '#ff6a5c' });
    const A = group(lathe([[0, .07], [.16, .0], [.36, .04], [.5, .2], [.58, .48], [.56, .74], [.44, .92], [.24, .96], [.08, .86], [0, .82]], skin), at(cyl(.025, .035, .3, M.wood, 12), .02, .95, 0, 0, 0, -.2));
    const lf = extrude(leafShape(.42, .14), .012, M.green, .006); lf.position.set(.06, 1.02, 0); lf.rotation.set(.3, -.4, .5); A.add(lf);
    G.add(at(A, 0, .84, 0, 0, .4, 0, 1.15));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'sleep-builds-memory', family: 'night', arr: 'beside', h: ['Sleep', 'builds', 'memory.'], key: 2,
  sub: 'Teens need 8 to 10 hours a night.',
  view: { az: -22, el: 10, fov: 24, fill: .9 },
  caption: ['⏰ Sleep builds memory.', '', 'The American Academy of Sleep Medicine recommends 8 to 10 hours of sleep a night for teenagers aged 13 to 18. Regular sleep is linked with better attention, learning and memory.', '', 'A steady daily routine is part of supervised boarding at Royal Crest Academy.'],
  status: '⏰ Teens need 8–10 hours of sleep a night. Sleep builds memory.', tags: ['#StudyTips', '#Wellbeing'],
  build(M) {
    const G = new THREE.Group();
    const pil = rbox(2.9, .55, 1.9, .27, M.ivory, 6); pil.scale.y = .9; G.add(at(pil, 0, .26, 0));
    const face = canvasTex(1024, 1024, (x) => { x.fillStyle = '#f6f3ec'; x.beginPath(); x.arc(512, 512, 512, 0, 7); x.fill(); x.fillStyle = '#13215a'; for (let i = 0; i < 60; i++) { x.save(); x.translate(512, 512); x.rotate(i / 60 * Math.PI * 2); x.fillRect(-4, -470, 8, i % 5 ? 26 : 58); x.restore(); } const hand = (a, l, w) => { x.save(); x.translate(512, 512); x.rotate(a); x.fillRect(-w / 2, -l, w, l + 40); x.restore(); }; hand(Math.PI * 2 * (9.5 / 12), 260, 26); hand(Math.PI, 380, 16); x.fillStyle = '#d2ae4c'; x.beginPath(); x.arc(512, 512, 26, 0, 7); x.fill(); });
    const C = new THREE.Group();
    C.add(at(cyl(.75, .75, .42, M.navy, 64), 0, 0, 0, Math.PI / 2));
    C.add(at(mesh(new THREE.CircleGeometry(.64, 64), new THREE.MeshPhysicalMaterial({ map: face, roughness: .3, clearcoat: .6 })), 0, 0, .213));
    C.add(at(torus(.69, .06, M.gold), 0, 0, .2));
    for (const s of [-1, 1]) { const bell = mesh(new THREE.SphereGeometry(.36, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.gold); C.add(at(bell, s * .5, .72, 0, 0, 0, -s * .45)); C.add(at(cyl(.045, .045, .3, M.gold), s * .45, -.78, 0, 0, 0, s * .5)); }
    C.add(at(torus(.32, .04, M.gold, Math.PI), 0, .78, 0), at(cyl(.03, .03, .4, M.gold), 0, .88, 0));
    G.add(at(C, 0, .5 + .95, 0, 0, .2, 0));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'think-three-moves-ahead', family: 'studio', arr: 'stack', h: ['Think', 'three moves', 'ahead.'], key: 2,
  sub: 'Chess is one of five indoor games at Royal Crest.',
  view: { az: -30, el: 24, fov: 24, fill: .93 },
  caption: ['♟️ Think three moves ahead.', '', 'Chess teaches patience, planning and losing well, then winning better. It is one of five indoor games at Royal Crest, alongside table tennis, darts, quiz and balloon volleyball.', '', 'Clubs, sports and indoor games for every learner.'],
  status: '♟️ Think three moves ahead. Chess club at Royal Crest Academy.', tags: ['#Chess', '#IndoorGames'],
  build(M) {
    const G = new THREE.Group();
    const ck = canvasTex(1024, 1024, (x) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#13215a' : '#efe9dc'; x.fillRect(i * 128, j * 128, 128, 128); } });
    const edge = new THREE.MeshPhysicalMaterial({ color: '#7a5230', roughness: .45, clearcoat: .4 });
    G.add(at(mesh(new THREE.BoxGeometry(3.4, .14, 3.4), [edge, edge, new THREE.MeshPhysicalMaterial({ map: ck, roughness: .35, clearcoat: .5 }), edge, edge, edge]), 0, .07, 0));
    const sq = 3.4 / 8, cell = (i, j) => [(-3.5 + i) * sq, .14, (-3.5 + j) * sq];
    const king = group(lathe([[0, 0], [.4, 0], [.42, .07], [.34, .13], [.28, .2], [.18, .5], [.14, 1.08], [.23, 1.15], [.23, 1.22], [.14, 1.27], [.19, 1.5], [.11, 1.6], [0, 1.62]], M.navy), at(rbox(.07, .34, .07, .02, M.gold), 0, 1.78, 0), at(rbox(.24, .07, .07, .02, M.gold), 0, 1.8, 0));
    G.add(at(king, ...cell(4, 3), 0, .3, 0, .82));
    const pawn = (m) => group(lathe([[0, 0], [.27, 0], [.29, .06], [.2, .11], [.12, .42], [.19, .47], [.11, .52], [0, .52]], m), at(sph(.14, m), 0, .64, 0));
    G.add(at(pawn(M.ivory), ...cell(2, 4), 0, 0, 0, .9), at(pawn(M.ivory), ...cell(5, 5), 0, 0, 0, .9));
    const gp = at(pawn(M.gold), cell(6, 2)[0], .14 + .13, cell(6, 2)[2], 0, .6, Math.PI / 2 - .05, .9); G.add(gp);
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'every-learner-fits', family: 'night', arr: 'stack', h: ['Every', 'learner', 'fits.'], key: 2,
  sub: 'One-to-one and small-group support.',
  view: { az: -18, el: 34, fov: 24, fill: .9 },
  caption: ['🧩 Every learner fits.', '', 'Some learners race ahead. Some need another way in. One-to-one and small-group lessons, Form 1 to Upper 6, make sure nobody is left out of the picture.', '', 'Private lessons available at Royal Crest Academy.'],
  status: '🧩 Every learner fits. One-to-one and small-group support at Royal Crest.', tags: ['#Tutoring', '#Inclusion'],
  build(M) {
    const G = new THREE.Group();
    const P = [[0, 0, [1, 1, 0, 0]], [1, 0, [1, 0, 0, -1]], [0, 1, [0, 1, -1, 0]], [1, 1, [0, 0, -1, -1]]];
    P.forEach(([i, j, t], n) => {
      const gold = n === 3, p = extrude(puzzleShape(1.3, t), .24, gold ? M.gold : (n === 1 ? M.ivory : M.navy), .035);
      p.rotation.x = -Math.PI / 2; p.position.set((i - .5) * 1.3, .16, -(j - .5) * 1.3);
      if (gold) { p.position.y = 1.1; p.position.x += .25; p.position.z -= .15; p.rotation.z = .35; p.rotation.y = .12; }
      G.add(p);
    });
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'learn-local-think-global', family: 'editorial', eyebrow: 'Languages', h: ['Learn local.', 'Think global.'],
  sub: 'ChiShona and isiNdebele, with French and Mandarin clubs.',
  view: { az: -20, el: 10, fov: 24, fill: .86 },
  caption: ['🌍 Learn local. Think global.', '', 'ChiShona and isiNdebele keep our learners rooted. Le Club Français and Mandarin Connect open the door to the wider world.', '', 'Languages at Royal Crest Academy, Bikita.'],
  status: '🌍 Learn local, think global: ChiShona, isiNdebele, French and Mandarin at Royal Crest.', tags: ['#Languages', '#Mandarin'],
  build(M) {
    const G = new THREE.Group();
    const gt = canvasTex(2048, 1024, (x, w, h) => { x.fillStyle = '#13215a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(226,194,106,.85)'; x.lineWidth = 4; for (let i = 1; i < 12; i++) { x.beginPath(); x.moveTo(0, i * h / 12); x.lineTo(w, i * h / 12); x.stroke(); } for (let i = 0; i < 24; i++) { x.beginPath(); x.moveTo(i * w / 24, 0); x.lineTo(i * w / 24, h); x.stroke(); } x.fillStyle = '#f8c828'; [[1190, 610], [1150, 360], [1630, 420], [600, 380], [1810, 700]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 16, 0, 7); x.fill(); }); });
    const globe = mesh(new THREE.SphereGeometry(.95, 96, 64), new THREE.MeshPhysicalMaterial({ map: gt, roughness: .3, clearcoat: .8, clearcoatRoughness: .15 }));
    const tilt = group(globe, at(torus(1.06, .035, M.gold, Math.PI * 1.25), 0, 0, 0, 0, Math.PI / 2, -Math.PI * .125 - Math.PI / 2), at(cyl(.025, .025, 2.3, M.gold, 12), 0, 0, 0));
    tilt.rotation.z = .41; globe.rotation.y = -1.9;
    G.add(at(tilt, 0, 1.65, 0));
    G.add(lathe([[0, 0], [.6, 0], [.62, .07], [.4, .14], [.12, .3], [.09, .55], [0, .55]], M.navy));
    G.add(at(cyl(.05, .05, .25, M.gold), .1, .62, 0, 0, 0, .41));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'begin-with-the-end', family: 'studio', arr: 'stack', h: ['Begin with', 'the end', 'in mind.'], key: 2,
  sub: 'ZIMSEC, Cambridge and HEXCO under one roof.',
  view: { az: -24, el: 18, fov: 24, fill: .92 },
  caption: ['🎓 Begin with the end in mind.', '', 'O Level, A Level and a practical HEXCO qualification. At Royal Crest, ZIMSEC, Cambridge and HEXCO pathways sit under one roof, so the path to graduation is planned from Form 1.', '', 'Form 1 enrolment for January 2027 is open.'],
  status: '🎓 Begin with the end in mind: ZIMSEC, Cambridge and HEXCO under one roof.', tags: ['#ZIMSEC', '#Cambridge'],
  build(M) {
    const G = new THREE.Group();
    const scroll = group(at(cyl(.3, .3, 2.6, M.paper, 64), 0, 0, 0, 0, 0, Math.PI / 2), at(torus(.3, .03, M.ivory), 1.3, 0, 0, 0, Math.PI / 2), at(torus(.3, .03, M.ivory), -1.3, 0, 0, 0, Math.PI / 2), at(torus(.318, .045, M.gold), .1, 0, 0, 0, Math.PI / 2));
    scroll.add(at(cyl(.15, .15, .05, M.gold, 48), .1, 0, .34, Math.PI / 2), at(cyl(.1, .1, .055, M.navy, 32), .1, 0, .35, Math.PI / 2));
    G.add(at(scroll, .3, .3, .7, 0, -.2, 0));
    G.add(at(mortarboard(M, M.gold), -.6, 0, -.5, 0, .5, 0, 1.15));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'charged-for-form-1', family: 'night', arr: 'beside', mirror: true, h: ['Charged', 'for', 'Form 1.'], key: 2,
  sub: 'Grade 7 results are coming. Plan the next step now.',
  view: { az: -26, el: 10, fov: 24, fill: .88 },
  caption: ['🔋 Charged for Form 1.', '', 'Grade 7 results usually come out towards the end of the year: last year ZIMSEC released them on 28 November. Don’t wait for the rush.', '', 'Form 1 places for January 2027 are open now at Royal Crest Academy. Message us to start the application.'],
  status: '🔋 Grade 7 results are coming. Plan Form 1 2027 now at Royal Crest Academy.', tags: ['#Grade7', '#Form1'],
  build(M) {
    const G = new THREE.Group();
    G.add(at(rbox(1.5, 2.6, 1.1, .2, M.navy, 6), 0, 1.3, 0), at(rbox(.6, .24, .5, .07, M.gold), 0, 2.68, 0));
    for (let i = 0; i < 4; i++) G.add(at(rbox(1.12, .44, .1, .05, M.yellowGlow), 0, .5 + i * .54, .54));
    const bolt = new THREE.Shape(); bolt.moveTo(.1, .5); bolt.lineTo(-.22, -.02); bolt.lineTo(.0, -.02); bolt.lineTo(-.12, -.5); bolt.lineTo(.24, .06); bolt.lineTo(.02, .06); bolt.lineTo(.1, .5);
    G.add(at(extrude(bolt, .06, M.gold, .015), .78, 1.3, .1, 0, Math.PI / 2, 0, .9));
    const pl = new THREE.PointLight('#ffcf55', 4, 4, 1.6); pl.position.set(0, 1.3, 1.2); G.add(pl);
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'brick-by-brick', family: 'editorial', eyebrow: 'Building Technology', h: ['Brick by', 'brick.'],
  sub: 'Strong foundations, from Form 1.',
  view: { az: -22, el: 14, fov: 24, fill: .92 },
  caption: ['🧱 Brick by brick.', '', 'Every strong building starts with a good foundation, and so does every strong learner. Building Technology takes learners from foundation to roof, one course at a time.', '', 'Technical and vocational subjects at Royal Crest Academy.'],
  status: '🧱 Brick by brick: strong foundations from Form 1 at Royal Crest.', tags: ['#BuildingTechnology', '#Skills'],
  build(M) {
    const G = new THREE.Group(); const bw = .92, bh = .42, gap = .05;
    G.add(at(rbox(6 * (bw + gap) - .1, 5 * (bh + gap) - .1, .3, .02, new THREE.MeshPhysicalMaterial({ color: '#e7dfd0', roughness: .95 })), 0, 2.5 * (bh + gap) - .05, -.02));
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      const off = r % 2 ? (bw + gap) / 2 : 0, x = -2.5 * (bw + gap) + c * (bw + gap) + off; if (r % 2 && c === 5) continue;
      if (r === 4 && c === 3) continue;
      G.add(at(rbox(bw, bh, .46, .045, M.clay), x, r * (bh + gap) + bh / 2, 0, 0, (Math.sin(r * 7 + c) * .012)));
    }
    G.add(at(rbox(bw, bh, .46, .045, M.goldSatin), -2.5 * (bw + gap) + 3 * (bw + gap), 4 * (bh + gap) + bh / 2 + .55, .12, .05, .08, -.06));
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'one-good-habit', family: 'studio', arr: 'stack', h: ['One good habit', 'starts the', 'next.'], key: 2,
  sub: 'Devotion, study, sport and sleep, every day.',
  view: { az: -32, el: 20, fov: 24, fill: .94 },
  caption: ['🁢 One good habit starts the next.', '', 'Morning devotion, focused lessons, evening prep, sport and a proper night’s sleep. Small habits, repeated daily, add up to big results.', '', 'The Royal Crest routine, from Form 1.'],
  status: '🁢 One good habit starts the next. The Royal Crest routine.', tags: ['#Habits', '#Routine'],
  build(M) {
    const G = new THREE.Group(); const N = 7;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), x = -2.1 + t * 4.2, z = Math.sin(t * Math.PI) * -1.1, ang = Math.atan2(Math.cos(t * Math.PI) * -1.1 * Math.PI, 4.2);
      const gold = i === 0, d = new THREE.Group();
      d.add(rbox(.52, 1.04, .17, .05, gold ? M.gold : M.navy));
      const pipM = gold ? M.navy : M.ivory;
      d.add(at(rbox(.42, .02, .02, .008, pipM), 0, 0, .088));
      [[-.12, .3], [.12, .17], [0, -.24], [-.12, -.36], [.12, -.12]].slice(0, 2 + (i % 4)).forEach(([px, py]) => { const p = sph(.045, pipM, 16); p.scale.z = .35; d.add(at(p, px, py, .088)); });
      const lean = gold ? .75 : (i === 1 ? .32 : 0);
      d.position.set(x, .52, z); d.rotation.set(0, -ang + Math.PI / 2, 0); d.rotateX(lean);
      if (lean) d.position.y = .52 * Math.cos(lean) + .02;
      G.add(shadow(d));
    }
    return G;
  } },
/* ------------------------------------------------------------------ */
{ id: 'skills-that-work-together', family: 'night', arr: 'stack', h: ['Skills that', 'work', 'together.'], key: 2,
  sub: 'One practical trade every year: bakery, welding, solar and more.',
  view: { az: -14, el: 10, fov: 24, fill: .92 },
  caption: ['⚙️ Skills that work together.', '', 'Theory in the classroom, practice in the workshop. Every learner takes one practical trade every year: bakery, welding, solar PV, carpentry, cosmetology and more.', '', 'Science · Innovation · Skill at Royal Crest Academy.'],
  status: '⚙️ One practical trade every year at Royal Crest Academy.', tags: ['#Skills', '#TVET'],
  build(M) {
    const G = new THREE.Group();
    G.add(at(rbox(4.8, .26, 1.2, .08, M.navyDeep), 0, .13, 0));
    const gear = (R, n, m, x, y, rot) => { const g = extrude(gearShape(R, n, .17, R * .26), .3, m, .03); g.position.set(x, y, 0); g.rotation.z = rot; G.add(g); G.add(at(cyl(R * .3, R * .3, .4, M.gold, 32), x, y, -.02, Math.PI / 2)); G.add(at(rbox(.16, y - .2, .16, .04, M.navyDeep), x, (y + .2) / 2 + .02, -.35)); };
    gear(1.0, 14, M.navy, -1.3, 1.45, 0); gear(.7, 10, M.gold, .52, 1.86, .16); gear(.55, 8, M.ivory, 1.72, 1.02, .2);
    return G;
  } },
];
