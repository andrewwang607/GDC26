# DroughtWatch Backend API

Stateless Express + TypeScript API with one endpoint:

- `POST /api/alert`
- Frontend dashboard at `/` for visualizing API output

## Data sources

All upstream signals are pulled from NASA Earthdata via the CMR granule API
using `NASA_EARTHDATA_TOKEN`:

- Soil moisture: SMAP (`SPL3SMP_E`, `SPL3SMP`, `SPL3SMP_NRT_E`)
- Rainfall: GPM IMERG (`GPM_3IMERGDL`, `GPM_3IMERGDE`, `GPM_3IMERGDF`, `GPM_3IMERGM`)
- Vegetation: MODIS / VIIRS NDVI (`MOD13A3`, `MYD13A3`, `VNP13A3`)

Each service walks its collection list and uses the first available granule
(point-based CMR query). On full upstream failure the API returns a 503 with a
`failures` array describing which services were rejected.

## Setup

1. Copy `.env.example` to `.env` and set:
   - `NASA_EARTHDATA_TOKEN`
   - `GEMINI_API_KEY`
   - `PORT`
2. Install dependencies: `npm install`
3. Run in dev: `npm run dev`
4. Open: `http://localhost:3000/`
5. Build: `npm run build`

## Security

Never commit a real `.env`. If a token has been committed in this repo's
history, rotate it immediately and force-rewrite the offending file.


## DroughtWatch — Tech Stack
Architecture
flowchart TB
    User([Browser / Client])

    subgraph Frontend["Frontend (static, served by Express)"]
        HTML["public/index.html<br/>public/main.js"]
    end

    subgraph Backend["Backend - Node.js + TypeScript"]
        Express["Express 5<br/>+ express-rate-limit<br/>+ dotenv"]

        subgraph Routes["Routes"]
            AlertR["POST /api/alert"]
            SolR["POST /api/solutions"]
            Health["GET /health"]
        end

        subgraph Services["Services layer"]
            Orchestrate["orchestrate.ts<br/>Promise.allSettled + timeout"]
            CMR["cmr.ts<br/>granule lookup helper"]
            SMAP["smap.ts"]
            Rain["rainfall.ts"]
            NDVI["ndvi.ts"]
            Interp["interpreter.ts<br/>Gemini prompts + JSON parse"]
        end

        Config["config/thresholds.ts<br/>alert + NDVI thresholds,<br/>rate-limit, timeouts"]
    end

    subgraph External["External APIs"]
        NASA["NASA Earthdata CMR<br/>SMAP / GPM IMERG / MODIS-VIIRS NDVI<br/>Bearer: NASA_EARTHDATA_TOKEN"]
        Gemini["Google Gemini<br/>gemini-2.0-flash<br/>GEMINI_API_KEY"]
    end

    subgraph Tooling["Build / Dev tooling"]
        TS["TypeScript 6"]
        TSNode["ts-node (dev)"]
        NPM["npm scripts:<br/>dev / build / start"]
    end

    User -->|HTTP| Express
    Express --> HTML
    Express --> Routes

    AlertR --> Orchestrate
    SolR --> Orchestrate
    AlertR --> Interp
    SolR --> Interp

    Orchestrate --> SMAP
    Orchestrate --> Rain
    Orchestrate --> NDVI

    SMAP --> CMR
    Rain --> CMR
    NDVI --> CMR

    CMR -->|axios| NASA
    Interp -->|@google/generative-ai| Gemini

    Routes -.reads.-> Config
    Orchestrate -.reads.-> Config
Components
Runtime
Layer	Tech
Language	TypeScript 6 (target ES2021, Node16 modules)
Runtime	Node.js
HTTP framework	Express 5
Rate limiting	express-rate-limit
Config	dotenv
HTTP client	axios
AI SDK	@google/generative-ai
GeoTIFF parsing	geotiff (available, currently unused)
Dev / Build
Tool	Purpose
ts-node	Dev server (npm run dev)
tsc	Production build → dist/ (npm run build)
@types/express, @types/node	Type definitions
External APIs
Service	Purpose	Auth
NASA Earthdata CMR	Granule discovery for SMAP, GPM IMERG, MODIS/VIIRS NDVI	NASA_EARTHDATA_TOKEN (Bearer)
Google Gemini (gemini-2.0-flash)	Generates farmer-facing advisories + translations	GEMINI_API_KEY
Endpoints
Method	Path	Purpose
GET	/health	Liveness probe
GET	/	Static dashboard (public/)
POST	/api/alert	Alert level + AI advisory
POST	/api/solutions	Detailed effects + interventions
Data sources (NASA collections)
Soil moisture (SMAP): SPL3SMP_E, SPL3SMP, SPL3SMP_NRT_E
Rainfall (GPM IMERG): GPM_3IMERGDL, GPM_3IMERGDE, GPM_3IMERGDF, GPM_3IMERGM
Vegetation (MODIS/VIIRS NDVI): MOD13A3, MYD13A3, VNP13A3
Each service walks its collection list and uses the first available granule (point-based CMR query). On full upstream failure the API returns 503 with a failures array.

Supported advisory languages
Dari, Pashto, Arabic, French, Amharic, Somali, Hausa, Tigrinya
