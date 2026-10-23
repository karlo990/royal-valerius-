/* ---------- background: warm bakery paper, dark chocolate for the dark scenes ---------- */
const BW=PORTRAIT?720:1280, BH=PORTRAIT?1280:720, DS=PORTRAIT?.88:1;
$('#bg').width=BW*1.5; $('#bg').height=BH*1.5;
const bg=$('#bg').getContext('2d'); bg.scale(1.5,1.5);
const SPR=Array.from({length:46},(_,i)=>({x:(i*397)%BW,y:(i*233)%BH,a:i*1.7,c:['#E8A0B4','#F2C14E','#9AD0C2','#C9A227','#F3E1C7'][i%5],ph:i*1.3}));
function drawBg(t,nv){const W=BW,H=BH;
  let g=bg.createRadialGradient(W*.67,H*.42,60,W*.6,H*.5,Math.max(W,H)*.8);g.addColorStop(0,'#FFFCF7');g.addColorStop(1,'#F1E6D6');bg.fillStyle=g;bg.fillRect(0,0,W,H);
  bg.save();for(const s of SPR){const x=(s.x+t*5+Math.sin(t*.3+s.ph)*10)%(W+40)-20,y=(s.y+t*3)%(H+40)-20;
    bg.translate(x,y);bg.rotate(s.a+t*.2);bg.fillStyle=s.c;bg.globalAlpha=.32;bg.beginPath();bg.roundRect(-6,-2,12,4,2);bg.fill();bg.setTransform(1.5,0,0,1.5,0,0)}bg.restore();
  if(nv<=0)return;
  bg.save();bg.globalAlpha=nv;g=bg.createRadialGradient(W*.68,H*.44,40,W*.62,H*.5,Math.max(W,H)*.8);g.addColorStop(0,'#4A2A1C');g.addColorStop(.6,'#2C1810');g.addColorStop(1,'#170C07');bg.fillStyle=g;bg.fillRect(0,0,W,H);
  for(const s of SPR){const x=(s.x+t*5)%(W+40)-20,y=(s.y+t*3)%(H+40)-20;bg.translate(x,y);bg.rotate(s.a+t*.2);bg.fillStyle=s.c;bg.globalAlpha=nv*.22;bg.beginPath();bg.roundRect(-6,-2,12,4,2);bg.fill();bg.setTransform(1.5,0,0,1.5,0,0)}
  bg.restore()}
(()=>{let g='';for(let i=0;i<144;i++){const a=i*2.5*Math.PI/180,r1=243,r2=i%6?252:262;
  g+=`<line class="tick" x1="${300+r1*Math.sin(a)}" y1="${300-r1*Math.cos(a)}" x2="${300+r2*Math.sin(a)}" y2="${300-r2*Math.cos(a)}"/>`}$('#ticks').innerHTML=g})();

// studio backdrop for the 3D cake shots
function warmLens(ctx){const g=ctx.createRadialGradient(C,C*.8,30,C,C,C*1.05);g.addColorStop(0,'#5A3626');g.addColorStop(.7,'#2E1A11');g.addColorStop(1,'#1A0E08');ctx.fillStyle=g;ctx.fillRect(0,0,S,S)}
function creamLens(ctx){const g=ctx.createRadialGradient(C,C*.85,30,C,C,C*1.05);g.addColorStop(0,'#FFFDF8');g.addColorStop(1,'#F0E2CC');ctx.fillStyle=g;ctx.fillRect(0,0,S,S)}
// a pill label with a leader line to a point
function tagAt(ctx,txt,p,side,y,o={}){const x=side>0?S-150:150;ctx.save();ctx.globalAlpha*=o.a??1;ctx.strokeStyle=o.line||'rgba(255,255,255,.75)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(x-side*70,y);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=o.col||'#fff';ctx.beginPath();ctx.arc(p[0],p[1],5,0,7);ctx.fill();
  ctx.font='600 17px "Plex Mono"';const w=ctx.measureText(txt).width+26;ctx.fillStyle=o.bg||'rgba(26,14,8,.82)';ctx.beginPath();ctx.roundRect(side>0?x-8:x-w+8,y-17,w,34,17);ctx.fill();
  ctx.fillStyle=o.col||'#fff';ctx.textBaseline='middle';ctx.textAlign=side>0?'left':'right';ctx.fillText(txt,side>0?x+5:x-5,y+1);ctx.restore()}
// blend from a free-spinning yaw to a posed yaw, taking the short way round
const yawTo=(a,b,k)=>{const T=Math.PI*2;b+=T*Math.round((a-b)/T);return lerp(a,b,clamp(k))};
function rng(seed){let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647}

/* ---------- 3D cake and ingredients (Three.js r128) ---------- */
const CAKE=(()=>{ if(!window.THREE) return null;
  const cv=document.createElement('canvas');cv.width=cv.height=S;
  const R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});R.setPixelRatio(1);R.setSize(S,S,false);R.setClearColor(0x000000,0);
  R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.08;
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,200);
  sc.add(new THREE.HemisphereLight(0xFFF3E2,0x3A2418,.8));const k=new THREE.DirectionalLight(0xFFF0DC,1.45);k.position.set(5,9,8);sc.add(k);
  const rim=new THREE.DirectionalLight(0xF2C14E,.7);rim.position.set(-7,4,-6);sc.add(rim);sc.add(new THREE.AmbientLight(0xffffff,.12));
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:new THREE.Color(c),roughness:.6,metalness:0},o));
  function noiseTex(base,dots,seed,n=900){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,256);const r=rng(seed);
    for(let i=0;i<n;i++){g.fillStyle=dots[i%dots.length];g.globalAlpha=.35+r()*.5;g.beginPath();g.arc(r()*256,r()*256,.6+r()*2.2,0,7);g.fill()}const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
  const spSide=mat('#fff',{map:noiseTex('#C98B45',['#A86A2C','#E2B06C','#B87A38'],7),roughness:.85}),spTop=mat('#fff',{map:noiseTex('#E9C88C',['#D7AE6C','#F6DFAE','#CFA062'],11),roughness:.9});
  spSide.map.repeat.set(4,1);
  const jamM=mat('#A5122B',{roughness:.22,metalness:.05}),bcM=mat('#F7EEDB',{roughness:.5}),coatM=mat('#FBF5EC',{roughness:.48,side:THREE.DoubleSide});
  const crumbM=mat('#F2E2C4',{roughness:.7,transparent:true,opacity:.62,side:THREE.DoubleSide});
  const RAD=2,SH=.9,levels={};const root=new THREE.Group();sc.add(root);
  const board=new THREE.Mesh(new THREE.CylinderGeometry(2.8,2.8,.12,96),mat('#C9A227',{metalness:.65,roughness:.32}));board.position.y=-.06;root.add(board);
  const stand=new THREE.Group();const st1=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,.14,64),mat('#B9BEC6',{metalness:.7,roughness:.3}));st1.position.y=-.19;
  const st2=new THREE.Mesh(new THREE.CylinderGeometry(.35,.6,1.6,32),mat('#A9AEB6',{metalness:.7,roughness:.32}));st2.position.y=-1.06;const st3=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.6,.14,64),st1.material);st3.position.y=-1.9;
  stand.add(st1,st2,st3);root.add(stand);
  const layer=(geo,m)=>{const g=new THREE.Group();const me=new THREE.Mesh(geo,m);g.add(me);root.add(g);return g};
  // bottom → top: sponge, jam, buttercream, sponge, crumb coat, final coat
  const L=[layer(new THREE.CylinderGeometry(RAD,RAD,SH,96),[spSide,spTop,spTop]),layer(new THREE.CylinderGeometry(RAD*.95,RAD*.95,.12,96),jamM),
    layer(new THREE.CylinderGeometry(RAD*.97,RAD*.97,.18,96),bcM),layer(new THREE.CylinderGeometry(RAD,RAD,SH,96),[spSide,spTop,spTop])];
  const BASE=[0,SH,SH+.12,SH+.3];const HT=[SH,.12,.18,SH];
  const shell=(r,h,m)=>{const g=new THREE.Group();const s=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,96,1,true),m);s.position.y=h/2;const tp=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.05,96),m);tp.position.y=h;g.add(s,tp);root.add(g);return g};
  const crumb=shell(RAD+.05,SH*2+.35,crumbM),coat=shell(RAD+.13,SH*2+.43,coatM);
  const ribbon=new THREE.Mesh(new THREE.CylinderGeometry(RAD+.16,RAD+.16,.34,96,1,true),mat('#B83A5E',{roughness:.35,side:THREE.DoubleSide}));ribbon.position.y=.42;coat.add(ribbon);
  // piping: rosettes round the top edge, beads round the base, gold dragées
  const roseG=new THREE.Group();root.add(roseG);const roses=[];const roseM=mat('#FFF8EE',{roughness:.45}),goldM=mat('#E2B93B',{metalness:.85,roughness:.25});
  for(let i=0;i<18;i++){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.2,20,14),roseM);b.scale.set(1,.75,1);const c=new THREE.Mesh(new THREE.ConeGeometry(.15,.24,12),roseM);c.position.y=.18;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.055,8,20),roseM);ring.rotation.x=Math.PI/2;ring.position.y=.04;const d=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),goldM);d.position.y=.33;g.add(b,c,ring,d);
    const a=i/18*Math.PI*2;g.position.set(Math.cos(a)*1.86,SH*2+.43,Math.sin(a)*1.86);roseG.add(g);roses.push(g)}
  const beads=[];for(let i=0;i<46;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.1,12,10),i%2?roseM:goldM);const a=i/46*Math.PI*2;m.position.set(Math.cos(a)*(RAD+.2),.1,Math.sin(a)*(RAD+.2));root.add(m);beads.push(m)}
  let crestTex=null;const plaqueM=[mat('#FFFFFF',{roughness:.4}),mat('#FFFFFF',{roughness:.45}),mat('#FFFFFF')];
  const plaque=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.08,.05,64),plaqueM);plaque.position.y=SH*2+.47;root.add(plaque);
  function setCrest(im){if(crestTex||!im)return;crestTex=new THREE.Texture(im);crestTex.encoding=THREE.sRGBEncoding;crestTex.needsUpdate=true;plaqueM[1].map=crestTex;plaqueM[1].needsUpdate=true}

  /* ingredients for the opening */
  const ing=new THREE.Group();sc.add(ing);
  const wood=new THREE.Mesh(new THREE.BoxGeometry(9.6,.3,3.2),mat('#8A5A36',{map:noiseTex('#8A5A36',['#6E4426','#A06C44'],5,1400),roughness:.75}));wood.position.y=-.15;ing.add(wood);
  const butter=new THREE.Group();const bb=new THREE.Mesh(new THREE.BoxGeometry(1.7,.75,1),mat('#F3D46E',{roughness:.35}));bb.position.y=.375;
  const wrap=new THREE.Mesh(new THREE.BoxGeometry(1.0,.77,1.02),mat('#FFFFFF',{roughness:.5}));wrap.position.set(.38,.375,0);butter.add(bb,wrap);
  const sugar=new THREE.Group();const bowl=new THREE.Mesh(new THREE.SphereGeometry(.85,32,16,0,Math.PI*2,Math.PI/2,Math.PI/2),mat('#2A5BA8',{roughness:.3,side:THREE.DoubleSide}));bowl.position.y=.85;
  const heap=new THREE.Mesh(new THREE.SphereGeometry(.8,32,12,0,Math.PI*2,0,Math.PI/2.6),mat('#FFFFFF',{map:noiseTex('#F7F7F4',['#FFFFFF','#E4E4E0'],3,3000),roughness:.35}));heap.position.y=.62;heap.scale.y=.6;sugar.add(bowl,heap);
  const eggs=new THREE.Group();const prof=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;prof.push(new THREE.Vector2(Math.sin(a)*.36*(1-.18*Math.cos(a)),-Math.cos(a)*.5))}
  const eggG=new THREE.LatheGeometry(prof,32);const eggM=mat('#D9B08A',{roughness:.55});[[-.45,0],[.35,-.2],[.05,.45],[.6,.42]].forEach(([x,z],i)=>{const e=new THREE.Mesh(eggG,eggM);e.position.set(x,.36,z);e.rotation.z=i%2?1.35:-1.4;e.rotation.y=i*.7;eggs.add(e)});
  const flour=new THREE.Group();const bag=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.7,.8),mat('#EFE6D4',{roughness:.9}));bag.position.y=.85;const band=new THREE.Mesh(new THREE.BoxGeometry(1.22,.5,.82),mat('#C0396B',{roughness:.6}));band.position.y=.85;
  const fl=new THREE.Mesh(new THREE.SphereGeometry(.45,24,10,0,Math.PI*2,0,Math.PI/2),mat('#FAF6EE',{roughness:1}));fl.position.set(1.05,0,.4);fl.scale.y=.45;flour.add(bag,band,fl);
  const ITEMS=[butter,sugar,eggs,flour];ing.add(...ITEMS);[-3.4,-1.15,1.05,3.25].forEach((x,i)=>{ITEMS[i].position.x=x});

  // st: {mode:'cake'|'ing', yaw, tilt, zoom, drop[6] 0..1, explode 0..1, rose 0..1, crest 0..1, stand 0..1, items[4] 0..1}
  function render(st){const yaw=st.yaw||0;
    const ingOn=st.mode==='ing';ing.visible=ingOn;root.visible=!ingOn;
    if(ingOn){ITEMS.forEach((m,i)=>{const k=st.items?.[i]??1;m.visible=k>0;m.position.y=(1-eo(k))*3.5;m.scale.setScalar(Math.max(.001,lerp(.6,1,eo(k))))});
      ing.rotation.y=yaw;cam.position.set(0,4.8,14.5/(st.zoom||1));cam.lookAt(0,.7,0)}
    else{const ex=st.explode||0,drop=st.drop||[1,1,1,1,1,1];const out={};
      L.forEach((g,i)=>{const d=drop[i]??1;g.visible=d>0;g.position.y=BASE[i]+HT[i]/2+(1-eo(d))*4+ex*i*1.15;g.children[0].material.transparent=d<1;
        [].concat(g.children[0].material).forEach(m=>{m.transparent=d<1;m.opacity=clamp(d*2)})});
      const sh=[[crumb,drop[4]??1,5.0],[coat,drop[5]??1,6.6]];
      sh.forEach(([g,d,lift])=>{g.visible=d>0;g.position.y=(1-eo(d))*4+ex*lift;g.children.forEach(m=>{m.material.transparent=true;m.material.opacity=g===crumb?.62*clamp(d*2):clamp(d*2)})});
      // once the final coat is on and we are not exploded, the inner layers and crumb coat are hidden by it
      const covered=(drop[5]??1)>=1&&ex<.02;L.forEach(g=>{if(covered)g.visible=false});if(covered)crumb.visible=false;
      const rose=st.rose||0;roses.forEach((g,i)=>{const k=clamp(rose*18-i);g.visible=k>0;g.scale.setScalar(Math.max(.001,eo(k)));g.position.y=SH*2+.43+ex*6.6});
      beads.forEach((m,i)=>{const k=clamp((st.rose||0)*46*1.1-i);m.visible=k>0;m.scale.setScalar(Math.max(.001,eo(k)))});
      plaque.visible=(st.crest||0)>0;plaque.scale.setScalar(Math.max(.001,eo(st.crest||0)));plaque.position.y=SH*2+.47+ex*6.6;
      stand.visible=(st.stand||0)>0;stand.position.y=(1-(st.stand||0))*-3;
      root.rotation.y=yaw;const tilt=st.tilt??.32,dist=(11+ex*10)/(st.zoom||1),ly=1.1+ex*3.7;
      cam.position.set(0,ly+Math.sin(tilt)*dist,Math.cos(tilt)*dist);cam.lookAt(0,ly,0)}
    R.render(sc,cam);
    // screen anchors for labels (right edge of each layer)
    const P=(x,y,z)=>{const v=new THREE.Vector3(x,y,z).applyAxisAngle(new THREE.Vector3(0,1,0),root.rotation.y).project(cam);return[(v.x*.5+.5)*S,(-v.y*.5+.5)*S]};
    const anc=[];const ex=st.explode||0;[0,1,2,3].forEach(i=>anc.push(P(RAD*.9,BASE[i]+HT[i]/2+ex*i*1.15,0)));anc.push(P(RAD+.05,SH+ex*5,0));anc.push(P(RAD+.13,SH+.4+ex*6.6,0));
    return{cv,anc}}
  return{render,setCrest}})();
const cakeDraw=async(g,st,bgf=warmLens)=>{bgf(g);if(!CAKE)return null;const o=CAKE.render(st);g.drawImage(o.cv,0,0);return o};

/* ---------- 2D lessons ---------- */
// lesson 1: bowl on a digital scale
function scaleDraw(ctx,t,ev){creamLens(ctx);
  let grams=0,name='',lastAt=-1e9;for(const e of ev){const k=eio((t-e.at)/.9);grams+=e.g*k;if(t>=e.at){name=e.n;lastAt=e.at}}
  // scale
  ctx.save();ctx.fillStyle='#E9EDF2';ctx.strokeStyle='#B8C0CA';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(140,470,440,120,26);ctx.fill();ctx.stroke();
  ctx.fillStyle='#1B2A3A';ctx.beginPath();ctx.roundRect(230,500,260,64,10);ctx.fill();ctx.fillStyle='#8FF0B4';ctx.font='600 40px "Plex Mono"';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(Math.round(grams)+' g',470,534);
  ctx.textAlign='left';ctx.font='600 14px "Plex Mono"';ctx.fillStyle='rgba(143,240,180,.8)';ctx.fillText(name.toUpperCase(),244,512);
  ctx.fillStyle='#CBD2DB';ctx.beginPath();ctx.ellipse(C,470,190,20,0,0,7);ctx.fill();
  // bowl with contents
  const fill=clamp(grams/950);ctx.fillStyle='#F2ECE2';ctx.beginPath();ctx.ellipse(C,300,200,52,0,0,7);ctx.fill();
  ctx.save();ctx.beginPath();ctx.moveTo(160,300);ctx.bezierCurveTo(170,430,550,430,560,300);ctx.closePath();ctx.clip();
  const lvl=lerp(420,318,fill);const cg=ctx.createLinearGradient(0,lvl,0,430);cg.addColorStop(0,'#F7E2A6');cg.addColorStop(1,'#E9C47A');ctx.fillStyle=cg;ctx.fillRect(150,lvl,420,140);ctx.restore();
  ctx.lineWidth=5;ctx.strokeStyle='#C0396B';ctx.beginPath();ctx.moveTo(160,300);ctx.bezierCurveTo(170,430,550,430,560,300);ctx.stroke();ctx.beginPath();ctx.ellipse(C,300,200,52,0,Math.PI,0);ctx.stroke();
  ctx.fillStyle='#C0396B';ctx.beginPath();ctx.moveTo(250,418);ctx.lineTo(470,418);ctx.lineTo(450,470);ctx.lineTo(270,470);ctx.closePath();ctx.fill();
  // the ingredient dropping in
  for(const e of ev){const k=(t-e.at+.2)/.8;if(k<0||k>1)continue;const y=lerp(80,330,eio(k)),a=1-clamp((k-.75)/.25);ctx.globalAlpha=a;e.draw(ctx,C,y);ctx.globalAlpha=1}
  ctx.restore()}
const ICON={butter:(g,x,y)=>{g.fillStyle='#F3D46E';g.strokeStyle='#C9A227';g.lineWidth=3;g.beginPath();g.roundRect(x-60,y-26,120,52,8);g.fill();g.stroke();g.fillStyle='#fff';g.fillRect(x+6,y-26,54,52)},
  sugar:(g,x,y)=>{g.fillStyle='#fff';g.strokeStyle='#D9D3C6';g.lineWidth=2;for(let i=0;i<14;i++){const a=i*2.4,r=8+i*2.4;g.save();g.translate(x+Math.cos(a)*r,y+Math.sin(a)*r*.5);g.rotate(a);g.fillRect(-5,-5,10,10);g.strokeRect(-5,-5,10,10);g.restore()}},
  flour:(g,x,y)=>{g.fillStyle='#FBF7EF';g.beginPath();g.ellipse(x,y,64,30,0,0,7);g.fill();g.fillStyle='rgba(230,220,200,.7)';for(let i=0;i<20;i++){g.beginPath();g.arc(x+Math.cos(i*2.1)*50,y+Math.sin(i*1.7)*20,3,0,7);g.fill()}},
  eggs:(g,x,y)=>{for(let i=0;i<4;i++){g.fillStyle='#FFF6D8';g.beginPath();g.ellipse(x-60+i*40,y,20,14,0,0,7);g.fill();g.fillStyle='#F2B705';g.beginPath();g.arc(x-60+i*40,y,8,0,7);g.fill()}},
  milk:(g,x,y)=>{g.fillStyle='#FFFFFF';g.strokeStyle='#DDE3EA';for(let i=0;i<7;i++){g.beginPath();g.ellipse(x-30+i*10,y+Math.sin(i)*8,6,10,0,0,7);g.fill();g.stroke()}}};

// lesson 2: creaming under the microscope
const BUB=(()=>{const r=rng(31);return Array.from({length:150},(_,i)=>({x:60+r()*600,y:60+r()*600,r:5+r()*13,d:i*.035+r()*.3,ph:r()*6}))})();
const XTAL=(()=>{const r=rng(17);return Array.from({length:16},(_,i)=>({a:r()*6.28,rad:60+r()*240,s:14+r()*12,sp:.4+r()*.5,rot:r()*6}))})();
function creamDraw(ctx,t,cu){const pale=eio((t-cu.pale)/2.5);
  const g=ctx.createRadialGradient(C,C,40,C,C,C);g.addColorStop(0,`rgb(${lerp(244,250,pale)},${lerp(212,238,pale)},${lerp(118,198,pale)})`);g.addColorStop(1,`rgb(${lerp(228,240,pale)},${lerp(188,222,pale)},${lerp(92,170,pale)})`);ctx.fillStyle=g;ctx.fillRect(0,0,S,S);
  // butter fat globules
  ctx.save();ctx.globalAlpha=.25;ctx.strokeStyle='#C9A227';for(let i=0;i<40;i++){const x=(i*173)%S,y=(i*97)%S;ctx.beginPath();ctx.arc(x,y,18+(i%4)*6,0,7);ctx.stroke()}ctx.restore();
  // air bubbles trapped behind the crystals
  const nb=Math.floor(clamp((t-cu.bub)/4)*BUB.length);
  for(let i=0;i<nb;i++){const b=BUB[i],k=eo((t-cu.bub-b.d)/.5);if(k<=0)continue;const x=b.x+Math.sin(t*.8+b.ph)*3,y=b.y+Math.cos(t*.7+b.ph)*3,r=b.r*k;
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.strokeStyle='rgba(150,120,70,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.arc(x-r*.35,y-r*.35,r*.25,0,7);ctx.fill()}
  // sugar crystals sweeping round with the beater
  for(const x of XTAL){const a=x.a+t*x.sp,px=C+Math.cos(a)*x.rad,py=C+Math.sin(a)*x.rad*.8;ctx.save();ctx.translate(px,py);ctx.rotate(x.rot+t);ctx.fillStyle='rgba(255,255,255,.92)';ctx.strokeStyle='rgba(120,140,160,.7)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(-x.s,-x.s*.6);ctx.lineTo(x.s*.7,-x.s);ctx.lineTo(x.s,x.s*.5);ctx.lineTo(-x.s*.5,x.s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  if(t>cu.bub+.5)label(ctx,'AIR BUBBLES: '+Math.floor(clamp((t-cu.bub)/5)*2.4e6).toLocaleString('en-GB'),C,650,{col:'#5A3626',font:'600 20px "Plex Mono"',a:clamp((t-cu.bub-.5)/.5)});
  // folding the flour in
  const f=clamp((t-cu.fold)/1.4);if(f>0){ctx.save();ctx.globalAlpha=clamp(f*2)*clamp((cu.end-t)/.6+1);ctx.strokeStyle='#C0396B';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.arc(C,C+10,170,Math.PI*.15,Math.PI*.15+Math.PI*1.5*eio(f));ctx.stroke();
    const a=Math.PI*.15+Math.PI*1.5*eio(f);arrowHead(ctx,[C+170*Math.cos(a-.2),C+10+170*Math.sin(a-.2)],[C+170*Math.cos(a),C+10+170*Math.sin(a)],'#C0396B',26);
    label(ctx,'FOLD GENTLY',C,90,{col:'#C0396B',font:'700 24px "Plex Mono"'});ctx.restore()}}

// lesson 3: baking powder → carbon dioxide
const PAIRS=(()=>{const r=rng(53);return Array.from({length:22},(_,i)=>({a:[80+r()*560,80+r()*560],b:[0,0],j:i,tgt:i%5}))})();PAIRS.forEach((p,i)=>{p.b=[p.a[0]+30*Math.cos(i),p.a[1]+30*Math.sin(i)]});
const BIG=[[170,220],[520,200],[360,380],[200,520],[540,520]];
function riseDraw(ctx,t,cu){const wet=eio((t-cu.liquid)/1),hot=clamp((t-cu.heat)/1);
  const g=ctx.createRadialGradient(C,C,40,C,C,C);g.addColorStop(0,lerp(0,1,wet)>.5?'#FFF4DD':'#FBF3E6');g.addColorStop(1,'#EBD7B5');ctx.fillStyle=g;ctx.fillRect(0,0,S,S);
  if(wet>0){ctx.save();ctx.globalAlpha=wet*.25;ctx.strokeStyle='#4A90C2';ctx.lineWidth=2;for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(C,C,40+i*60+((t*30)%60),0,7);ctx.stroke()}ctx.restore()}
  // the five big bubbles from creaming, inflating as gas arrives
  let absorbed=[0,0,0,0,0];const co2=[];
  for(const p of PAIRS){const tr=cu.react+p.j*.07,amp=lerp(1,6,wet)*lerp(1,2.4,hot);
    if(t<tr){for(const [q,col,l] of [[p.a,'#3A7BD5','B'],[p.b,'#E04848','A']]){const x=q[0]+Math.sin(t*5+p.j+q[1])*amp,y=q[1]+Math.cos(t*4.3+p.j)*amp;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,11,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 11px "Plex Mono"';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(l,x,y+1)}}
    else{const k=clamp((t-tr)/1.6),m=[(p.a[0]+p.b[0])/2,(p.a[1]+p.b[1])/2],T=BIG[p.tgt];if(k>=1){absorbed[p.tgt]++;continue}co2.push([lerp(m[0],T[0],eio(k)),lerp(m[1],T[1],eio(k)),1-clamp((k-.85)/.15)])}}
  const grow=eio((t-cu.balloon)/1.5);
  BIG.forEach((b,i)=>{const r=26+7*Math.sqrt(absorbed[i])*3+grow*24;ctx.fillStyle='rgba(255,255,255,.6)';ctx.strokeStyle='rgba(150,110,60,.7)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(b[0],b[1],r,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.arc(b[0]-r*.35,b[1]-r*.35,r*.22,0,7);ctx.fill()});
  for(const [x,y,a] of co2){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#E04848';ctx.beginPath();ctx.arc(x-13,y,8,0,7);ctx.arc(x+13,y,8,0,7);ctx.fill();ctx.fillStyle='#2B2B2B';ctx.beginPath();ctx.arc(x,y,10,0,7);ctx.fill();ctx.restore()}
  // the equation
  const eq=clamp((t-cu.co2)/.6);if(eq>0){ctx.save();ctx.globalAlpha=eq;ctx.fillStyle='rgba(26,14,8,.82)';ctx.beginPath();ctx.roundRect(110,606,500,50,25);ctx.fill();label(ctx,'NaHCO₃ + acid → CO₂ ↑ + water',C,632,{col:'#fff',font:'600 21px "Plex Mono"'});ctx.restore()}
  if(t<cu.react){label(ctx,'B = bicarbonate    A = acid',C,640,{col:'#5A3626',font:'600 18px "Plex Mono"',a:clamp((t-cu.bicarb)/.5)});label(ctx,wet>0?'+ LIQUID':'DRY',C,90,{col:wet>0?'#2E6FA8':'#8A6A44',font:'700 22px "Plex Mono"',a:clamp((t-cu.bicarb)/.5)})}}

// lesson 4: the tin in the oven, cut in half
function ovenDraw(ctx,t,cu,opts={}){ctx.fillStyle='#231511';ctx.fillRect(0,0,S,S);
  const glow=.6+.4*Math.sin(t*3);for(const y of [130,600]){ctx.strokeStyle=`rgba(255,${120+60*glow},40,${.85})`;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();for(let x=110;x<=610;x+=20)ctx.lineTo(x,y+Math.sin(x*.12)*8);ctx.stroke();
    const hg=ctx.createLinearGradient(0,y-60,0,y+60);hg.addColorStop(0,'rgba(255,140,40,0)');hg.addColorStop(.5,`rgba(255,140,40,${.15*glow})`);hg.addColorStop(1,'rgba(255,140,40,0)');ctx.fillStyle=hg;ctx.fillRect(80,y-60,560,120)}
  label(ctx,'180 °C',C,80,{col:'#FFB46A',font:'700 26px "Plex Mono"'});
  // tin
  const x0=170,x1=550,yb=520,rise=opts.rise??eio((t-cu.expand)/3),h=lerp(70,190,rise);
  ctx.fillStyle='#8E99A6';ctx.beginPath();ctx.moveTo(x0-14,300);ctx.lineTo(x0,yb+14);ctx.lineTo(x1,yb+14);ctx.lineTo(x1+14,300);ctx.lineTo(x1+4,300);ctx.lineTo(x1-8,yb);ctx.lineTo(x0+8,yb);ctx.lineTo(x0-4,300);ctx.closePath();ctx.fill();
  const top=yb-h;const brown=opts.brown??eio((t-cu.browns)/2.2);
  ctx.save();ctx.beginPath();ctx.moveTo(x0+8,yb);ctx.lineTo(x0+2,top+20);ctx.quadraticCurveTo(C,top-30*rise,x1-2,top+20);ctx.lineTo(x1-8,yb);ctx.closePath();ctx.clip();
  const bg2=ctx.createLinearGradient(0,top,0,yb);bg2.addColorStop(0,'#F4D99B');bg2.addColorStop(1,'#EAC27A');ctx.fillStyle=bg2;ctx.fillRect(x0,top-40,x1-x0,h+60);
  // crumb: bubbles that grow with the rise, then set
  const set=clamp((t-cu.set)/1);const r=rng(9);for(let i=0;i<120;i++){const bx=x0+12+r()*(x1-x0-24),by=yb-8-r()*h*1.05,br=(2+r()*5)*lerp(.6,1.4,rise);ctx.strokeStyle=set>.5?'rgba(160,110,50,.75)':'rgba(190,150,90,.5)';ctx.lineWidth=set>.5?2:1.2;ctx.beginPath();ctx.arc(bx,by,br,0,7);ctx.stroke()}
  // crust browning from the outside in
  if(brown>0){ctx.lineWidth=26*brown;ctx.strokeStyle=`rgba(${lerp(230,166,brown)},${lerp(180,98,brown)},${lerp(110,40,brown)},.95)`;ctx.beginPath();ctx.moveTo(x0+8,yb);ctx.lineTo(x0+2,top+20);ctx.quadraticCurveTo(C,top-30*rise,x1-2,top+20);ctx.lineTo(x1-8,yb);ctx.closePath();ctx.stroke()}
  ctx.restore();
  // thermometer probe
  const temp=Math.round(lerp(20,98,clamp((t-cu.expand+.5)/7)));const tx=x1-70;ctx.strokeStyle='#D7DDE3';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(tx,yb-40);ctx.lineTo(tx+60,170);ctx.stroke();
  ctx.fillStyle='rgba(26,14,8,.85)';ctx.beginPath();ctx.roundRect(tx+20,140,120,46,10);ctx.fill();label(ctx,temp+' °C',tx+80,163,{col:temp>=70?'#8FF0B4':'#FFFFFF',font:'600 24px "Plex Mono"'});
  if(set>0)tagAt(ctx,'EGG PROTEINS SET',[C-60,yb-h*.5],-1,250,{a:set*clamp((cu.browns-t)/.5+1)});
  if(brown>.3)tagAt(ctx,'GOLDEN CRUST',[x0+14,yb-h*.6],-1,330,{a:clamp((brown-.3)*3),col:'#F5D57A'});
  // aroma
  const sm=clamp((t-cu.smell)/.8)*clamp((cu.skewer-t)/.6+1);if(sm>0){ctx.save();ctx.globalAlpha=sm*.7;ctx.strokeStyle='#F5D57A';ctx.lineWidth=4;for(let i=0;i<3;i++){const bx=260+i*100;ctx.beginPath();for(let y=0;y<120;y+=6)ctx.lineTo(bx+Math.sin(y*.08+t*3+i)*14,top-20-y);ctx.stroke()}ctx.restore()}
  // skewer test
  const sk=clamp((t-cu.skewer)/2.4);if(sk>0){const d=sk<.5?eio(sk*2):1-eio((sk-.5)*2),y0=top-160;ctx.strokeStyle='#D9B36A';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(C,y0+d*230);ctx.lineTo(C,y0+d*230-200);ctx.stroke();
    if(sk>.95)tagAt(ctx,'CLEAN = DONE ✓',[C,y0],1,y0+10,{col:'#8FF0B4',a:clamp((sk-.95)*20)})}
  const tm=clamp((t-cu.mins)/.5);if(tm>0){ctx.fillStyle='rgba(26,14,8,.85)';ctx.beginPath();ctx.roundRect(52,140,130,46,10);ctx.fill();label(ctx,'25:00',117,163,{col:'#FFB46A',font:'600 24px "Plex Mono"',a:tm})}}

// lesson 7: cost vs price
function costDraw(ctx,t,cu){creamLens(ctx);const q=1-clamp((t-cu.cost)/.5);if(q>0)label(ctx,'$ ?',C,C-20,{col:'#0a1f5c',font:'600 120px "Plex Mono"',a:q});
  const items=[['Butter',2.0,'#F3D46E'],['Sugar',.8,'#E9E4DA'],['Eggs',1.2,'#D9B08A'],['Flour',.9,'#EFE6D4'],['Icing',2.3,'#E8A0B4'],['Power',.8,'#9AD0C2'],['Box',1.0,'#B9BEC6']];
  const base=600,sc=17,x1=200,x2=440,w=150;
  // cost bar builds item by item
  let y=base;items.forEach(([n,v,col],i)=>{const k=eio((t-cu.cost-i*.25)/.5);if(k<=0)return;const h=v*sc*k;ctx.fillStyle=col;ctx.strokeStyle='rgba(60,40,20,.25)';ctx.lineWidth=1.5;ctx.fillRect(x1,y-h,w,h);ctx.strokeRect(x1,y-h,w,h);
    if(k>.9&&v>=.8){ctx.font='600 13px "Plex Mono"';ctx.fillStyle='#3A2418';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n,x1+w/2,y-h/2)}y-=h});
  label(ctx,'COST',x1+w/2,base+28,{col:'#5A3626',font:'700 18px "Plex Mono"'});label(ctx,'$9',x1+w/2,y-26,{col:'#0a1f5c',font:'700 30px "Plex Mono"',a:clamp((t-cu.nine)/.4)});
  // price bar
  const pk=eio((t-cu.price)/.9);if(pk>0){const h=25*sc*pk;ctx.fillStyle='#0a1f5c';ctx.fillRect(x2,base-h,w,h);label(ctx,'PRICE',x2+w/2,base+28,{col:'#5A3626',font:'700 18px "Plex Mono"'});label(ctx,'$25',x2+w/2,base-h-26,{col:'#0a1f5c',font:'700 30px "Plex Mono"'});
    // profit bracket
    const pf=eio((t-cu.profit)/.6);if(pf>0){const yt=base-25*sc,yc=base-9*sc;ctx.fillStyle=`rgba(46,173,107,${.85*pf})`;ctx.fillRect(x2,yt,w,yc-yt);label(ctx,'$16',x2+w/2,(yt+yc)/2-10,{col:'#fff',font:'700 34px "Plex Mono"',a:pf});label(ctx,'PROFIT',x2+w/2,(yt+yc)/2+22,{col:'#fff',font:'700 16px "Plex Mono"',a:pf});
      ctx.save();ctx.globalAlpha=pf;ctx.setLineDash([8,6]);ctx.strokeStyle='#2EAD6B';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,yc);ctx.lineTo(x2+w,yc);ctx.stroke();ctx.restore()}}
  // five cakes a week
  const wk=eio((t-cu.week)/.8);if(wk>0){ctx.save();ctx.globalAlpha=wk;ctx.fillStyle='rgba(26,14,8,.9)';ctx.beginPath();ctx.roundRect(150,60,420,66,33);ctx.fill();
    for(let i=0;i<5;i++){const cx=190+i*31,cy=90;ctx.fillStyle='#FBF5EC';ctx.fillRect(cx-11,cy-6,22,16);ctx.fillStyle='#E8A0B4';ctx.fillRect(cx-11,cy-9,22,5);ctx.fillStyle='#C9A227';ctx.fillRect(cx-14,cy+10,28,3)}
    label(ctx,'× $16 = $80 a week',448,94,{col:'#8FF0B4',font:'700 19px "Plex Mono"'});ctx.restore()}}

/* ---------- scenes ---------- */
const WA='<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3z"/></svg>';
const FULL={drop:[1,1,1,1,1,1],explode:0,rose:1,crest:0,stand:0};
const SC={
 open:{nv:1,cta:0,tag:t=>t<cue('k03','science')?'4 INGREDIENTS':'SCIENCE + SKILL',
   copy:()=>[[`<div class="eb"><span class="n">★</span>BAKERY · FOOD PRODUCTION</div>`,cue('k01')-.4],[`<h1 class="hl">Four plain ingredients. <em>One cake.</em></h1>`,cue('k01','Four plain')],
     [`<div class="bd">A film for Grade 7 parents, from the bakery at Royal Crest Academy, Bikita.</div>`,cue('k03')]],
   async lens(ctx,t,s){const at=['Butter','Sugar','Eggs','Flour'].map(w=>cue('k01',w)-.15),mg=cue('k03','science');
     const ingr=async g=>{await cakeDraw(g,{mode:'ing',yaw:Math.sin(t*.25)*.35,items:at.map(a=>clamp((t-a)/.7)),zoom:1})};
     const cake=async g=>{await cakeDraw(g,{...FULL,yaw:t*.4,tilt:.3,zoom:1.05})};
     if(t<mg)await ingr(ctx);else await xfade(ctx,t,mg,1,ingr,cake)}},
 title:{nv:0,cta:1,tag:()=>'BIKITA',
   copy:()=>[[`<div class="eb"><span class="n">★</span>ROYAL CREST ACADEMY</div>`],[`<h1 class="hl">The science of <em>a perfect cake.</em></h1>`],
     [`<div class="bd">From the mixing bowl to the business: seven lessons from our bakery.</div>`],
     [`<div class="chips"><span class="chip">Recipe</span><span class="chip">Creaming</span><span class="chip">Rising</span><span class="chip">Oven</span><span class="chip">Layers</span><span class="chip">Decorating</span><span class="chip gold">Profit</span></div>`]],
   async lens(ctx,t,s){await photo(ctx,'../assets/cake-making.jpg',(t-s.start)/(s.end-s.start),1.04,1.14)}},
 recipe:{nv:0,cta:1,tag:t=>t<cue('k08','chemistry')?'WEIGH IT':'EXACT',
   copy:()=>[[`<div class="eb"><span class="n">01</span>LESSON ONE · THE RECIPE</div>`],[`<h1 class="hl">Weigh <em>everything.</em></h1>`],
     [`<div class="card rows">${[['Butter','225 g','butter'],['Sugar','225 g','sugar'],['Self-raising flour','225 g','self-raising'],['Eggs','4 large','Four eggs'],['Milk','a splash','milk']].map(([n,d,w])=>`<div class="row r1" data-at="${cue('k06',w)}"><i class="cy"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('k06','butter')-.4],
     [`<div class="chips"><span class="chip cy">Baking is chemistry</span></div>`,cue('k08','chemistry')]],
   async lens(ctx,t,s){const ev=[['butter',225,'butter'],['sugar',225,'sugar'],['self-raising',225,'flour'],['Four eggs',200,'eggs'],['milk',30,'milk']].map(([w,gr,ic])=>({at:cue('k06',w),g:gr,n:ic,draw:ICON[ic]}));
     scaleDraw(ctx,t,ev);const ch=clamp((t-cue('k08','chemistry'))/.5);if(ch>0)label(ctx,'EXACT AMOUNTS = SAME CAKE EVERY TIME',C,650,{col:'#C0396B',font:'700 18px "Plex Mono"',a:ch})},
   update(t){document.querySelectorAll('.row.r1').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 cream:{nv:0,cta:1,tag:t=>t<cue('k10','air bubbles')?'CREAMING':t<cue('k12','fold')?'AIR':'FOLD',
   copy:()=>[[`<div class="eb"><span class="n">02</span>LESSON TWO · CREAMING</div>`],[`<h1 class="hl">The fluffy part <em>is air.</em></h1>`],
     [`<div class="card rows">${[['Beat','Butter and sugar until pale and fluffy','k09','pale'],['Trap','Sugar crystals cut pockets of air','k10','air bubbles'],['Add','Eggs one at a time','k12','eggs'],['Fold','Flour in gently, keep the air','k12','fold']].map(([n,d,l,w])=>`<div class="row r2" data-at="${cue(l,w)}"><i class="cy"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('k09','butter and sugar')-.3]],
   async lens(ctx,t,s){creamDraw(ctx,t,{pale:cue('k09','pale'),bub:cue('k10','sugar crystal'),fold:cue('k12','fold'),end:s.end})},
   update(t){document.querySelectorAll('.row.r2').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 rise:{nv:0,cta:1,tag:t=>t<cue('k14','react')?'BAKING POWDER':t<cue('k16','rises')?'CO₂':'IT RISES',
   copy:()=>[[`<div class="eb"><span class="n">03</span>LESSON THREE · WHY IT RISES</div>`],[`<h1 class="hl">A cake full of <em>tiny balloons.</em></h1>`],
     [`<div class="card rows">${[['Bicarbonate of soda','A base, in the flour','k13','bicarbonate'],['A dry acid','Waits for water','k13','dry acid'],['Liquid + heat','They react','k14','react'],['Carbon dioxide','Inflates the air bubbles','k16','balloons']].map(([n,d,l,w],i)=>`<div class="row r3" data-at="${cue(l,w)}"><i class="${i===3?'up':'cy'}"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('k13','baking powder')-.3]],
   async lens(ctx,t,s){const cu={bicarb:cue('k13','bicarbonate'),liquid:cue('k14','liquid'),heat:cue('k14','heat'),react:cue('k14','react'),co2:cue('k14','carbon dioxide'),balloon:cue('k16','balloons')};
     const mol=async g=>riseDraw(g,t,cu),tin=async g=>ovenDraw(g,t,{expand:cue('k16','rises')-.4,set:1e9,browns:1e9,smell:1e9,skewer:1e9,mins:1e9},{rise:eio((t-cue('k16','rises')+.2)/2),brown:0});
     const r=cue('k16','rises')-.5;if(t<r)await mol(ctx);else await xfade(ctx,t,r,.8,mol,tin)},
   update(t){document.querySelectorAll('.row.r3').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 oven:{nv:1,cta:1,tag:t=>t<cue('k18','seventy')?'180 °C':t<cue('k19','browns')?'70 °C · SET':t<cue('k21','skewer')?'GOLDEN':'25 MIN',
   copy:()=>[[`<div class="eb"><span class="n">04</span>LESSON FOUR · THE OVEN</div>`],[`<h1 class="hl">Three changes, <em>one tin.</em></h1>`],
     [`<div class="card rows">${[['Rise','Gas expands, the batter climbs','k18','gas expands'],['Set','At about 70 °C, egg proteins set','k18','set'],['Brown','Sugars and proteins make the crust','k19','browns'],['Test','Skewer comes out clean: done','k21','clean']].map(([n,d,l,w])=>`<div class="row r4" data-at="${cue(l,w)}"><i class="cy"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('k17','stages')-.2]],
   async lens(ctx,t,s){ovenDraw(ctx,t,{expand:cue('k18','gas expands'),set:cue('k18','set'),browns:cue('k19','browns'),smell:cue('k19','smell'),skewer:cue('k21','skewer'),mins:cue('k21')})},
   update(t){document.querySelectorAll('.row.r4').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 build:{nv:0,cta:1,tag:t=>t<cue('k24','layers')?'LAYER BY LAYER':t<cue('k25','every layer')?'EXPLODED':'ASSEMBLED',
   copy:()=>[[`<div class="eb"><span class="n">05</span>LESSON FIVE · BUILDING</div>`],[`<h1 class="hl">Every layer <em>has a job.</em></h1>`],
     [`<div class="card rows">${[['Sponge','The structure','k22','Two sponges'],['Jam','Flavour and moisture','k23','jam'],['Buttercream','Glues the layers','k23','buttercream'],['Crumb coat','Locks in the crumbs','k23','crumb coat'],['Final coat','The smooth finish','k23','final coat']].map(([n,d,l,w])=>`<div class="row r5" data-at="${cue(l,w)}"><i class="cy"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('k22','Two sponges')-.3]],
   async lens(ctx,t,s){const d=[cue('k22','Two sponges'),cue('k23','jam'),cue('k23','buttercream'),cue('k23','second sponge'),cue('k23','crumb coat'),cue('k23','final coat')].map(a=>clamp((t-a+.1)/.8));
     const ex=eio((t-cue('k24','layers')+.3)/1.4)*(1-eio((t-cue('k25','every layer'))/1.4));
     const o=await cakeDraw(ctx,{drop:d,explode:ex,rose:0,crest:0,yaw:yawTo(t*.35,.55,clamp(ex*3)),tilt:lerp(.36,.22,ex),zoom:1});
     if(o&&ex>.6){const names=['SPONGE','JAM','BUTTERCREAM','SPONGE','CRUMB COAT','FINAL COAT'];const a=clamp((ex-.6)*4);o.anc.forEach((p,i)=>tagAt(ctx,names[i],p,1,p[1],{a}))}},
   update(t){document.querySelectorAll('.row.r5').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 decorate:{nv:0,cta:1,tag:t=>t<cue('k27','crest')-.3?'PIPING':t<cue('k28','Birthdays')?'OUR CREST':'CELEBRATE',
   copy:()=>[[`<div class="eb"><span class="n">06</span>LESSON SIX · DECORATING</div>`],[`<h1 class="hl">A steady hand, <em>a beautiful cake.</em></h1>`],
     [`<div class="chips">${[['Piping bags','Piping'],['Nozzles','nozzles'],['Turntable','turntable'],['A steady hand','steady']].map(([n,w])=>`<span class="chip bz" data-at="${cue('k26',w)}">${n}</span>`).join('')}</div>`,cue('k26','Piping')-.2],
     [`<div class="chips">${['Birthdays','weddings','graduations'].map(w=>`<span class="chip gz" data-at="${cue('k28',w)}">${w[0].toUpperCase()+w.slice(1)}</span>`).join('')}</div>`,cue('k28','Birthdays')-.2]],
   async lens(ctx,t,s){const im=await img('../assets/crest.jpg');CAKE&&CAKE.setCrest(im);const cr=cue('k27','crest')-.4;
     await cakeDraw(ctx,{...FULL,rose:clamp((t-cue('k26','Piping'))/3.2),crest:eio((t-cr)/.8),stand:eio((t-s.start)/1),yaw:t*.45,tilt:lerp(.3,.78,eio((t-cr)/1.2)),zoom:lerp(1,1.2,eio((t-cr)/1.2))})},
   update(t){document.querySelectorAll('.chip.bz').forEach(e=>e.classList.toggle('cy',t>=+e.dataset.at));document.querySelectorAll('.chip.gz').forEach(e=>e.classList.toggle('gold',t>=+e.dataset.at))}},
 business:{nv:0,cta:1,tag:t=>t<cue('k31','twenty-five dollars')?'COSTING':t<cue('k31','five cakes')?'$16 PROFIT':'A BUSINESS',
   copy:()=>[[`<div class="eb"><span class="n">07</span>LESSON SEVEN · COSTING</div>`],[`<h1 class="hl">Science, maths <em>and money.</em></h1>`],
     [`<div class="card rows">${[['Cost','Ingredients, power and the box: $9','k30','nine dollars'],['Price','The decorated cake: $25','k31','twenty-five dollars'],['Profit','$16 a cake','k31','sixteen dollars'],['Five a week','$80 profit a week','k31','five cakes']].map(([n,d,l,w],i)=>`<div class="row r7" data-at="${cue(l,w)}"><i class="${i===2?'up':'cy'}"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('k30','Costing')-.3],
     [`<div class="note">Example figures. Prices vary.</div>`,cue('k30','Costing')]],
   async lens(ctx,t,s){costDraw(ctx,t,{cost:cue('k30','Add up'),nine:cue('k30','nine dollars'),price:cue('k31','twenty-five dollars'),profit:cue('k31','sixteen dollars'),week:cue('k31','five cakes')})},
   update(t){document.querySelectorAll('.row.r7').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 careers:{nv:0,cta:1,tag:()=>'CAREERS',
   copy:()=>[[`<div class="eb"><span class="n">→</span>WHERE IT LEADS</div>`],[`<h1 class="hl">A skill <em>for life.</em></h1>`],
     [`<div class="jobs">${[['Baker','Baker'],['Pastry chef','Pastry'],['Cake designer','Cake designer'],['Hotel & catering chef','Hotel'],['Food technologist','Food technologist'],['Bakery owner','own bakery']].map(([n,w])=>`<span class="job" data-at="${cue('k34',w)}">${n}</span>`).join('')}</div>`,cue('k34','Baker')-.4],
     [`<div class="chips">${[['Weddings','wedding'],['Hotels','hotel'],['Supermarkets','supermarket']].map(([n,w])=>`<span class="chip bz" data-at="${cue('k35',w)}">${n}</span>`).join('')}</div>`,cue('k35','wedding')-.3]],
   async lens(ctx,t,s){await photo(ctx,'../assets/cake-making.jpg',(t-s.start)/(s.end-s.start),1.1,1.22)},
   update(t){document.querySelectorAll('.job').forEach(e=>{const a=+e.dataset.at,k=eo((t-a)/.5);e.style.opacity=lerp(.25,1,k);e.style.transform=`scale(${1+.06*Math.max(0,1-Math.abs(t-a-.3)/.6)})`});
     document.querySelectorAll('.chip.bz').forEach(e=>e.classList.toggle('gold',t>=+e.dataset.at))}},
 school:{nv:0,cta:1,tag:()=>'FORM 1',
   copy:()=>[[`<div class="eb"><span class="n">★</span>AT ROYAL CREST</div>`],[`<h1 class="hl">It starts <em>in Form 1.</em></h1>`],
     [`<div class="chips"><span class="chip gold">Bakery &amp; Food Production</span><span class="chip">ZIMSEC</span><span class="chip">Cambridge</span><span class="chip">HEXCO</span></div>`,cue('k36','Bakery')],
     [`<div class="bd">A certificate, and a skill your child can earn from.</div>`,cue('k37','certificate')]],
   async lens(ctx,t,s){const im=await img('../assets/crest.jpg');CAKE&&CAKE.setCrest(im);await cakeDraw(ctx,{...FULL,crest:1,stand:1,yaw:t*.35,tilt:.5,zoom:1.08})}},
 parents:{nv:1,cta:1,tag:()=>'2027',
   copy:()=>[[`<div class="eb"><span class="n">★</span>GRADE 7 PARENTS</div>`],[`<h1 class="hl">Grade 7 <span class="arr">⟶</span> <em>Form 1, 2027.</em></h1>`],
     [`<div class="bd">Come and taste it for yourself.</div>`,cue('k39')],[`<div class="flag">2027 INTAKE · LIMITED PLACES</div>`,cue('k38','limited')]],
   async lens(ctx,t,s){await photo(ctx,'../assets/cake-making.jpg',(t-s.start)/(s.end-s.start),1.0,1.1)}},
 outro:{nv:0,cta:0,tag:()=>'ENROL',top:120,
   copy:()=>[[`<h1 class="hl">Royal Crest Academy</h1>`],[`<div class="tagline">SCIENCE · INNOVATION · SKILL</div>`],
     [`<div class="pillb y">Bakery · Form 1 · 2027</div>`],[`<div class="pillb n">${WA}0714 404 090</div>`],[`<div class="url">www.royalcrest.co.zw · Bikita, Masvingo</div>`],
     [`<div class="sign">Bake it with science. <em>Sell it with skill.</em></div>`,cue('k41')-.2]],
   async lens(ctx,t,s){ctx.fillStyle='#fff';ctx.fillRect(0,0,S,S);await photo(ctx,'../assets/crest.jpg',(t-s.start)/(s.end-s.start),.92,1.0)}},
};
