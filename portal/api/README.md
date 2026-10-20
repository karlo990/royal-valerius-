# Crest Quest API (`/api/v1`)

> **Live server:** the Royal Crest hub in `karlissa/` (see `karlissa/SETUP.md`) implements this contract for real,
> with sign-in by admission number + parent's phone number, parent registration, the Control Room dashboard and backups.
> The portal uses it by default (`HUB` in `portal/js/config.js`); `?demo=1` switches back to the built-in demo data.

The contract between three pieces:

1. **The portal**: `/portal/` on the website (learners and parents).
2. **Kudzi the Crestbot**: the assistant inside the portal (and later the app).
3. **Royal Crest Connect**: the Android app, which can show the portal and receive pushes.

Files in this folder:

| File | What it is |
|---|---|
| `openapi.json` | The full spec (18 paths), generated from the reference server. Open it in [Swagger Editor](https://editor.swagger.io). |
| `reference_server.py` | A working FastAPI server for the whole contract, on demo data. It's the template for the real server. |
| `test_reference_server.py` | Contract tests: `pytest portal/api` |
| `demo-data.json` | The demo learners. They are exported from `portal/js/mock.js`, so the portal and the server show the same data. |

## Try the portal against a server

```bash
pip install fastapi uvicorn
cd portal/api && uvicorn reference_server:app --port 8000
# in another terminal, from the repo root
python3 -m http.server 8790
# then open
http://127.0.0.1:8790/portal/?api=http://127.0.0.1:8000
```

- **With no `?api=`** (or `API_BASE` empty in `portal/js/config.js`), the portal runs on its built-in demo data.
- **With a server set**, the "Demo" badge and demo buttons disappear and every call goes to the server.

## Endpoints

All of them need `Authorization: Bearer <token>` except `health` and `auth/login`.

| Method | Path | Used by |
|---|---|---|
| GET | `/api/v1/health` | uptime checks, the app's "test server" button |
| POST | `/api/v1/auth/login` `{role, identifier, pin}` → `{token, user}` | portal sign-in, app sign-in |
| POST | `/api/v1/auth/logout` | sign out |
| GET | `/api/v1/me` → `{role, name, students[]}` | who is signed in, and which learners they may see |
| GET | `/api/v1/students/{id}` | learner card: form, stream, house, XP, level, position |
| GET | `/api/v1/students/{id}/results?term=` | marks per subject: CA /40, exam /60, total, grade, comment, class average |
| GET | `/api/v1/students/{id}/attendance` | one row per school day: present / late / absent / excused |
| GET | `/api/v1/students/{id}/timetable` | Mon–Fri periods |
| GET | `/api/v1/students/{id}/assignments` | homework and due dates |
| GET | `/api/v1/students/{id}/skills` | the one-trade-per-year skill tree |
| GET | `/api/v1/students/{id}/fees` | termly fees, payments and balance |
| GET | `/api/v1/students/{id}/reports/{term}.pdf` | printable report (501 until the renderer exists) |
| GET | `/api/v1/notices` | school notices |
| POST | `/api/v1/crestbot/chat` `{student_id, message, history[], client}` → `{reply, actions[], suggestions[]}` | **Kudzi** |
| GET | `/api/v1/crestbot/suggestions?student_id=` | Kudzi's quick-question chips |
| POST | `/api/v1/crestbot/feedback` `{student_id, message, reply, helpful}` | thumbs up / down for training |
| POST | `/api/v1/devices` `{platform, push_token, student_ids[]}` | **app**: register for push notifications |
| GET | `/api/v1/sync?since=` → `{cursor, changes[]}` | **app**: delta feed for its offline cache |

**Access rule:** a user only ever sees their own learners. A parent sees each of their children, and a learner sees only themselves. Any other learner ID returns **404**, never 403, so IDs can't be probed. The tests cover this.

## Building the Crestbot server (Kudzi's AI brain)

1. **Keep the paths and shapes.** Copy `reference_server.py` into the Royal Crest Connect server as a router, or deploy it on its own.
2. **Replace `crestbot_reply()` with the AI model.** Give the model only the signed-in learner's data, from the same functions the endpoints use. Never send other learners' data.
3. **Return the same response shape:**
   ```json
   { "reply": "…", "actions": [{"label": "Open fees", "route": "#/fees"}], "suggestions": ["…"] }
   ```
   `actions` become buttons under the reply, and `route` is any portal page.
4. **The portal falls back automatically.** If `/crestbot/chat` fails, the portal answers with its own built-in brain (`portal/js/crestbot.js`), so Kudzi never goes silent.

## Connecting the Royal Crest Connect app

The app can open the portal in a WebView at `https://<site>/portal/?embed=app`. In that mode the sidebar and site links are hidden and app-style bottom tabs appear.

**App → portal:** native code calls JavaScript, or posts a message:

```js
window.RCPortal.setSession({ token, user })          // sign in once, in the app
window.RCPortal.navigate('fees')                      // open a page
window.RCPortal.ask('How is Tanaka doing?')           // open Kudzi with a question
postMessage({ type: 'rc-device', platform: 'android', push_token })   // → POST /api/v1/devices
```

**Portal → app:** messages go back through `window.AndroidBridge.postMessage(json)` (or `ReactNativeWebView`):

- `{type: 'rc-portal-ready', role, students}`
- `{type: 'rc-route', route}`

**Deep links** use `royalcrest://portal/<page>`; the fees page links to `royalcrest://portal/fees?student=<id>`.

**Fees data:** the real server should read balances from Royal Crest Connect's `fee_documents`, matched by admission number. That's the same data as its `GET /api/fees/balances`. Never ship the staff `RCA_API_KEY` to a browser or parent's phone: the portal API holds it server-side.

## Before real learner data goes in

- **PINs:** store PINs hashed (bcrypt or argon2), not in plain text, and rate-limit `/auth/login`.
- **Sessions:** use real session expiry and refresh.
- **CORS:** allow only the website's origin (`RC_PORTAL_ORIGINS`).
- **HTTPS:** serve the API over HTTPS only.
- **Records:** log who viewed which learner's records.
