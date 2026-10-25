"""Settings for the Royal Crest hub. Everything comes from environment variables
(Hugging Face: Space → Settings → Variables and secrets)."""
from __future__ import annotations

import os
from pathlib import Path

VERSION = "1.0.0"
HERE = Path(__file__).resolve().parent


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def _writable_dir() -> Path:
    """First folder we can write to. /data is the Hugging Face persistent disk when one is attached."""
    for cand in (_env("HUB_DATA_DIR"), "/data/royal-crest", str(HERE.parent / "hub-data"), "/tmp/royal-crest-hub"):
        if not cand:
            continue
        try:
            p = Path(cand)
            p.mkdir(parents=True, exist_ok=True)
            probe = p / ".write-test"
            probe.write_text("ok")
            probe.unlink()
            return p
        except OSError:
            continue
    raise RuntimeError("No writable data folder found")


DATA_DIR = _writable_dir()
DB_PATH = DATA_DIR / "school.db"
BACKUP_DIR = DATA_DIR / "backups"
STATE_FILE = DATA_DIR / "backup-state.json"
PERSISTENT_DISK = os.path.ismount("/data") and str(DATA_DIR).startswith("/data")

SCHOOL = {
    "name": _env("SCHOOL_NAME", "Royal Crest Academy"),
    "motto": "Science · Innovation · Skill",
    "address": "1226 Chinobva, Nyika, Masvingo, Zimbabwe",
    "email": "info@royalcrestacademy.com",
    "website": "https://www.royalcrestacademy.com",
    "phones": [
        {"label": "Director", "number": "+263 714 404 090"},
        {"label": "Admissions (T. Gama)", "number": "+263 773 602 547"},
        {"label": "Office (Juliana)", "number": "+263 785 979 583"},
    ],
}

# Sign-in and sessions
ADMIN_PASSWORD = _env("ADMIN_PASSWORD")          # break-glass password for the built-in "admin" owner account
SYNC_KEY = _env("SYNC_KEY")                      # lets the PC backup agent pull and restore backups
SESSION_DAYS = int(_env("SESSION_DAYS", "14") or 14)
STAFF_SESSION_HOURS = int(_env("STAFF_SESSION_HOURS", "12") or 12)

# Browser origins allowed to call /api/v1 (the portal on Vercel, the school domain, local testing)
PORTAL_ORIGINS = [o.strip().rstrip("/") for o in _env(
    "PORTAL_ORIGINS",
    "https://royalcrestzw.vercel.app,https://www.royalcrestacademy.com,https://royalcrestacademy.com,"
    "http://127.0.0.1:8790,http://localhost:8790",
).split(",") if o.strip()]

# Off-site backups: a private Hugging Face dataset repo, e.g. "Davincii-code/royal-crest-backups"
HF_TOKEN = _env("HF_TOKEN")
HF_BACKUP_REPO = _env("HF_BACKUP_REPO")
HF_PUSH_MINUTES = int(_env("HF_PUSH_MINUTES", "10") or 10)
KEEP_LOCAL_BACKUPS = int(_env("KEEP_LOCAL_BACKUPS", "40") or 40)

# Demo learners on an empty database (removable from the dashboard)
SEED_DEMO = _env("SEED_DEMO", "1") not in ("0", "false", "no")

# Kudzi's optional AI brain: "ollama" uses the model already running in this Space
KUDZI_LLM = _env("KUDZI_LLM", "off").lower()
KUDZI_LLM_URL = _env("KUDZI_LLM_URL", "http://127.0.0.1:11434/api/chat")
KUDZI_MODEL = _env("KUDZI_MODEL", _env("JARVIS_MODEL", "phi4-mini:3.8b-q4_K_M"))
KUDZI_LLM_TIMEOUT = float(_env("KUDZI_LLM_TIMEOUT", "45") or 45)

# Crest Slate (the maths canvas, /portal/slate/): the same local model, its own switch and limits
MATHS_LLM = _env("MATHS_LLM", KUDZI_LLM).lower()
MATHS_LLM_URL = _env("MATHS_LLM_URL", KUDZI_LLM_URL)
MATHS_MODEL = _env("MATHS_MODEL", KUDZI_MODEL)
MATHS_LLM_TIMEOUT = float(_env("MATHS_LLM_TIMEOUT", "110") or 110)
MATHS_PER_HOUR = int(_env("MATHS_PER_HOUR", "40") or 40)

# Caption Desk (/studio/captions/): Facebook/WhatsApp/Instagram captions from the same local model, staff only
CAPTIONS_LLM = _env("CAPTIONS_LLM", KUDZI_LLM).lower()
CAPTIONS_LLM_URL = _env("CAPTIONS_LLM_URL", KUDZI_LLM_URL)
CAPTIONS_MODEL = _env("CAPTIONS_MODEL", KUDZI_MODEL)
CAPTIONS_LLM_TIMEOUT = float(_env("CAPTIONS_LLM_TIMEOUT", "110") or 110)
CAPTIONS_PER_HOUR = int(_env("CAPTIONS_PER_HOUR", "60") or 60)
