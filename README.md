# CropContract — Project Nova

Offline-first React PWA connecting Sri Lankan smallholder farmers with commercial
buyers through pre-planting contracts, plus AI crop disease detection.
**Standalone build — no Docker / WSL / Postgres.** FastAPI keeps state in-memory.

Flow: *Know demand → Secure contract → AI crop monitoring → Harvest → Delivery & pay*

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · Vite · Tailwind · Framer Motion · Recharts · Lucide |
| Offline | vite-plugin-pwa (Workbox SW) · IndexedDB outbox (`idb`) · `/sync` replay |
| i18n | i18next — English / සිංහල / தமிழ் |
| Backend | FastAPI · PyJWT · passlib(bcrypt) · Pillow heuristic inference |
| ML | `services/disease_model.py` loads PyTorch weights when available, else falls back to colour-statistics classifier |

## Run it

**Backend** (port 8000):
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (port 5173):
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Demo accounts (password: `demo1234`)
- `farmer@demo.lk` — commits to contracts, leaf scans
- `buyer@demo.lk` — posts contracts, fulfillment analytics
- `officer@demo.lk` — reviews flagged scans, outbreak watch

## API routes

```
POST /auth/register        POST /auth/login
GET  /contracts            POST /contracts
GET  /contracts/{id}       POST /contracts/{id}/commit
GET  /commitments/mine     POST /disease-scan
GET  /scans/mine           GET  /scans/flagged   POST /scans/{id}/review
POST /sync                 GET  /health
```

## Offline behaviour

Commitments and leaf scans made offline are stored in an IndexedDB outbox.
On reconnect the app batch-posts them to `POST /sync`; every action carries a
`client_action_id` so replays are answered idempotently — no duplicate commits.

## Design system

Emerald agri-tech palette: bg `#061912` · surface `#102A20` · emerald `#10B981`
· mint `#34D399` · gold `#F59E0B` · alert `#EF4444`. Space Grotesk display,
Noto Sans body (+ Sinhala/Tamil).

---
Team MB SPARTANS · Saegis Campus
