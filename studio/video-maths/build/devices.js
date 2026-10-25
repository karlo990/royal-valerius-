/* Photoreal-ish 3D tablet + laptop for the Crest Slate scenes (Three.js r128).
 * DEV.render(state) draws one frame. state = { cam:[x,y,z], look:[x,y,z], fov, tablet:{pos,rot,scale,vis}, laptop:{pos,rot,lid,vis}, tabletScreen(g,w,h), laptopScreen(g,w,h) }
 * Screens are CanvasTextures redrawn each frame, so the real app screenshots can carry live overlays. */
(function () {
  const W = 1280, H = 720;
  const DEV = { ready: null };
  const canvas = document.createElement('canvas'); canvas.width = W * 1.5; canvas.height = H * 1.5;
  canvas.style.cssText = 'position:absolute;inset:0;width:1280px;height:720px';
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W * 1.5, H * 1.5, false);
  R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, W / H, .05, 60);

  // environment for reflections: a warm library with a bright window on the left
  const env = document.createElement('canvas'); env.width = 1024; env.height = 512; const eg = env.getContext('2d');
  let gr = eg.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2a1d12'); gr.addColorStop(.5, '#4a3320'); gr.addColorStop(1, '#120c07');
  eg.fillStyle = gr; eg.fillRect(0, 0, 1024, 512);
  eg.fillStyle = '#fff3d6'; eg.fillRect(120, 120, 150, 210); eg.fillStyle = '#ffd9a0'; eg.fillRect(620, 150, 90, 160);
  for (let i = 0; i < 40; i++) { eg.fillStyle = `rgba(${90 + (i * 37) % 60},${60 + (i * 23) % 40},30,.6)`; eg.fillRect(300 + (i % 20) * 16, 200 + Math.floor(i / 20) * 70, 12, 60); }
  const envTex = new THREE.CanvasTexture(env); envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.encoding = THREE.sRGBEncoding;
  const pmrem = new THREE.PMREMGenerator(R); scene.environment = pmrem.fromEquirectangular(envTex).texture;

  // lights: warm window key from the left, soft fill, a gold rim
  scene.add(new THREE.HemisphereLight(0xffe7c4, 0x1a120b, .55));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.6); key.position.set(-3.2, 4.2, 2.2); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 3; key.shadow.camera.bottom = -3; key.shadow.radius = 6; key.shadow.bias = -.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9a227, .8); rim.position.set(3, 2, -3); scene.add(rim);

  // the desk: old dark oak (procedural grain)
  const wood = document.createElement('canvas'); wood.width = 2048; wood.height = 1024; const wg = wood.getContext('2d');
  wg.fillStyle = '#3b2716'; wg.fillRect(0, 0, 2048, 1024);
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) { const y = rnd() * 1024, a = .05 + rnd() * .12; wg.strokeStyle = rnd() > .5 ? `rgba(20,12,6,${a})` : `rgba(120,80,45,${a})`; wg.lineWidth = 1 + rnd() * 3;
    wg.beginPath(); wg.moveTo(0, y); for (let x = 0; x <= 2048; x += 64) wg.lineTo(x, y + Math.sin(x / 210 + i) * 6 + (rnd() - .5) * 3); wg.stroke(); }
  for (let i = 0; i < 6; i++) { wg.fillStyle = 'rgba(0,0,0,.25)'; wg.fillRect(0, i * 170 + 160, 2048, 3); }   // plank joins
  const woodTex = new THREE.CanvasTexture(wood); woodTex.encoding = THREE.sRGBEncoding; woodTex.anisotropy = 8; woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(1.5, 1.5);
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshStandardMaterial({ map: woodTex, roughness: .62, metalness: .05 }));
  desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);

  // helpers
  function rounded(w, h, r) { const sh = new THREE.Shape(), x = -w / 2, y = -h / 2;
    sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y); return sh; }
  const slab = (w, h, r, d, bevel) => { const g = new THREE.ExtrudeGeometry(rounded(w, h, r), { depth: d, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 12 }); g.translate(0, 0, -d / 2); return g; };
  const metal = (c) => new THREE.MeshStandardMaterial({ color: c, metalness: .92, roughness: .32, envMapIntensity: 1.1 });
  function screenTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return { c, g: c.getContext('2d'), t }; }
  // glass sheen over a screen: a soft diagonal highlight
  function sheen(w, h) { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 512, 512); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.42, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,248,230,.10)'); gr.addColorStop(.6, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512); const t = new THREE.CanvasTexture(c);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); }

  // ---------- tablet (4:3 screen, 11-inch class)
  const TW = 1.0, TH = .74, tablet = new THREE.Group();
  const tBody = new THREE.Mesh(slab(TW, TH, .045, .012, .006), metal(0x5b5f66)); tBody.castShadow = true; tablet.add(tBody);
  const tGlass = new THREE.Mesh(new THREE.ShapeGeometry(rounded(TW - .004, TH - .004, .042), 12), new THREE.MeshStandardMaterial({ color: 0x050608, roughness: .08, metalness: .2, envMapIntensity: .8 }));
  tGlass.position.z = .0125; tablet.add(tGlass);
  const tScr = screenTex(2048, 1536);
  const tScreen = new THREE.Mesh(new THREE.PlaneGeometry(TW - .06, (TW - .06) * .75), new THREE.MeshBasicMaterial({ map: tScr.t, toneMapped: false }));
  tScreen.position.z = .0128; tablet.add(tScreen);
  const tSheen = sheen(TW - .06, (TW - .06) * .75); tSheen.position.z = .013; tablet.add(tSheen);
  const tCam = new THREE.Mesh(new THREE.CircleGeometry(.004, 16), new THREE.MeshBasicMaterial({ color: 0x15171c })); tCam.position.set(0, TH / 2 - .014, .0129); tablet.add(tCam);
  scene.add(tablet);

  // ---------- laptop (16:10 screen)
  const LW = 1.56, LD = 1.04, laptop = new THREE.Group();
  const base = new THREE.Mesh(slab(LW, LD, .05, .016, .006), metal(0x9aa0a8)); base.rotation.x = -Math.PI / 2; base.castShadow = true; base.receiveShadow = true; laptop.add(base);
  const kb = document.createElement('canvas'); kb.width = 1560; kb.height = 1040; const kg = kb.getContext('2d');
  kg.fillStyle = '#8e949c'; kg.fillRect(0, 0, 1560, 1040); kg.fillStyle = '#23262b'; kg.fillRect(130, 70, 1300, 560);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) { kg.fillStyle = '#111316'; const kw = r === 5 && c > 3 && c < 10 ? 0 : 84; if (kw) kg.fillRect(140 + c * 92, 80 + r * 92, kw, 80); }
  kg.fillStyle = '#111316'; kg.fillRect(140 + 4 * 92, 80 + 5 * 92, 92 * 6 - 8, 80);
  kg.fillStyle = '#868c94'; kg.strokeStyle = '#7a8088'; kg.lineWidth = 3; kg.beginPath(); kg.roundRect ? kg.roundRect(520, 680, 520, 300, 18) : kg.rect(520, 680, 520, 300); kg.fill(); kg.stroke();
  const kbTex = new THREE.CanvasTexture(kb); kbTex.encoding = THREE.sRGBEncoding;
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(LW - .02, LD - .02), new THREE.MeshStandardMaterial({ map: kbTex, metalness: .6, roughness: .45 }));
  deck.rotation.x = -Math.PI / 2; deck.position.y = .0141; laptop.add(deck);
  const hinge = new THREE.Group(); hinge.position.set(0, .014, -LD / 2 + .01); laptop.add(hinge);
  const lid = new THREE.Group(); hinge.add(lid);
  const lidBody = new THREE.Mesh(slab(LW, LD - .02, .05, .008, .004), metal(0x9aa0a8)); lidBody.position.y = (LD - .02) / 2; lidBody.castShadow = true; lid.add(lidBody);
  const lGlass = new THREE.Mesh(new THREE.ShapeGeometry(rounded(LW - .01, LD - .03, .045), 12), new THREE.MeshStandardMaterial({ color: 0x050608, roughness: .1, metalness: .2 }));
  lGlass.position.set(0, (LD - .02) / 2, .0085); lid.add(lGlass);
  const lScr = screenTex(2560, 1600), sw = LW - .08, sh = sw / 1.6;
  const lScreen = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: lScr.t, toneMapped: false }));
  lScreen.position.set(0, (LD - .02) / 2 + .02, .0088); lid.add(lScreen);
  const lSheen = sheen(sw, sh); lSheen.position.copy(lScreen.position); lSheen.position.z += .0003; lid.add(lSheen);
  scene.add(laptop);

  DEV.canvas = canvas;
  DEV.TW = TW; DEV.TH = TH;
  DEV.render = function (st) {
    cam.position.set(...st.cam); cam.fov = st.fov || 32; cam.updateProjectionMatrix(); cam.lookAt(new THREE.Vector3(...st.look));
    const T = st.tablet || {}, Lp = st.laptop || {};
    tablet.visible = T.vis !== false && !!st.tablet; laptop.visible = Lp.vis !== false && !!st.laptop;
    if (tablet.visible) { tablet.position.set(...T.pos); tablet.rotation.set(...T.rot); tablet.scale.setScalar(T.scale || 1);
      if (st.tabletScreen) { st.tabletScreen(tScr.g, 2048, 1536); tScr.t.needsUpdate = true; } }
    if (laptop.visible) { laptop.position.set(...Lp.pos); laptop.rotation.set(...(Lp.rot || [0, 0, 0])); hinge.rotation.x = -(Lp.lid ?? 1.85) + Math.PI / 2;
      if (st.laptopScreen) { st.laptopScreen(lScr.g, 2560, 1600); lScr.t.needsUpdate = true; } }
    R.render(scene, cam);
  };
  window.DEV = DEV;
})();
