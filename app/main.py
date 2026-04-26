from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from app.models import AnalyzeRequest, AnalyzeResponse
from app.orchestrator import analyze
from app.services.climateserv import ClimateServError

app = FastAPI(
    title="DroughtWatch API",
    description="Agricultural drought early warning for subsistence farmers in Afghanistan.",
    version="0.1.0",
)


@app.get("/health", response_model=dict)
def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_endpoint(req: AnalyzeRequest) -> AnalyzeResponse:
    try:
        return analyze(req)
    except ClimateServError as e:
        raise HTTPException(status_code=502, detail=f"ClimateSERV error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
