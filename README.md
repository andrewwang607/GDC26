# GDC26

Full-stack DroughtWatch prototype with:

- a FastAPI backend in `app/`
- a Vite + React frontend in `src/`

## Local Development

Backend:

```bash
python3 -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
npm install
npm run dev
```

## Environment

Create `.env` for backend settings and API keys. See `.env.example` for the expected variables.
