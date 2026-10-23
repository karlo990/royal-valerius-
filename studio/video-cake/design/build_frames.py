"""Inject the wide-screen version of the 3D cake engine into frames.src.html → frames.html."""
import pathlib
D = pathlib.Path(__file__).resolve().parent
src = (D.parent / 'build/_cake_middle.js').read_text().split('\n')
i0 = next(i for i, l in enumerate(src) if l.startswith('const CAKE=(()=>'))
i1 = next(i for i, l in enumerate(src) if 'return{render,setCrest}})();' in l)
m = '\n'.join(src[i0:i1 + 1])
R = [("cv.width=cv.height=S;", "cv.width=CW;cv.height=CH;"), ("R.setSize(S,S,false)", "R.setSize(CW,CH,false)"),
     ("new THREE.PerspectiveCamera(30,1,.1,200)", "new THREE.PerspectiveCamera(30,CW/CH,.1,200)"),
     ("const tilt=st.tilt??.32,dist=(11+ex*10)/(st.zoom||1),ly=1.1+ex*3.7;", "const tilt=st.tilt??.32,dist=(11+ex*10)/(st.zoom||1),ly=st.ly??(1.1+ex*3.7);"),
     ("R.render(sc,cam);", "if(st.shift)cam.setViewOffset(CW,CH,-st.shift*CW,0,CW,CH);else cam.clearViewOffset();cam.updateProjectionMatrix();R.render(sc,cam);"),
     ("return[(v.x*.5+.5)*S,(-v.y*.5+.5)*S]};", "return[(v.x*.5+.5)*1280,(-v.y*.5+.5)*720]};"),
     ("anc.push(P(RAD+.05,SH+ex*5,0));anc.push(P(RAD+.13,SH+.4+ex*6.6,0));\n    return{cv,anc}}",
      "anc.push(P(RAD+.05,SH+ex*5,0));anc.push(P(RAD+.13,SH+.4+ex*6.6,0));\n    const ancL=[];[0,1,2,3].forEach(i=>ancL.push(P(-RAD*.9,BASE[i]+HT[i]/2+ex*i*1.15,0)));ancL.push(P(-RAD-.05,SH+ex*5,0));ancL.push(P(-RAD-.13,SH+.4+ex*6.6,0));\n    return{cv,anc,ancW:anc,ancL}}")]
for a, b in R:
    assert m.count(a) == 1, a[:60]
    m = m.replace(a, b)
(D / 'frames.html').write_text((D / 'frames.src.html').read_text().replace('/*CAKE*/', m))
print('wrote frames.html')
