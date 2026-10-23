# Technical Graphics film (in progress)

A 3-minute film for Grade 7 parents, in the same series and design system as the Lab Series
("Look closer") and Mandarin Connect films: crest lockup, rotating gold dial, numbered eyebrow,
two-tone serif headline, commentary bar and enrol bar. Not rendered yet; the design pages below
are the building blocks.

## Design pages (open in a browser)

| Page | What it is | Published |
|---|---|---|
| `design/three-point-perspective.html` | The 3점투시 sketch rebuilt in 3D: boxes above and below eye level, live vanishing points as the camera tilts. 2D canvas with its own camera maths. | https://claude.ai/artifact/TQcwsNELTGw3X42tF3f1Fi |
| `design/bim-house.html` | Exploded BIM house in five layers (site, living level, first-floor slab, roof frame, MEP). Three.js r128. Each element carries an IFC class and material; quantities are computed from the model. Section cut, layer select, build-up sequence. | https://claude.ai/artifact/FyHZuq1kBACsR8qtjua7kB |

Both pages expose a deterministic hook for the frame renderer used in `studio/video`:
`BIM.setState({explode, yaw, pitch, zoom, section, select, lines})` then `BIM.render()`.

## Plan

| Part | Teaches | Device |
|---|---|---|
| Cold open | A blank A3 sheet and one pencil line | 2D canvas, line draws itself |
| 01 Lines & title block | Line types, border, title block | 2D drafting |
| 02 Perspective | 2-point and 3-point perspective | `three-point-perspective` scene, camera tilts |
| 03 Orthographic | Plan, front and side elevations | 3D model flattens into views, projection lines drawn |
| 04 Sections | Cutting plane, hatching, dimensions | Section cut through the BIM model |
| 05 BIM | Smart model, quantities, services, build-up | `bim-house`, layers explode and assemble |
| Pitch + crest | Technical Graphics → Building Technology | Same closing scenes as the series |

## Decisions still open

1. Does the school teach BIM software (Revit, ArchiCAD, FreeCAD, SketchUp)? If not, present BIM as where Technical Graphics leads.
2. First-angle or third-angle projection, to match the ZIMSEC/Cambridge papers the class sits.
3. Voices: a Technical Graphics teacher plus Sam, or the existing pair.
4. Landscape and portrait, as with the Mandarin film.

## Tools

- `tools/screenshot.mjs`: screenshot a design page headlessly with WebGL (SwiftShader). Three.js is served from
  `studio/video/node_modules` because cdnjs is blocked in the build container.

## Reference

- `reference/three-point-perspective-sketch.png`: the 3점투시 sketch the perspective page reproduces.
- `reference/exploded-bim-house.webp`: the exploded-house image the BIM page is modelled on.
