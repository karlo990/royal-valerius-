# Royal Crest hub on the Karlissa Space

The hub runs inside the existing **Davincii-code/Karlissa** Space, next to the ATLAS
worker (which keeps working unchanged). After deploying:

| Address | What |
|---|---|
| `https://davincii-code-karlissa.hf.space/admin` | **Control Room**: the live dashboard for staff |
| `https://davincii-code-karlissa.hf.space/api/v1/...` | API for the Crest Quest portal and the Royal Crest Connect app |
| `https://royalcrestzw.vercel.app/portal/` | Crest Quest portal (parents and learners) |

## 1. Upload the Space files
Unzip `karlissa-space-upload.zip`. On huggingface.co open the Space → **Files** →
**Add file → Upload files**, drag in everything (including the `hub` folder) and commit.
Or with git:
```
git clone https://huggingface.co/spaces/Davincii-code/Karlissa
# copy the unzipped files over it
git add -A && git commit -m "Add Royal Crest hub" && git push
```

## 2. Add secrets (Space → Settings → Variables and secrets)
| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | your Control Room password (username `admin`) |
| `SYNC_KEY` | a long random string; the school PC agent uses it |
| `HF_TOKEN` | a Hugging Face **write** token (huggingface.co/settings/tokens) |
| `HF_BACKUP_REPO` | `Davincii-code/royal-crest-backups` (created private automatically) |
| `KUDZI_LLM` (optional) | `ollama` lets Kudzi use this Space's phi4-mini for open questions |

The Space is public, so all of these must be **secrets**, never written into files.

## 3. Persistent memory
Free Spaces lose their disk on restart. The hub keeps its memory three ways:
1. a backup zip on the Space a minute after every change;
2. a copy in the private HF dataset `HF_BACKUP_REPO`, restored automatically on boot;
3. the school PC agent (`karlissa-pc-sync.zip`), which saves every new zip into a
   Google Drive for desktop folder and, when the PC starts, puts the newest data back
   if the Space came back empty or older.

Endpoints (header `X-Sync-Key`, or a staff sign-in):
`GET /api/v1/admin/backup/status` · `GET /api/v1/admin/backup/export` (zip of everything) ·
`PUT /api/v1/admin/backup/restore` (zip as the body).

## 4. Sign-in for families
- **Username:** the learner's admission number (e.g. `RCA-27-0142`).
- **Password:** the parent's phone number, as the school has it, in any format.
- Parents can change it on the portal. Then phone number + own password also works.
- Parents who are new register on the portal. Staff approve them under **Registrations**,
  and the details then appear on the portal.

Before real learners go in: remove the demo data (Control Room → Settings).
