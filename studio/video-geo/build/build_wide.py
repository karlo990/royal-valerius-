"""Assemble build/stage.html from wide.src.html plus the 3D station and cloud code in design/frames.html."""
import pathlib
B = pathlib.Path(__file__).resolve().parent
fr = (B.parent / 'design/frames.html').read_text()
st = fr[fr.index('/* ---------- 3D weather station'):fr.index('/* ===== FRAME 1')]
a = "function render(st){door.rotation.y=-(st.door||0)*1.9;"
assert st.count(a) == 1
st = st.replace(a, "function render(st){door.rotation.y=-(st.door||0)*1.9;if(st.vane!=null)vane.rotation.y=st.vane;")
(B / 'stage.html').write_text((B / 'wide.src.html').read_text().replace('/*ST*/', st))
print('wrote stage.html')
