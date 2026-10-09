"""Build the chemistry module for the Flyer Studio.

For every compound in COMPOUNDS this script
  1. looks the compound up in PubChem (US National Library of Medicine, NIH)
     to get its IUPAC name, formula, molar mass, SMILES and CID;
  2. draws an exam-style structure diagram with RDKit:
       - small molecules as a *displayed formula* (every atom and bond shown,
         the way ZIMSEC and Cambridge O Level papers draw them),
       - larger molecules as a *skeletal formula*;
     with the functional group highlighted in the school gold;
  3. cross-checks PubChem's formula and mass against RDKit's own calculation;
  4. writes studio/data/molecules.json and studio/data/molecules/<id>.svg.

PubChem responses are cached in studio/data/pubchem_cache.json, so re-running
works offline and never hits the API twice for the same compound.

    pip install rdkit
    python studio/tools/build_chemistry.py            # build everything
    python studio/tools/build_chemistry.py --refresh  # ignore the cache
"""
import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from rdkit import Chem
from rdkit.Chem import Descriptors, rdDepictor, rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SVG_DIR = DATA / "molecules"
CACHE = DATA / "pubchem_cache.json"
PUG_CID = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{}/property/IUPACName,MolecularFormula,MolecularWeight,SMILES,Title/JSON"
UA = "RoyalCrestFlyerStudio/1.0 (school education project; royalcrest.co.zw)"

GOLD = (0.82, 0.68, 0.30)
NAVY = (0.075, 0.13, 0.35)

# Functional groups: name, SMARTS, general formula / note.
# Atoms carrying a map number (:1, :2 ...) are highlighted; with no map
# numbers every matched atom is. Hydrogens are highlighted only where they
# belong to the group itself (the H of -OH, -NH-, and the H of -CHO).
GROUPS = {
    "alkane":   ("Alkane", None, "CₙH₂ₙ₊₂ · only C–C single bonds"),
    "alkene":   ("Alkene", "[C:1]=[C:2]", "CₙH₂ₙ · a C=C double bond"),
    "alcohol":  ("Alcohol", "[CX4][OX2H1:1]", "CₙH₂ₙ₊₁OH · the –OH group"),
    "aldehyde": ("Aldehyde", "[CX3;!H0:1]=[O:2]", "the –CHO group at the end of a chain"),
    "ketone":   ("Ketone", "[#6][CX3:1](=[O:2])[#6]", "a C=O inside the chain"),
    "acid":     ("Carboxylic acid", "[CX3:1](=[O:2])[OX2H1:3]", "the –COOH group"),
    "ester":    ("Ester", "[#6][CX3:1](=[O:2])[OX2:3][#6]", "the –COO– link"),
    "amide":    ("Amide", "[CX3:1](=[O:2])[NX3:3]", "the –CONH– group"),
    "arene":    ("Arene", "c1ccccc1", "a benzene ring"),
    "sugar":    ("Carbohydrate", "[OX2H1:1]", "many –OH groups on a ring"),
    "purine":   ("Alkaloid", None, "nitrogen atoms in two fused rings"),
}

# id, PubChem name, PubChem CID, group key, display style, everyday use, fun fact
COMPOUNDS = [
    ("methane", "methane", 297, "alkane", "displayed",
     "Natural gas and biogas from cattle dung digesters.",
     "Cows burp out methane made by microbes in their stomachs, about 100 kg per cow each year."),
    ("ethene", "ethylene", 6325, "alkene", "displayed",
     "Making polythene, the plastic in carrier bags.",
     "Ripening fruit gives off ethene, which is why one ripe banana speeds up the others in the bag."),
    ("ethanol", "ethanol", 702, "alcohol", "displayed",
     "Hand sanitiser, fuel and solvents.",
     "Yeast makes ethanol by fermenting sugar. The same reaction makes bread dough rise."),
    ("methanal", "formaldehyde", 712, "aldehyde", "displayed",
     "Formalin, which preserves biology specimens.",
     "Methanal is the simplest aldehyde: one carbon, and the –CHO group is the whole molecule."),
    ("ethanal", "acetaldehyde", 177, "aldehyde", "displayed",
     "Making dyes, plastics and perfumes.",
     "Your liver turns ethanol into ethanal. Oxidise an alcohol carefully and you get an aldehyde."),
    ("benzaldehyde", "benzaldehyde", 240, "aldehyde", "skeletal",
     "Almond flavouring in food.",
     "Benzaldehyde gives almonds and cherries their smell. It is an aldehyde fixed to a benzene ring."),
    ("vanillin", "vanillin", 1183, "aldehyde", "skeletal",
     "Vanilla flavour in ice cream and biscuits.",
     "Vanillin carries three groups at once: an aldehyde, a phenol –OH and an ether."),
    ("cinnamaldehyde", "cinnamaldehyde", 637511, "aldehyde", "skeletal",
     "The flavour of cinnamon.",
     "Cinnamaldehyde has both an aldehyde group and a C=C double bond, so it reacts as both."),
    ("propanone", "acetone", 180, "ketone", "displayed",
     "Nail-varnish remover and a lab solvent.",
     "Propanone and propanal share the formula C₃H₆O. Moving the C=O changes aldehyde to ketone."),
    ("ethanoic-acid", "acetic acid", 176, "acid", "displayed",
     "Vinegar is about 5% ethanoic acid in water.",
     "Ethanoic acid is a weak acid: only a small share of its molecules release H⁺ in water."),
    ("isoamyl-acetate", "isoamyl acetate", 31276, "ester", "skeletal",
     "Banana flavouring in sweets.",
     "Esters make the smells of fruit. This one smells so strongly of banana it is called banana oil."),
    ("urea", "urea", 1176, "amide", "displayed",
     "Fertiliser that feeds crops with nitrogen.",
     "In 1828 Friedrich Wöhler made urea from inorganic salts, showing living things are not needed to make organic compounds."),
    ("benzene", "benzene", 241, "arene", "skeletal",
     "Starting material for dyes, plastics and medicines.",
     "August Kekulé said the ring shape of benzene came to him in a daydream of a snake biting its tail."),
    ("glucose", "glucose", 5793, "sugar", "skeletal",
     "The sugar plants make in photosynthesis.",
     "Every glucose molecule in a maize plant was built from carbon dioxide and water using sunlight."),
    ("caffeine", "caffeine", 2519, "purine", "skeletal",
     "Found in tea, coffee and cola.",
     "Tea and coffee plants make caffeine partly as a natural pesticide against insects."),
    ("aspirin", "aspirin", 2244, "acid+ester", "skeletal",
     "A pain-relief medicine.",
     "Aspirin is a cousin of salicin, a compound in willow bark that people chewed for pain."),
    ("capsaicin", "capsaicin", 1548943, "amide", "skeletal",
     "The heat in chillies.",
     "Capsaicin does not burn you. It tricks heat sensors in your mouth into firing."),
]


def fetch_pubchem(compounds, cache, refresh=False):
    """One batched PUG REST request for every CID not yet cached.

    Batching keeps us far below PubChem's limit of 5 requests per second.
    The returned Title is checked against the name we asked for, and the
    formula and mass are cross-checked against RDKit in main()."""
    missing = [c for c in compounds if refresh or str(c[2]) not in cache]
    if missing:
        ids = ",".join(str(c[2]) for c in missing)
        url = PUG_CID.format(ids)
        for attempt in range(8):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=60) as r:
                    rows = json.load(r)["PropertyTable"]["Properties"]
                break
            except Exception as e:  # 429 / 503 when PubChem is busy: back off
                wait = 5 * 2 ** attempt
                print(f"  PubChem busy ({e}); retrying in {wait}s", file=sys.stderr)
                time.sleep(wait)
        else:
            raise RuntimeError("PubChem lookup failed; try again later (results so far are cached)")
        for row in rows:
            cache[str(row["CID"])] = row
        CACHE.write_text(json.dumps(cache, indent=1, ensure_ascii=False))
    return cache


def formula_html(formula):
    """C2H4O -> C<sub>2</sub>H<sub>4</sub>O"""
    return re.sub(r"(\d+)", r"<sub>\1</sub>", formula)


def highlight(mol, smarts_list, aldehyde=False):
    atoms = set()
    for smarts in smarts_list:
        if not smarts:
            continue
        patt = Chem.MolFromSmarts(smarts)
        mapped = [a.GetIdx() for a in patt.GetAtoms() if a.GetAtomMapNum()]
        for match in mol.GetSubstructMatches(patt):
            keep = [match[i] for i in mapped] if mapped else list(match)
            atoms.update(keep)
    group_atoms = set(atoms)
    for a in group_atoms:
        atom = mol.GetAtomWithIdx(a)
        if atom.GetAtomicNum() in (7, 8) or (atom.GetAtomicNum() == 6 and aldehyde and atom.GetDegree() <= 3
                                              and any(n.GetAtomicNum() == 8 for n in atom.GetNeighbors())):
            atoms.update(n.GetIdx() for n in atom.GetNeighbors() if n.GetAtomicNum() == 1)
    bonds = [b.GetIdx() for b in mol.GetBonds()
             if b.GetBeginAtomIdx() in atoms and b.GetEndAtomIdx() in atoms]
    return sorted(atoms), bonds


PX_PER_UNIT = 62   # RDKit bond length is 1.5 units -> about 93 px per bond
MARGIN = 70


def draw(mol, style, smarts_list, aldehyde=False):
    if style == "displayed":
        mol = Chem.AddHs(mol)
    rdDepictor.SetPreferCoordGen(True)
    rdDepictor.Compute2DCoords(mol)
    pos = mol.GetConformer().GetPositions()
    w = int((pos[:, 0].max() - pos[:, 0].min()) * PX_PER_UNIT + 2 * MARGIN)
    h = int((pos[:, 1].max() - pos[:, 1].min()) * PX_PER_UNIT + 2 * MARGIN)
    atoms, bonds = highlight(mol, smarts_list, aldehyde)
    d = rdMolDraw2D.MolDraw2DSVG(w, h)
    o = d.drawOptions()
    o.clearBackground = False
    o.padding = 0.0
    o.bondLineWidth = 3
    o.scaleBondWidth = False
    o.minFontSize = 30
    o.maxFontSize = 40
    o.fixedBondLength = 1.5 * PX_PER_UNIT
    o.highlightRadius = 0.38
    o.fillHighlights = True
    o.continuousHighlight = True
    o.explicitMethyl = style == "displayed"
    # muted, print-safe element colours (navy carbon, brick oxygen, blue nitrogen)
    o.updateAtomPalette({6: NAVY, 1: (0.30, 0.33, 0.42), 8: (0.72, 0.17, 0.13),
                         7: (0.10, 0.32, 0.72), 0: NAVY})
    colour = {a: (*GOLD, 0.55) for a in atoms}
    bcolour = {b: (*GOLD, 0.55) for b in bonds}
    rdMolDraw2D.PrepareAndDrawMolecule(d, mol, highlightAtoms=atoms, highlightBonds=bonds,
                                       highlightAtomColors=colour, highlightBondColors=bcolour)
    d.FinishDrawing()
    svg = d.GetDrawingText()
    svg = re.sub(r"<\?xml[^>]*\?>\s*", "", svg)
    svg = svg.replace("<!-- END OF HEADER -->", "")
    # let CSS size the drawing: keep the viewBox, drop the fixed pixel size
    svg = re.sub(r"width='\d+px' height='\d+px'", "", svg, count=1)
    return svg, w, h


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true", help="ignore the PubChem cache")
    args = ap.parse_args()
    SVG_DIR.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    fetch_pubchem(COMPOUNDS, cache, args.refresh)
    out = []
    for cid_key, query, cid, group, style, use, fact in COMPOUNDS:
        p = cache[str(cid)]
        if query.lower() not in (p["Title"].lower(), p["IUPACName"].lower()):
            print(f"  note: {cid_key}: asked for {query!r}, PubChem title is {p['Title']!r}")
        smiles = p.get("SMILES") or p.get("CanonicalSMILES") or p.get("IsomericSMILES")
        mol = Chem.MolFromSmiles(smiles)
        rd_formula = rdMolDescriptors.CalcMolFormula(mol)
        rd_mass = Descriptors.MolWt(mol)
        if rd_formula != p["MolecularFormula"]:
            raise SystemExit(f"{cid_key}: formula mismatch {rd_formula} vs {p['MolecularFormula']}")
        if abs(rd_mass - float(p["MolecularWeight"])) > 0.05:
            raise SystemExit(f"{cid_key}: mass mismatch {rd_mass:.2f} vs {p['MolecularWeight']}")
        keys = group.split("+")
        gname = " and ".join(GROUPS[k][0] if i == 0 else GROUPS[k][0].lower() for i, k in enumerate(keys))
        gnote = GROUPS[keys[0]][2] if len(keys) == 1 else "; ".join(GROUPS[k][2] for k in keys)
        svg, w, h = draw(mol, style, [GROUPS[k][1] for k in keys], aldehyde="aldehyde" in keys)
        (SVG_DIR / f"{cid_key}.svg").write_text(svg)
        display = cid_key.replace("-", " ").capitalize()
        out.append({
            "id": cid_key,
            "display": display,
            "aka": p["Title"] if p["Title"].lower() != display.lower() else None,
            "name": p["Title"],
            "iupac": p["IUPACName"],
            "formula": p["MolecularFormula"],
            "formula_html": formula_html(p["MolecularFormula"]),
            "molar_mass": round(float(p["MolecularWeight"]), 2),
            "smiles": smiles,
            "cid": p["CID"],
            "pubchem_url": f"https://pubchem.ncbi.nlm.nih.gov/compound/{p['CID']}",
            "group": gname,
            "group_key": group,
            "group_note": gnote,
            "style": style,
            "use": use,
            "fact": fact,
            "svg": f"data/molecules/{cid_key}.svg",
            "aspect": round(w / h, 3),
        })
        print(f"  {cid_key:16s} {p['MolecularFormula']:10s} {float(p['MolecularWeight']):7.2f}  CID {p['CID']}  {gname}")
    (DATA / "molecules.json").write_text(json.dumps({
        "source": "PubChem, U.S. National Library of Medicine (pubchem.ncbi.nlm.nih.gov); structures drawn with RDKit",
        "molecules": out}, indent=1, ensure_ascii=False))
    print(f"Wrote {len(out)} molecules to {DATA / 'molecules.json'}")


if __name__ == "__main__":
    main()
