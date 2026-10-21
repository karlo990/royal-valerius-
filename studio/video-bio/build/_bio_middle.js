/* ---------- background: clean lab paper, deep-lab blue for the dark scenes ---------- */
const BW=PORTRAIT?720:1280, BH=PORTRAIT?1280:720, DS=PORTRAIT?.88:1;
$('#bg').width=BW*1.5; $('#bg').height=BH*1.5;
const bg=$('#bg').getContext('2d'); bg.scale(1.5,1.5);
const CELLS=Array.from({length:22},(_,i)=>({x:(i*397)%BW,y:(i*233)%BH,r:18+(i%5)*12,ph:i*1.3}));
function drawBg(t,nv){const W=BW,H=BH;
  let g=bg.createRadialGradient(W*.67,H*.42,60,W*.6,H*.5,Math.max(W,H)*.8);g.addColorStop(0,'#FBFDFC');g.addColorStop(1,'#E3ECEB');bg.fillStyle=g;bg.fillRect(0,0,W,H);
  bg.save();for(const c of CELLS){const x=(c.x+t*4+Math.sin(t*.3+c.ph)*10)%(W+80)-40,y=c.y+Math.cos(t*.25+c.ph)*12;bg.strokeStyle='rgba(14,143,134,.10)';bg.lineWidth=1.4;
    bg.beginPath();bg.ellipse(x,y,c.r,c.r*.72,c.ph,0,7);bg.stroke();bg.beginPath();bg.ellipse(x+c.r*.15,y,c.r*.32,c.r*.24,c.ph,0,7);bg.stroke()}bg.restore();
  if(nv<=0)return;
  bg.save();bg.globalAlpha=nv;g=bg.createRadialGradient(W*.68,H*.44,40,W*.62,H*.5,Math.max(W,H)*.8);g.addColorStop(0,'#123B55');g.addColorStop(.6,'#0B2438');g.addColorStop(1,'#061524');bg.fillStyle=g;bg.fillRect(0,0,W,H);
  for(const c of CELLS){const x=(c.x+t*4)%(W+80)-40,y=c.y,a=.12+.08*Math.sin(t*.8+c.ph);const rg=bg.createRadialGradient(x,y,0,x,y,c.r*1.6);rg.addColorStop(0,`rgba(111,224,210,${a})`);rg.addColorStop(1,'rgba(111,224,210,0)');bg.fillStyle=rg;bg.fillRect(x-c.r*2,y-c.r*2,c.r*4,c.r*4)}
  bg.restore()}
(()=>{let g='';for(let i=0;i<144;i++){const a=i*2.5*Math.PI/180,r1=243,r2=i%6?252:262;
  g+=`<line class="tick" x1="${300+r1*Math.sin(a)}" y1="${300-r1*Math.cos(a)}" x2="${300+r2*Math.sin(a)}" y2="${300-r2*Math.cos(a)}"/>`}$('#ticks').innerHTML=g})();

/* ---------- 3D biology models (Three.js r128) ---------- */
const BASEC={A:'#2EAD6B',T:'#E04848',G:'#E8B020',C:'#3A7BD5',U:'#A05BE0'};
const PAIR={A:'T',T:'A',G:'C',C:'G'};
const SEQ='ATGCGTACCGATTGCAGTCAGGCTAATCGG'.split('');
function deepLens(ctx){const g=ctx.createRadialGradient(C,C*.85,30,C,C,C*1.05);g.addColorStop(0,'#16405A');g.addColorStop(.7,'#0B2438');g.addColorStop(1,'#051320');ctx.fillStyle=g;ctx.fillRect(0,0,S,S);
  ctx.save();for(let i=0;i<40;i++){const x=(i*173)%S,y=(i*311)%S,r=1+(i%4);ctx.fillStyle=`rgba(111,224,210,${.06+.05*(i%3)})`;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}ctx.restore()}
const BIO=(()=>{ if(!window.THREE) return null;
  const cv=document.createElement('canvas');cv.width=cv.height=S;
  const R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});R.setPixelRatio(1);R.setSize(S,S,false);R.setClearColor(0x000000,0);
  R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;R.localClippingEnabled=true;
  const V=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0);
  function lights(sc){sc.add(new THREE.HemisphereLight(0xE8F4FF,0x1A2A3A,.75));const k=new THREE.DirectionalLight(0xFFF4E6,1.5);k.position.set(5,8,9);sc.add(k);
    const rim=new THREE.DirectionalLight(0x6FE0D2,.9);rim.position.set(-8,3,-6);sc.add(rim);sc.add(new THREE.AmbientLight(0xffffff,.12))}
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:new THREE.Color(c),roughness:.42,metalness:.05},o));
  function cylBetween(m,a,b,r){const d=V.subVectors(b,a),L=d.length();m.position.copy(a).addScaledVector(d,.5);m.scale.set(r,L,r);m.quaternion.setFromUnitVectors(Y,d.clone().normalize())}
  const CYL=new THREE.CylinderGeometry(1,1,1,12), SPH=new THREE.SphereGeometry(1,16,12);
  function project(cam,p){const q=p.clone().project(cam);return[(q.x*.5+.5)*S,(-q.y*.5+.5)*S]}

  /* --- DNA / RNA scene --- */
  const dna={scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(32,1,.1,200),root:new THREE.Group()};lights(dna.scene);dna.scene.add(dna.root);
  const N=SEQ.length,RISE=.52,RAD=1.05,TW=36*Math.PI/180,OFF=150*Math.PI/180;
  const bb1=mat('#E2C26A',{roughness:.35,metalness:.25}),bb2=mat('#8FC3EA',{roughness:.35,metalness:.2}),bbR=mat(BASEC.U,{roughness:.35});
  const bm={};for(const k of 'ATGCU')bm[k]=mat(BASEC[k],{roughness:.5});
  const halves=[],phos=[],rnaBits=[];
  for(let i=0;i<N;i++){const h1=new THREE.Mesh(CYL,bm[SEQ[i]]),h2=new THREE.Mesh(CYL,bm[PAIR[SEQ[i]]]);dna.root.add(h1,h2);halves.push([h1,h2]);
    const p1=new THREE.Mesh(SPH,bb1),p2=new THREE.Mesh(SPH,bb2);p1.scale.setScalar(.15);p2.scale.setScalar(.15);dna.root.add(p1,p2);phos.push([p1,p2]);
    const rb=new THREE.Mesh(CYL,bm[SEQ[i]==='A'?'U':PAIR[SEQ[i]]]),rp=new THREE.Mesh(SPH,bbR);rp.scale.setScalar(.15);dna.root.add(rb,rp);rnaBits.push([rb,rp])}
  let tube1=null,tube2=null,tubeR=null;
  const ribo=new THREE.Group();const rL=new THREE.Mesh(new THREE.SphereGeometry(1.2,32,24),mat('#D9C8A6',{roughness:.7})),rS=new THREE.Mesh(new THREE.SphereGeometry(.8,32,24),mat('#C2AE88',{roughness:.7}));
  rL.position.set(0,.75,0);rL.scale.set(1.25,.85,1);rS.position.set(0,-.65,0);rS.scale.set(1.2,.7,.95);ribo.add(rL,rS);dna.scene.add(ribo);
  const AA=['#F28E2B','#59A14F','#EDC948','#B07AA1','#FF9DA7','#9C755F','#76B7B2','#E15759'];const beads=[];for(let i=0;i<12;i++){const b=new THREE.Mesh(SPH,mat(AA[i%8],{roughness:.45}));b.scale.setScalar(.32);dna.scene.add(b);beads.push(b)}
  function setTube(old,pts,r,m){if(old){dna.root.remove(old);old.geometry.dispose()} if(pts.length<2)return null;const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),Math.max(8,pts.length*6),r,10,false),m);dna.root.add(t);return t}
  // st: {build 0..1, open 0..1 (unzip), rna 0..1 (copy grows), rnaAlone 0..1, transl 0..1, yaw, horiz 0..1, hl:'AT'|'GC'|null}
  function dnaRender(st){const yaw=st.yaw||0, open=st.open||0, rna=st.rna||0, alone=st.rnaAlone||0, tr=st.transl||0;
    const s1=[],s2=[],sr=[];
    for(let i=0;i<N;i++){const y=(i-(N-1)/2)*RISE, th=i*TW;
      const vis=clamp((st.build??1)*N-i);
      // unzip a window in the middle: strand 2 swings out, strand 1 straightens a little
      const w=Math.exp(-Math.pow((i-N/2)/5.5,2))*open;
      const a=new THREE.Vector3(RAD*Math.cos(th),y,RAD*Math.sin(th)), b0=new THREE.Vector3(RAD*Math.cos(th+OFF),y,RAD*Math.sin(th+OFF));
      const b=b0.clone().add(new THREE.Vector3(Math.cos(th+OFF),0,Math.sin(th+OFF)).multiplyScalar(1.8*w));
      a.add(new THREE.Vector3(Math.cos(th),0,Math.sin(th)).multiplyScalar(-.25*w));
      const mid=a.clone().lerp(b,.5);
      const [h1,h2]=halves[i],[p1,p2]=phos[i];
      const gap=.12+1.6*w; // halves pull apart
      const da=a.clone().lerp(b,.5-gap/ a.distanceTo(b)*.5), db=b.clone().lerp(a,.5-gap/ a.distanceTo(b)*.5);
      cylBetween(h1,a,da.lerp(a,0),.09);cylBetween(h2,b,db,.09);
      h1.visible=h2.visible=p1.visible=p2.visible=vis>0;const sc=Math.max(.001,vis);
      h1.scale.x=h1.scale.z=.09*sc;h2.scale.x=h2.scale.z=.09*sc;p1.position.copy(a);p2.position.copy(b);p1.scale.setScalar(.16*sc);p2.scale.setScalar(.16*sc);
      h1.material=bm[SEQ[i]];
      if(st.hl){const isAT=SEQ[i]==='A'||SEQ[i]==='T';const on=(st.hl==='AT'&&isAT)||(st.hl==='GC'&&!isAT);h1.material.emissive=new THREE.Color(0x000000)}
      if(vis>0){s1.push(a);s2.push(b)}
      // RNA nucleotides pairing with strand 1 inside the bubble
      const [rb,rp]=rnaBits[i];const k=clamp((rna*N*1.6-(i-N*.2)));const inBubble=w>.25*open&&open>.5;
      if(inBubble&&k>0&&alone<.01){const rpos=da.clone().lerp(b,.25);cylBetween(rb,da.clone().lerp(a,-.02),rpos,.085);rb.visible=rp.visible=true;rp.position.copy(rpos);rp.scale.setScalar(.15*Math.min(1,k));sr.push(rpos.clone())}
      else {rb.visible=rp.visible=false}
    }
    dna.root.visible=alone<.98;
    tube1=setTube(tube1,s1,.1,bb1);tube2=setTube(tube2,s2,.1,bb2);tubeR=setTube(tubeR,alone<.01?sr:[],.1,bbR);
    // the copy on its own, then translation at a ribosome
    ribo.visible=alone>.01;beads.forEach(b=>b.visible=false);
    if(alone>.01){const pts=[];for(let i=0;i<18;i++){const x=(i-8.5)*.62-tr*5.6,y=-2.2+.25*Math.sin(i*.9);pts.push(new THREE.Vector3(x,y,0))}
      if(!dna.solo){dna.solo={tube:null,sticks:[]};for(let i=0;i<18;i++){const m=new THREE.Mesh(CYL,bm['AUGC'[i%4]]);dna.scene.add(m);const p=new THREE.Mesh(SPH,bbR);p.scale.setScalar(.15);dna.scene.add(p);dna.solo.sticks.push([m,p])}}
      if(dna.solo.tube){dna.scene.remove(dna.solo.tube);dna.solo.tube.geometry.dispose()}
      dna.solo.tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,.1,10,false),bbR);dna.solo.tube.material.transparent=true;dna.solo.tube.material.opacity=alone;dna.scene.add(dna.solo.tube);
      dna.solo.sticks.forEach(([m,p],i)=>{const a=pts[i],b=a.clone().add(new THREE.Vector3(0,.75,0));cylBetween(m,a,b,.085);p.position.copy(a);m.visible=p.visible=true});
      ribo.position.set(0,-1.55,0);ribo.scale.setScalar(clamp(tr*4));const nB=Math.floor(tr*12);
      beads.forEach((b,i)=>{b.visible=i<nB;const k=nB-1-i;b.position.set(.3+k*.05*0, 0.9+k*.55, .2*Math.sin(k*1.3))});
      // amino-acid chain grows out of the top of the ribosome
      beads.forEach((b,i)=>{const k=nB-1-i;b.position.set(Math.sin(k*.8)*.6,1.9+k*.5,Math.cos(k*.8)*.3)})}
    else if(dna.solo){dna.solo.sticks.forEach(([m,p])=>m.visible=p.visible=false);if(dna.solo.tube)dna.solo.tube.visible=false}
    const hz=st.horiz||0;dna.root.rotation.set(0,yaw,hz*Math.PI/2);
    const dist=lerp(16.5,15,hz)/(st.zoom||1);dna.cam.position.set(0,0,dist);dna.cam.lookAt(0,alone>.5?-.4:0,0);
    R.render(dna.scene,dna.cam);
    // anchors for 2D labels
    const out={cv};if(st.hlIdx!=null){const i=st.hlIdx;out.p1=project(dna.cam,phos[i][0].getWorldPosition(new THREE.Vector3()));out.p2=project(dna.cam,phos[i][1].getWorldPosition(new THREE.Vector3()))}
    return out}

  /* --- red blood cells --- */
  const rbc={scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(34,1,.05,400)};lights(rbc.scene);
  const prof=[];const NP=40;for(let i=0;i<=NP;i++){const r=i/NP,T=Math.sqrt(Math.max(0,1-r*r))*(.81+7.83*r*r-4.39*r*r*r*r)/3.91;prof.push(new THREE.Vector2(Math.max(1e-4,r),T/2))}
  for(let i=NP;i>=0;i--){const r=i/NP,T=Math.sqrt(Math.max(0,1-r*r))*(.81+7.83*r*r-4.39*r*r*r*r)/3.91;prof.push(new THREE.Vector2(Math.max(1e-4,r),-T/2))}
  const discGeo=new THREE.LatheGeometry(prof,64);discGeo.computeVertexNormals();
  const redM=new THREE.MeshPhysicalMaterial({color:new THREE.Color('#C41E2A'),roughness:.38,clearcoat:.35,clearcoatRoughness:.4,side:THREE.DoubleSide});
  const hero=new THREE.Mesh(discGeo,redM);hero.scale.setScalar(2.2);rbc.scene.add(hero);
  // sickle: a tapered crescent tube
  const arc=new THREE.CatmullRomCurve3(Array.from({length:24},(_,i)=>{const a=-1.25+i/23*2.5;return new THREE.Vector3(Math.sin(a)*1.6,Math.cos(a)*1.6-1.2,0)}));
  const sg=new THREE.TubeGeometry(arc,80,.42,20,false);{const pos=sg.attributes.position,tub=80,rad=20;for(let i=0;i<=tub;i++){const c=arc.getPointAt(i/tub),f=Math.pow(Math.sin(Math.PI*clamp(i/tub,0.02,.98)),.7);
    for(let j=0;j<=rad;j++){const k=i*(rad+1)+j;V.fromBufferAttribute(pos,k).sub(c).multiplyScalar(f);V.z*=.55;V.add(c);pos.setXYZ(k,V.x,V.y,V.z)}}sg.computeVertexNormals()}
  const sickle=new THREE.Mesh(sg,redM.clone());sickle.scale.setScalar(1.15);rbc.scene.add(sickle);
  const clipP=new THREE.Plane(new THREE.Vector3(0,0,-1),10);
  // vessel and flowing cells
  const vessel=new THREE.Mesh(new THREE.CylinderGeometry(6,6,120,48,1,true),new THREE.MeshStandardMaterial({color:0x7A1F2A,roughness:.9,side:THREE.BackSide}));vessel.rotation.x=Math.PI/2;rbc.scene.add(vessel);
  const NF=90,flow=new THREE.InstancedMesh(discGeo,redM,NF);rbc.scene.add(flow);const FL=Array.from({length:NF},(_,i)=>({r:Math.sqrt(((i*37)%100)/100)*4.6,a:i*2.39996,z:(i*1.31)%120,s:.9+((i*13)%10)/40,rx:i*.7,ry:i*1.9,sp:.6+((i*7)%10)/14}));
  const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler();
  // st: {mode:'hero'|'flow', yaw, cut 0..1, sickle 0..1, t}
  function rbcRender(st){const t=st.t;
    const flowOn=st.mode==='flow';vessel.visible=flow.visible=flowOn;hero.visible=sickle.visible=!flowOn;
    if(!flowOn){const sk=st.sickle||0;hero.visible=sk<.999;sickle.visible=sk>.001;
      redM.transparent=sk>0;redM.opacity=1-sk;sickle.material.transparent=sk<1;sickle.material.opacity=sk;
      hero.rotation.set(1.05+Math.sin(t*.4)*.15,st.yaw||0,0);sickle.rotation.set(.35,(st.yaw||0)*.6,.2);
      const cut=st.cut||0;clipP.constant=lerp(4,0,cut);redM.clippingPlanes=cut>0?[clipP]:[];redM.needsUpdate=true;
      rbc.cam.position.set(0,0,10);rbc.cam.lookAt(0,0,0)}
    else{for(let i=0;i<NF;i++){const f=FL[i];const z=((f.z+t*14*f.sp)%120)-60;M4.compose(new THREE.Vector3(Math.cos(f.a)*f.r,Math.sin(f.a)*f.r,z),Q.setFromEuler(E.set(f.rx+t*f.sp,f.ry+t*.5,0)),new THREE.Vector3(f.s,f.s,f.s));flow.setMatrixAt(i,M4)}
      flow.instanceMatrix.needsUpdate=true;redM.clippingPlanes=[];redM.transparent=false;redM.opacity=1;rbc.cam.position.set(0,0,-58);rbc.cam.lookAt(0,0,30)}
    R.render(rbc.scene,rbc.cam);return{cv}}

  /* --- bacterium --- */
  const bac={scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(32,1,.1,200),g:new THREE.Group()};lights(bac.scene);bac.scene.add(bac.g);
  const cap=[];const L=1.7,RR=.85;for(let i=0;i<=16;i++){const a=-Math.PI/2+i/16*Math.PI/2;cap.push(new THREE.Vector2(RR*Math.cos(a)+1e-4,-L+RR*Math.sin(a)))}for(let i=0;i<=16;i++){const a=i/16*Math.PI/2;cap.push(new THREE.Vector2(RR*Math.cos(a)+1e-4,L+RR*Math.sin(a)))}
  const wallGeo=new THREE.LatheGeometry(cap,48);const wallM=new THREE.MeshStandardMaterial({color:0x6FCF7E,roughness:.3,transparent:true,opacity:.32,depthWrite:false,side:THREE.DoubleSide});
  const wall=new THREE.Mesh(wallGeo,wallM);bac.g.add(wall);const memb=new THREE.Mesh(wallGeo,new THREE.MeshStandardMaterial({color:0xA6E3A1,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));memb.scale.setScalar(.9);bac.g.add(memb);
  const loopPts=Array.from({length:14},(_,i)=>{const a=i/14*Math.PI*2;return new THREE.Vector3(Math.cos(a)*.42+Math.sin(a*3)*.12,Math.sin(a)*1.6,Math.sin(a*2)*.25)});
  const nuc=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loopPts,true),160,.05,8,true),mat('#E2C26A',{emissive:new THREE.Color('#5A4810')}));bac.g.add(nuc);
  const plas=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,8,32),mat('#3A7BD5',{emissive:new THREE.Color('#0A2348')}));plas.position.set(.35,-1.2,.2);bac.g.add(plas);
  const riboM=mat('#B07AA1');for(let i=0;i<70;i++){const m=new THREE.Mesh(SPH,riboM);const a=i*2.4,y=-1.9+((i*37)%100)/100*3.8,r=.25+((i*13)%10)/10*.4;m.position.set(Math.cos(a)*r,y,Math.sin(a)*r);m.scale.setScalar(.05);bac.g.add(m)}
  const pilM=mat('#9FDCA6');for(let i=0;i<40;i++){const u=((i*37)%100)/100,a=i*2.4,y=-L*.9+u*L*1.8,n=new THREE.Vector3(Math.cos(a),0,Math.sin(a));const p0=n.clone().multiplyScalar(RR).setY(y),p1=n.clone().multiplyScalar(RR+.35).setY(y+.05);const m=new THREE.Mesh(CYL,pilM);cylBetween(m,p0,p1,.012);bac.g.add(m)}
  const helix=new THREE.CatmullRomCurve3(Array.from({length:60},(_,i)=>new THREE.Vector3(Math.cos(i*.7)*.22,-L-RR-i*.09,Math.sin(i*.7)*.22)));
  const flag=new THREE.Mesh(new THREE.TubeGeometry(helix,240,.035,8,false),mat('#CDEFD1'));bac.g.add(flag);
  const frags=[];for(let i=0;i<40;i++){const m=new THREE.Mesh(SPH,mat('#6FCF7E',{transparent:true,opacity:.8}));m.scale.setScalar(.09);m.visible=false;bac.scene.add(m);frags.push(m)}
  const abx=[];for(let i=0;i<10;i++){const m=new THREE.Mesh((THREE.CapsuleGeometry?new THREE.CapsuleGeometry(.08,.22,4,8):new THREE.SphereGeometry(.12,12,8)),mat('#FFFFFF',{emissive:new THREE.Color('#4A4A4A')}));m.visible=false;bac.scene.add(m);abx.push(m)}
  // st: {t, burst 0..1, abx 0..1}
  function bacRender(st){const t=st.t;bac.g.rotation.set(0,t*.35,Math.PI/2.6+Math.sin(t*.5)*.08);bac.g.position.set(Math.sin(t*.4)*.2,0,0);flag.rotation.y=t*9;
    const ab=st.abx||0,bu=st.burst||0;abx.forEach((m,i)=>{m.visible=ab>0&&bu<1;const a=i/10*Math.PI*2,r=lerp(6,1.2,eo(ab));m.position.set(Math.cos(a)*r,Math.sin(a)*r*.8,.6);m.rotation.z=a});
    bac.g.visible=bu<.999;bac.g.scale.set(1+bu*.3,1-bu*.5,1+bu*.3);wallM.opacity=.32*(1-bu);
    frags.forEach((m,i)=>{m.visible=bu>0&&bu<1;const a=i*2.39996,d=bu*4;m.position.set(Math.cos(a)*d,Math.sin(a*1.7)*d*.7,Math.sin(a)*d*.5);m.material.opacity=.8*(1-bu)});
    bac.cam.position.set(0,0,10.5);bac.cam.lookAt(0,0,0);R.render(bac.scene,bac.cam);return{cv}}

  /* --- virus --- */
  const vir={scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(32,1,.1,300),g:new THREE.Group()};lights(vir.scene);vir.scene.add(vir.g);
  const capM=new THREE.MeshStandardMaterial({color:0x2BB7A9,roughness:.5,flatShading:true,transparent:true,opacity:1});
  const capsid=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),capM);vir.g.add(capsid);
  const capE=new THREE.LineSegments(new THREE.EdgesGeometry(capsid.geometry),new THREE.LineBasicMaterial({color:0xBFF5EC,transparent:true,opacity:.6}));vir.g.add(capE);
  const spkM=mat('#E8B020',{roughness:.4}),tipM=mat('#F5D57A');const verts=capsid.geometry.attributes.position;const seen=new Set();
  for(let i=0;i<verts.count;i++){V.fromBufferAttribute(verts,i);const key=V.toArray().map(v=>v.toFixed(3)).join();if(seen.has(key))continue;seen.add(key);const n=V.clone().normalize();
    const s=new THREE.Mesh(CYL,spkM);cylBetween(s,n.clone().multiplyScalar(.95),n.clone().multiplyScalar(1.45),.04);vir.g.add(s);const tip=new THREE.Mesh(SPH,tipM);tip.position.copy(n.clone().multiplyScalar(1.5));tip.scale.setScalar(.1);vir.g.add(tip)}
  const gpts=Array.from({length:40},(_,i)=>new THREE.Vector3(Math.sin(i*1.3)*.5,Math.cos(i*.9)*.5,Math.sin(i*.7+1)*.5));
  const genes=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gpts),200,.04,8,false),mat(BASEC.U,{emissive:new THREE.Color('#3A1060')}));vir.g.add(genes);
  const cellM=new THREE.MeshStandardMaterial({color:0xE9A9B8,roughness:.75});const cell=new THREE.Mesh(new THREE.SphereGeometry(30,96,64),cellM);cell.position.set(0,-32.2,0);vir.scene.add(cell);
  const recM=mat('#7A4BC0');const recs=[];for(let i=0;i<60;i++){const a=((i*37)%100)/100*0.5-.25,b=((i*61)%100)/100*0.5-.25;const n=new THREE.Vector3(Math.sin(a),Math.cos(a)*Math.cos(b),Math.sin(b)).normalize();
    const m=new THREE.Mesh(CYL,recM);cylBetween(m,cell.position.clone().addScaledVector(n,29.9),cell.position.clone().addScaledVector(n,30.4),.05);vir.scene.add(m);recs.push(m)}
  let inj=null;
  const abM=mat('#F2F2F2',{emissive:new THREE.Color('#303030')}),abs=[];
  for(let i=0;i<10;i++){const y=new THREE.Group();const stem=new THREE.Mesh(CYL,abM),a1=new THREE.Mesh(CYL,abM),a2=new THREE.Mesh(CYL,abM);
    cylBetween(stem,new THREE.Vector3(0,-.5,0),new THREE.Vector3(0,0,0),.07);cylBetween(a1,new THREE.Vector3(0,0,0),new THREE.Vector3(-.3,.4,0),.06);cylBetween(a2,new THREE.Vector3(0,0,0),new THREE.Vector3(.3,.4,0),.06);y.add(stem,a1,a2);y.visible=false;vir.scene.add(y);abs.push(y)}
  // st: {t, open 0..1 (see inside), dock 0..1, inject 0..1, ab 0..1}
  function virRender(st){const t=st.t,dock=st.dock||0,ab=st.ab||0;
    vir.g.rotation.set(t*.25,t*.4,0);capM.opacity=lerp(1,.28,st.open||0);capM.depthWrite=(st.open||0)<.5;
    const showCell=dock>0&&ab<.01;cell.visible=showCell;recs.forEach(m=>m.visible=showCell);
    vir.g.position.set(0,lerp(0,-.55,eio(dock)),0);if(dock>0&&ab<.01){vir.g.rotation.set(.2,t*.15,0)}
    if(inj){vir.scene.remove(inj);inj.geometry.dispose();inj=null}
    const ij=st.inject||0;if(ij>0&&showCell){const pts=Array.from({length:30},(_,i)=>{const k=i/29*ij;return new THREE.Vector3(Math.sin(k*9)*.25,-1.6-k*3.2,Math.cos(k*7)*.2)});
      inj=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),90,.05,8,false),mat(BASEC.U,{emissive:new THREE.Color('#3A1060')}));vir.scene.add(inj)}
    abs.forEach((y,i)=>{y.visible=ab>0;const a=i/10*Math.PI*2,r=lerp(7,1.95,eo(ab-i*.03));const n=new THREE.Vector3(Math.cos(a),Math.sin(a),Math.sin(a*2)*.3).normalize();
      y.position.copy(n.clone().multiplyScalar(r)).add(vir.g.position);y.quaternion.setFromUnitVectors(Y,n.clone().negate())});
    const camZ=dock>0&&ab<.01?lerp(8,9.5,dock):lerp(7.5,9,ab);vir.cam.position.set(0,dock>0&&ab<.01?1.2:0,camZ);vir.cam.lookAt(0,dock>0&&ab<.01?-.6:0,0);R.render(vir.scene,vir.cam);return{cv}}

  return{dnaRender,rbcRender,bacRender,virRender}})();

/* ---------- scale ladder (2D, true sizes in micrometres) ---------- */
function scaleDraw(ctx,t,keys){deepLens(ctx);
  // keys: [[time, centreX, centreY, pixelsPerMicrometre], ...]; zoom moves exponentially between keys
  let k=keys[0];for(let i=1;i<keys.length;i++){if(t>=keys[i][0]-1.6){const a=keys[i-1],b=keys[i],u=eio((t-(b[0]-1.6))/1.6);k=[0,lerp(a[1],b[1],u),lerp(a[2],b[2],u),Math.exp(lerp(Math.log(a[3]),Math.log(b[3]),u))]}}
  const [,cx,cy,ppu]=k,X=x=>C+(x-cx)*ppu,Yv=y=>C+(y-cy)*ppu;
  const lab=(txt,x,y,col='#E9F7F5',f='600 18px "Plex Mono"')=>label(ctx,txt,x,y,{col,font:f});
  // red blood cell, 7 µm
  const rR=3.5*ppu;if(rR<9000){ctx.save();const g=ctx.createRadialGradient(X(0),Yv(0),rR*.15,X(0),Yv(0),rR);g.addColorStop(0,'#8E1420');g.addColorStop(.55,'#C41E2A');g.addColorStop(1,'#E04150');ctx.fillStyle=g;ctx.beginPath();ctx.arc(X(0),Yv(0),rR,0,7);ctx.fill();ctx.restore();if(rR<700)lab('RED BLOOD CELL · 7 µm',X(0),Yv(0)+rR+26)}
  // bacterium, 2 µm long
  const bx=5.6,by=.4,bl=2*ppu,bw=.8*ppu;if(bl<20000){ctx.save();ctx.fillStyle='rgba(111,207,126,.85)';ctx.strokeStyle='#CDEFD1';ctx.lineWidth=Math.max(1.5,bw*.06);ctx.beginPath();ctx.roundRect(X(bx)-bl/2,Yv(by)-bw/2,bl,bw,bw/2);ctx.fill();ctx.stroke();ctx.restore();
    if(bl>30&&bl<900)lab('BACTERIUM · 2 µm',X(bx),Yv(by)+bw/2+26)}
  // virus, 0.1 µm
  const vx=bx+1.35,vy=by-.1,vr=.05*ppu;if(vr>.6&&vr<9000){ctx.save();ctx.fillStyle='#2BB7A9';ctx.beginPath();ctx.arc(X(vx),Yv(vy),vr,0,7);ctx.fill();ctx.strokeStyle='#E8B020';ctx.lineWidth=Math.max(1,vr*.08);
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2;ctx.beginPath();ctx.moveTo(X(vx)+Math.cos(a)*vr,Yv(vy)+Math.sin(a)*vr);ctx.lineTo(X(vx)+Math.cos(a)*vr*1.35,Yv(vy)+Math.sin(a)*vr*1.35);ctx.stroke()}ctx.restore();
    if(vr>14&&vr<500)lab('VIRUS · 0.1 µm',X(vx),Yv(vy)+vr*1.4+26)}
  // DNA strand, 2 nm wide
  const dx=vx+.075,dy=vy,dw=.002*ppu;if(dw>1.2){ctx.save();const len=.03*ppu;for(let s=0;s<2;s++){ctx.strokeStyle=s?'#8FC3EA':'#E2C26A';ctx.lineWidth=Math.max(1.5,dw*.18);ctx.beginPath();
      for(let i=0;i<=80;i++){const u=i/80,x=X(dx)+u*len,y=Yv(dy)+Math.sin(u*len/(dw*1.7)*Math.PI+s*Math.PI)*dw/2;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
    for(let i=0;i<40;i++){const u=i/40,x=X(dx)+u*len,y1=Yv(dy)+Math.sin(u*len/(dw*1.7)*Math.PI)*dw/2,y2=Yv(dy)+Math.sin(u*len/(dw*1.7)*Math.PI+Math.PI)*dw/2;ctx.strokeStyle=Object.values(BASEC)[i%4];ctx.lineWidth=Math.max(1,dw*.08);ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2);ctx.stroke()}
    ctx.restore();if(dw>20)lab('DNA · 2 nm wide',Math.min(X(dx)+len*.25,C+120),Yv(dy)+dw*1.2+26)}
  // scale bar: pick a round length that is 80–200 px
  const units=[[10,'10 µm'],[5,'5 µm'],[2,'2 µm'],[1,'1 µm'],[.5,'0.5 µm'],[.2,'200 nm'],[.1,'100 nm'],[.05,'50 nm'],[.02,'20 nm'],[.01,'10 nm'],[.005,'5 nm'],[.002,'2 nm'],[.001,'1 nm']];
  const [u,txt]=units.find(([v])=>v*ppu<=220)||units[units.length-1];const w=u*ppu;ctx.save();ctx.strokeStyle='#E9F7F5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(C-w/2,620);ctx.lineTo(C+w/2,620);ctx.moveTo(C-w/2,610);ctx.lineTo(C-w/2,630);ctx.moveTo(C+w/2,610);ctx.lineTo(C+w/2,630);ctx.stroke();ctx.restore();lab(txt,C,595)}
function ballHouse(ctx,a){if(a<=0)return;ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(5,19,32,.72)';ctx.fillRect(0,0,S,S);
  const g=560,hH=330,hx=C+40;ctx.fillStyle='#E9F7F5';ctx.beginPath();ctx.moveTo(hx-150,g);ctx.lineTo(hx-150,g-hH*.62);ctx.lineTo(hx,g-hH);ctx.lineTo(hx+150,g-hH*.62);ctx.lineTo(hx+150,g);ctx.closePath();ctx.fill();
  ctx.fillStyle='#0B2438';ctx.fillRect(hx-30,g-110,60,110);ctx.fillRect(hx-115,g-200,55,55);ctx.fillRect(hx+60,g-200,55,55);
  ctx.fillStyle='#E8B020';ctx.beginPath();ctx.arc(hx-215,g-3,4.8,0,7);ctx.fill();ctx.strokeStyle='#E9F7F5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(60,g);ctx.lineTo(S-60,g);ctx.stroke();
  label(ctx,'football ≈ virus',hx-215,g+30,{col:'#E8B020',font:'600 17px "Plex Mono"'});label(ctx,'house ≈ red blood cell',hx,g+30,{col:'#E9F7F5',font:'600 17px "Plex Mono"'});ctx.restore()}

/* ---------- scenes ---------- */
const WA='<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3z"/></svg>';
const bp=(l,c)=>`<b class="bpL" style="background:${BASEC[l]}">${l}</b>`;
function dnaLabels(ctx,o,txt){if(!o.p1)return;ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(o.p1[0],o.p1[1],20,0,7);ctx.stroke();ctx.beginPath();ctx.arc(o.p2[0],o.p2[1],20,0,7);ctx.stroke();
  const mx=(o.p1[0]+o.p2[0])/2,my=Math.min(o.p1[1],o.p2[1])-44;ctx.fillStyle='rgba(5,19,32,.85)';ctx.beginPath();ctx.roundRect(mx-70,my-22,140,44,22);ctx.fill();label(ctx,txt,mx,my,{col:'#fff',font:'600 22px "Plex Mono"'});ctx.restore()}
const SC={
 open:{nv:1,cta:0,tag:()=>'2 METRES',
   copy:()=>[[`<div class="eb"><span class="n">BIO</span>BIOLOGY · LIFE UP CLOSE</div>`,cue('b01')-.4],[`<h1 class="hl">Two metres of code, <em>in every cell.</em></h1>`,cue('b01','two metres')],
     [`<div class="bd">A film for Grade 7 parents, from the biology lab at Royal Crest Academy, Bikita.</div>`,cue('b03')]],
   async lens(ctx,t,s){deepLens(ctx);if(!BIO)return;const o=BIO.dnaRender({build:eo((t-s.start-.3)/3),yaw:t*.6,zoom:1});ctx.drawImage(o.cv,0,0)}},
 title:{nv:0,cta:1,tag:()=>'BIKITA',
   copy:()=>[[`<div class="eb"><span class="n">★</span>ROYAL CREST ACADEMY</div>`],[`<h1 class="hl">Biology, <em>in 3D.</em></h1>`],
     [`<div class="bd">The code of life and the things that live in us: five models, five lessons.</div>`],
     [`<div class="chips"><span class="chip">DNA</span><span class="chip">RNA</span><span class="chip">Red blood cells</span><span class="chip">Bacteria</span><span class="chip gold">Viruses</span></div>`]],
   async lens(ctx,t,s){await clip(ctx,'micro',1,108,(t-s.start)/(s.end-s.start),1.04)}},
 dna:{nv:0,cta:1,tag:t=>t<cue('b06','A always')?'DOUBLE HELIX':t<cue('b06','G always')?'A–T':t<cue('b08')?'G–C':'3 BILLION',
   copy:()=>[[`<div class="eb"><span class="n">01</span>LESSON ONE · DNA</div>`],[`<h1 class="hl">A ladder <em>with a twist.</em></h1>`],
     [`<div class="card rows">${[['A','T','Adenine pairs with thymine','A always'],['G','C','Guanine pairs with cytosine','G always']].map(([a,b,d,w])=>`<div class="row bp" data-at="${cue('b06',w)}"><span class="pair">${bp(a)}<i>–</i>${bp(b)}</span><div><b>${a} with ${b}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('b06','four bases')-.2],
     [`<div class="chips"><span class="chip cy">Double helix</span><span class="chip">Sugar: deoxyribose</span><span class="chip">Lives in the nucleus</span></div>`,cue('b05','double helix')],
     [`<div class="big" id="bigcount">3,000,000,000 <small>base pairs</small></div>`,cue('b08','three billion')]],
   async lens(ctx,t,s){deepLens(ctx);if(!BIO)return;const at=cue('b06','A always'),gc=cue('b06','G always'),bil=cue('b08','three billion');
     const hl=t>=at&&t<gc+2.2?(t<gc?'AT':'GC'):null, idx=hl==='AT'?SEQ.findIndex((b,i)=>i>9&&(b==='A'||b==='T')):hl==='GC'?SEQ.findIndex((b,i)=>i>11&&(b==='G'||b==='C')):null;
     const z=t<bil?lerp(1,1.35,eio((t-at+.5)/1)):lerp(1.35,.7,eio((t-bil)/1.6));
     const o=BIO.dnaRender({build:1,yaw:hl?.2+Math.sin(t*.4)*.12:t*.5,zoom:z,hlIdx:idx});ctx.drawImage(o.cv,0,0);
     if(hl){const i=idx;dnaLabels(ctx,o,`${SEQ[i]} – ${PAIR[SEQ[i]]}`)}}},
 rna:{nv:0,cta:1,tag:t=>t<cue('b10','unzips')?'DNA vs RNA':t<cue('b12')?'TRANSCRIPTION':t<cue('b13')?'TRANSLATION':'DNA vs RNA',
   copy:()=>[[`<div class="eb"><span class="n">02</span>LESSON TWO · RNA</div>`],[`<h1 class="hl">DNA vs RNA: <em>the difference.</em></h1>`],
     [`<div class="card cmp"><div class="ch"><span></span><b>DNA</b><b class="r">RNA</b></div>${[['Strands','Two','One','one strand'],['Sugar','Deoxyribose','Ribose','ribose'],['Bases',`${bp('A')}${bp('T')}${bp('G')}${bp('C')}`,`${bp('A')}${bp('U')}${bp('G')}${bp('C')}`,'uracil'],['Job','Master plan','Working copy','photocopy']].map(([k,a,b,w],i)=>
       `<div class="cr" data-at="${i<3?cue('b11',w):cue('b13',w)}"><span>${k}</span><em>${a}</em><em class="r">${b}</em></div>`).join('')}</div>`,cue('b10')]],
   async lens(ctx,t,s){deepLens(ctx);if(!BIO)return;const uz=cue('b10','unzips'),cp=cue('b10','copies'),lv=cue('b12','leaves'),rd=cue('b12','reads');
     const st={build:1,yaw:Math.sin(t*.3)*.25,horiz:eio((t-uz+.8)/1),open:eio((t-uz)/1.2),rna:clamp((t-cp)/2.4),rnaAlone:eio((t-lv)/1),transl:clamp((t-rd)/4.5),zoom:1};
     if(t<uz-.8)st.yaw=t*.5;const o=BIO.dnaRender(st);ctx.drawImage(o.cv,0,0);
     if(st.open>.5&&st.rnaAlone<.1)label(ctx,'RNA copy forming',C,640,{col:'#E9F7F5',a:clamp((t-cp)/.6),font:'600 18px "Plex Mono"'});
     if(st.rnaAlone>.5){label(ctx,'mRNA',150,520,{col:'#D7B4FF',font:'600 18px "Plex Mono"'});label(ctx,'RIBOSOME',C,470,{col:'#E9F7F5',a:clamp((t-rd)/.6),font:'600 16px "Plex Mono"'});label(ctx,'PROTEIN',C+130,170,{col:'#F5D57A',a:clamp((t-rd-1.5)/.6),font:'600 16px "Plex Mono"'})}},
   update(t){document.querySelectorAll('.cr').forEach(e=>{const a=+e.dataset.at,k=eo((t-a)/.5);e.style.opacity=lerp(.25,1,k)})}},
 rbc:{nv:0,cta:1,tag:t=>t<cue('b17','bone marrow')-1?'7 µm DISC':t<cue('b18','Change')?'2 MILLION/S':'GAG → GTG',
   copy:()=>[[`<div class="eb"><span class="n">03</span>LESSON THREE · RED BLOOD CELLS</div>`],[`<h1 class="hl">Built to <em>carry oxygen.</em></h1>`],
     [`<div class="card rows">${[['Shape','A disc, thinner in the middle','disc'],['Inside','Haemoglobin, which carries oxygen','haemoglobin'],['Nucleus','None, so there is more room for haemoglobin','nucleus'],['Made in','Bone marrow, about 2 million a second','bone marrow']].map(([n,d,w],i)=>`<div class="row f" data-at="${i<2?cue('b15',w):i===2?cue('b16'):cue('b17',w)}"><i class="cy"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('b15','disc')-.3],
     [`<div class="chips"><span class="chip gold">Sickle cell: one letter, GAG → GTG</span></div>`,cue('b18','one letter')]],
   async lens(ctx,t,s){deepLens(ctx);if(!BIO)return;const nn=cue('b16'),fl=cue('b17','bone marrow')-.4,sk=cue('b18','sickle');
     const hero=g=>{const o=BIO.rbcRender({mode:'hero',t,yaw:t*.4,cut:eio((t-nn)/.9)*clamp((fl-t)/.5+1),sickle:eio((t-sk)/1.4)});g.drawImage(o.cv,0,0);
       if(t>=nn&&t<fl)label(g,'NO NUCLEUS',C,600,{col:'#E9F7F5',font:'600 20px "Plex Mono"',a:clamp((t-nn-.5)/.4)});
       if(t>=sk-1.5){label(g,'GAG → GTG',C,110,{col:'#F5D57A',font:'600 24px "Plex Mono"',a:clamp((t-sk+1.5)/.5)});label(g,'SICKLE CELL',C,620,{col:'#E9F7F5',font:'600 18px "Plex Mono"',a:clamp((t-sk-.3)/.5)})}};
     const flow=g=>{const o=BIO.rbcRender({mode:'flow',t});g.drawImage(o.cv,0,0);const n=Math.floor(Math.max(0,t-fl)*2e6);label(g,n.toLocaleString('en-GB')+' made',C,620,{col:'#E9F7F5',font:'600 22px "Plex Mono"',a:clamp((t-fl-.6)/.4)})};
     const back=cue('b18','Change')-.6;
     if(t<fl){hero(ctx);return} if(t<back){await xfade(ctx,t,fl,.7,async g=>hero(g),async g=>flow(g));return} await xfade(ctx,t,back,.7,async g=>flow(g),async g=>hero(g))},
   update(t){document.querySelectorAll('.row.f').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 bact:{nv:0,cta:1,tag:t=>t<cue('b21','amasi')?'BACTERIUM':t<cue('b22','Others')?'HELPFUL':t<cue('b22','antibiotics')?'HARMFUL':'ANTIBIOTIC',
   copy:()=>[[`<div class="eb"><span class="n">04</span>LESSON FOUR · BACTERIA</div>`],[`<h1 class="hl">One cell, <em>no nucleus.</em></h1>`],
     [`<div class="chips">${[['DNA loop','loop'],['Flagellum','flagellum'],['No nucleus','no nucleus']].map(([n,w])=>`<span class="chip bz" data-at="${cue(w==='flagellum'?'b21':'b19',w)}">${n}</span>`).join('')}</div>`,cue('b19','no nucleus')],
     [`<div class="two"><div class="card g" data-at="${cue('b21','help')}"><b>Helpful</b><small>Turn milk into amasi. Help digestion in your gut.</small></div><div class="card h" data-at="${cue('b22','Others')}"><b>Harmful</b><small>Cholera. Boil water and wash your hands. Antibiotics can kill bacteria.</small></div></div>`,cue('b21','help')-.2]],
   async lens(ctx,t,s){const mic=cue('b19')+.4;
     const model=g=>{deepLens(g);if(!BIO)return;const ab=cue('b22','antibiotics');const o=BIO.bacRender({t,abx:clamp((t-ab)/1.2),burst:eio((t-ab-1.2)/1)});g.drawImage(o.cv,0,0);
       if(t>cue('b19','DNA')&&t<cue('b20')+2)label(g,'DNA LOOP',C+150,250,{col:'#F5D57A',font:'600 17px "Plex Mono"',a:clamp((t-cue('b19','DNA'))/.5)});
       if(t>cue('b21','flagellum')-.3&&t<cue('b21','Some'))label(g,'FLAGELLUM',C-150,560,{col:'#CDEFD1',font:'600 17px "Plex Mono"',a:clamp((t-cue('b21','flagellum')+.3)/.5)})};
     if(t<mic){await xfade(ctx,t,s.start+.6,.1,async g=>clip(g,'slide',1,40,(t-s.start)/(mic-s.start),1.04),async g=>clip(g,'slide',1,40,(t-s.start)/(mic-s.start),1.04));return}
     await xfade(ctx,t,mic,.8,async g=>clip(g,'slide',40,40,1,1.04),async g=>model(g))},
   update(t){document.querySelectorAll('.chip.bz').forEach(e=>e.classList.toggle('cy',t>=+e.dataset.at));document.querySelectorAll('.two .card').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 virus:{nv:0,cta:1,tag:t=>t<cue('b25','locks')?'VIRUS':t<cue('b27','vaccines')?'HIJACK':'VACCINES',
   copy:()=>[[`<div class="eb"><span class="n">05</span>LESSON FIVE · VIRUSES</div>`],[`<h1 class="hl">Not even <em>a cell.</em></h1>`],
     [`<div class="card rows">${[['Genes in a coat','DNA or RNA inside a protein shell','b23','protein'],['Hijacker','Locks onto your cells to copy itself','b25','locks'],['Antibiotics','Do not work on viruses','b27','Antibiotics'],['Vaccines','Train your body to fight back','b27','vaccines']].map(([n,d,l,w],i)=>`<div class="row v" data-at="${cue(l,w)}"><i class="${i===2?'up':'cy'}"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('b23','protein')-.3]],
   async lens(ctx,t,s){deepLens(ctx);if(!BIO)return;const o=BIO.virRender({t,open:eio((t-cue('b23','genes'))/1)*(1-eio((t-cue('b25','locks')+.3)/.6)),dock:eio((t-cue('b25','locks'))/1.4)*(t<cue('b27')?1:0),inject:clamp((t-cue('b25','hijacks'))/1.6),ab:eio((t-cue('b27','vaccines'))/1.6)});
     ctx.drawImage(o.cv,0,0);
     if(t>cue('b23','genes')&&t<cue('b25','locks'))label(ctx,'GENES (RNA)',C,620,{col:'#D7B4FF',font:'600 18px "Plex Mono"',a:clamp((t-cue('b23','genes')-.4)/.5)});
     if(t>cue('b25','locks')+.6&&t<cue('b27'))label(ctx,'YOUR CELL',C,640,{col:'#E9F7F5',font:'600 18px "Plex Mono"',a:clamp((t-cue('b25','locks')-.6)/.5)});
     if(t>cue('b27','vaccines')+.6)label(ctx,'ANTIBODIES',C,620,{col:'#E9F7F5',font:'600 18px "Plex Mono"',a:clamp((t-cue('b27','vaccines')-.6)/.5)})},
   update(t){document.querySelectorAll('.row.v').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 scale:{nv:1,cta:1,tag:t=>t<cue('b29','bacterium')?'7 µm':t<cue('b29','virus')?'2 µm':t<cue('b29','DNA')?'0.1 µm':'2 nm',
   copy:()=>[[`<div class="eb"><span class="n">↘</span>HOW SMALL?</div>`],[`<h1 class="hl">From cell <em>to code.</em></h1>`],
     [`<div class="card rows">${[['Red blood cell','7 µm','red blood cell'],['Bacterium','2 µm','bacterium'],['Virus','0.1 µm','virus'],['DNA','2 nm wide','DNA']].map(([n,d,w],i)=>`<div class="row z" data-at="${cue('b29',w)}"><i style="background:${['#C41E2A','#6FCF7E','#2BB7A9','#E2C26A'][i]}"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`,cue('b29')-.2]],
   async lens(ctx,t,s){const keys=[[0,0,0,46],[cue('b29','bacterium'),5.6,.4,150],[cue('b29','virus'),6.95,.3,2600],[cue('b29','DNA'),7.03,.3,90000]];
     scaleDraw(ctx,t,keys);ballHouse(ctx,clamp((t-cue('b30','football'))/.6)*clamp((cue('b31','microscopes')-t)/.6))},
   update(t){document.querySelectorAll('.row.z').forEach(e=>{e.style.opacity=lerp(.25,1,eo((t-e.dataset.at)/.5))})}},
 careers:{nv:0,cta:1,tag:()=>'CAREERS',
   copy:()=>[[`<div class="eb"><span class="n">→</span>WHERE IT LEADS</div>`],[`<h1 class="hl">Biology <em>opens doors.</em></h1>`],
     [`<div class="jobs">${['Doctor','Nurse','Pharmacist','Medical laboratory scientist','Biotechnologist','Vet','Agricultural scientist'].map(w=>`<span class="job" data-at="${cue('b33',w.split(' ')[0])}">${w}</span>`).join('')}</div>`,cue('b33','Doctor')-.4],
     [`<div class="chips">${['clinic','hospital','farm','lab'].map(w=>`<span class="chip bz" data-at="${cue('b34',w)}">${w[0].toUpperCase()+w.slice(1)}</span>`).join('')}</div>`,cue('b34','clinic')-.3]],
   async lens(ctx,t,s){await photo(ctx,'../assets/science-lab.jpg',(t-s.start)/(s.end-s.start),1.04,1.14)},
   update(t){document.querySelectorAll('.job').forEach(e=>{const a=+e.dataset.at,k=eo((t-a)/.5);e.style.opacity=lerp(.25,1,k);e.style.transform=`scale(${1+.06*Math.max(0,1-Math.abs(t-a-.3)/.6)})`});
     document.querySelectorAll('.chip.bz').forEach(e=>e.classList.toggle('gold',t>=+e.dataset.at))}},
 school:{nv:0,cta:1,tag:()=>'FORM 1',
   copy:()=>[[`<div class="eb"><span class="n">★</span>AT ROYAL CREST</div>`],[`<h1 class="hl">It starts <em>in Form 1.</em></h1>`],
     [`<div class="chips"><span class="chip gold">Biology</span><span class="chip">Chemistry</span><span class="chip">Physics</span><span class="chip">Microscopes</span><span class="chip">Real practicals</span></div>`,cue('b35','Biology')],
     [`<div class="bd">Science · Innovation · Skill. Taught for ZIMSEC and Cambridge, in Bikita.</div>`,cue('b36')]],
   async lens(ctx,t,s){const u=(t-s.start)/(s.end-s.start);if(u<.5){await clip(ctx,'micro',1,108,u*2,1.04);return}await xfade(ctx,t,s.start+(s.end-s.start)*.5,.8,async g=>clip(g,'micro',108,108,1,1.04),async g=>clip(g,'slide',1,132,(u-.5)*2,1.04))}},
 parents:{nv:1,cta:1,tag:()=>'2027',
   copy:()=>[[`<div class="eb"><span class="n">★</span>GRADE 7 PARENTS</div>`],[`<h1 class="hl">Grade 7 <span class="arr">⟶</span> <em>Form 1, 2027.</em></h1>`],
     [`<div class="bd">Come and look down a microscope with us.</div>`,cue('b38')],[`<div class="flag">2027 INTAKE · LIMITED PLACES</div>`,cue('b37','limited')]],
   async lens(ctx,t,s){await photo(ctx,'../assets/science-lab.jpg',(t-s.start)/(s.end-s.start),1.0,1.12)}},
 outro:{nv:0,cta:0,tag:()=>'ENROL',top:120,
   copy:()=>[[`<h1 class="hl">Royal Crest Academy</h1>`],[`<div class="tagline">SCIENCE · INNOVATION · SKILL</div>`],
     [`<div class="pillb y">Biology · Form 1 · 2027</div>`],[`<div class="pillb n">${WA}0714 404 090</div>`],[`<div class="url">www.royalcrest.co.zw · Bikita, Masvingo</div>`],
     [`<div class="sign">Look closer. <em>Life is amazing.</em></div>`,cue('b40')-.2]],
   async lens(ctx,t,s){ctx.fillStyle='#fff';ctx.fillRect(0,0,S,S);await photo(ctx,'../assets/crest.jpg',(t-s.start)/(s.end-s.start),.92,1.0)}},
};
