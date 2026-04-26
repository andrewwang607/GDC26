# DroughtWatch — Claude Code Context File

## What this project is

DroughtWatch is a humanitarian field tool that gives NGO workers real-time agricultural drought alerts for subsistence farming regions, starting with Afghanistan and the Sahel. A field worker inputs a GPS location and crop type. The system pulls three live satellite data signals, scores them against a 5-year historical baseline, and returns a plain-language alert — in English and Dari — telling the worker exactly what is happening and what the farmer should do about it.

This is not a consumer product. It is a tool used in the field, often on a phone, sometimes in areas with slow connectivity. Every design and engineering decision should reflect that context.

---

## The problem being solved

Smallholder farmers in crisis regions have no early warning before a drought destroys their season. By the time conditions are visibly bad, it is already too late to switch crops, seek emergency aid, or migrate. Existing systems like FEWS NET publish regional monthly reports — DroughtWatch makes the same underlying data available per-farm, on-demand, in local language, through a tool an NGO field worker can use without an agronomy background.

---

## Project structure

```
droughtwatch/
├── CLAUDE.md                        # This file
├── inspo/                           # Design reference files for the dashboard
├── droughtwatch-frontend/           # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx                  # Router setup only
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Landing page
│   │   │   └── Dashboard.jsx        # Dashboard page
│   │   ├── components/
│   │   │   ├── AlertBanner.jsx      # Top alert strip
│   │   │   ├── SignalCard.jsx       # Per-signal card (soil / rainfall / NDVI)
│   │   │   ├── CropSelector.jsx     # Five crop pill buttons
│   │   │   ├── ActionsPanel.jsx     # Recommended actions list
│   │   │   └── SkeletonDashboard.jsx
│   │   └── hooks/
│   │       └── useAnalyze.js        # All fetch logic lives here
└── droughtwatch-backend/            # Python + FastAPI
    ├── main.py                      # FastAPI app, endpoints, CORS
    ├── data_fetcher.py              # All ClimateSERV calls
    ├── scorer.py                    # Anomaly math and alert classification
    ├── ai_layer.py                  # Claude API prompt and response parsing
    ├── demo_response.json           # Pre-saved fallback response for demo
    ├── .env                         # API keys — never commit this
    └── requirements.txt
```

---

## Tech stack

### Frontend
- React 18 with functional components and hooks only — no class components
- Vite as the build tool
- Tailwind CSS for all styling — no component libraries (no shadcn, MUI, or Chakra)
- React Router for navigation between landing page and dashboard
- No inline styles except where Tailwind cannot express something

### Backend
- Python 3.11+
- FastAPI for the API layer
- `climateserv` Python package for all satellite data (SMAP, CHIRPS, NDVI)
- `anthropic` Python SDK for the Claude API
- `python-dotenv` for environment variable loading
- No database — every request is stateless

---

## Backend architecture

### Data sources (all free, no scraping)

| Signal | Source | Dataset ID | What it measures |
|---|---|---|---|
| Soil moisture | NASA SMAP | `38` | Surface soil water content |
| Rainfall | CHIRPS | `0` | Precipitation anomaly |
| Vegetation health | eMODIS NDVI Central Asia | `28` | Greenness / crop health |

All three are accessed through the single `climateserv` Python package. Do not add separate API integrations for these — ClimateSERV wraps all three.

### Scoring logic

For each signal, fetch 90 days of current data and the same 90-day calendar window for each of the past 5 years. Compute `pct_of_normal = current / historical_mean * 100`.

Alert thresholds:

| Signal | Watch | Act Now |
|---|---|---|
| Soil moisture | below 70% | below 50% |
| Rainfall | below 75% | below 50% |
| NDVI | below 80% | below 60% |

Overall alert level:
- Any single signal at `act_now` → overall `act_now`
- Two or more signals at `watch` → overall `act_now`
- One signal at `watch` → overall `watch`
- All normal → overall `normal`

### AI layer

The Claude API (`claude-sonnet-4-6`) takes the signal scores and crop type and returns a plain-language explanation plus three recommended actions, in both English and Dari. The AI only generates the human-readable output — all scoring logic is deterministic Python, not AI.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Confirms server is running and API key is loaded |
| `POST` | `/analyze` | Main endpoint — takes lat, lon, crop, returns full alert |
| `GET` | `/demo` | Returns pre-saved `demo_response.json` instantly — fallback for demo day |

### Request body for `/analyze`

```json
{
  "lat": 34.52,
  "lon": 69.18,
  "crop": "wheat"
}
```

Valid crop values: `wheat`, `maize`, `sorghum`, `cotton`, `rice`

### Response shape (contract shared with frontend)

```json
{
  "alert_level": "watch",
  "signals": {
    "soil_moisture": {
      "current": 0.18,
      "historical_mean": 0.27,
      "pct_of_normal": 67,
      "level": "watch"
    },
    "rainfall": {
      "current": 12.4,
      "historical_mean": 18.1,
      "pct_of_normal": 69,
      "level": "watch"
    },
    "ndvi": {
      "current": 0.31,
      "historical_mean": 0.38,
      "pct_of_normal": 82,
      "level": "normal"
    }
  },
  "crop": "wheat",
  "english_explanation": "...",
  "english_actions": ["...", "...", "..."],
  "dari_explanation": "...",
  "dari_actions": ["...", "...", "..."]
}
```

---

## Frontend architecture

### Landing page (`/`)

Full-viewport desertification backdrop — lush green transitioning to arid desert, left to right. Centred title `DroughtWatch` in bold. Single `Find My Location` button that calls `navigator.geolocation.getCurrentPosition()`, then navigates to `/dashboard?lat=...&lon=...`. On geolocation failure, navigates to `/dashboard?lat=34.52&lon=69.18` with a toast noting it defaulted to Kabul.

### Dashboard page (`/dashboard`)

Reads `lat` and `lon` from URL query params. Calls `POST /analyze` on mount with default crop `wheat`. Renders:

- Alert banner (full width, colour-coded green / amber / red by alert level)
- Three signal cards (soil moisture, rainfall, NDVI) each showing percentage of normal and a coloured bar
- Crop selector (five pill buttons — re-fires API call on change)
- Actions panel (three recommended actions as a numbered list)
- Language toggle (English / Dari) — swaps explanation and actions text, no re-fetch
- Current coordinates and data window displayed in the header
- Full skeleton loading state while the API call is in flight (10–20 seconds is normal)

### The `useAnalyze` hook

All fetch logic lives in `src/hooks/useAnalyze.js`. No raw `fetch()` calls inside JSX or page components. The hook exposes `{ data, loading, error, refetch }`.

---

## Design principles

**This is a field tool, not a tech dashboard.** Resist the temptation to make it look like a SaaS analytics product. It should feel clear, trustworthy, and usable under stress by someone who may not be technical.

- Mobile-first — minimum 375px viewport, fully usable on a phone
- High contrast — field workers use this in direct sunlight
- No decorative complexity — every element earns its place
- Alert colours are semantic and consistent: green = normal, amber = watch, red = act now. Never use these colours for anything else.
- The inspo files in `/inspo` define the visual language for the dashboard. Follow them.
- Dari text renders right-to-left — use `dir="rtl"` on any container showing Dari content

---

## Environment variables

```
# droughtwatch-backend/.env
ANTHROPIC_API_KEY=your_key_here
```

Never commit `.env`. It is in `.gitignore`.

---

## Running locally

### Backend
```bash
cd droughtwatch-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on http://localhost:8000
```

### Frontend
```bash
cd droughtwatch-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Critical rules for Claude Code

- Read every file in `inspo/` before touching any frontend code. The dashboard design is defined there.
- Do not change the `/analyze` response shape — the frontend and backend are both built around it.
- Do not add a database. This app is intentionally stateless.
- Do not install component libraries. Tailwind only.
- Do not use `any` TypeScript types if TypeScript is ever added — keep types strict.
- The `GET /demo` endpoint must always work even if ClimateSERV is down. It reads from `demo_response.json`, nothing else.
- ClimateSERV calls are slow (10–20 seconds). Never remove the skeleton loading state or the 60-second timeout handler.
- When in doubt about a design decision, refer to `inspo/` first, then this file, then ask.