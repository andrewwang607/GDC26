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
