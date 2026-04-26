from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import AnalyzeRequest, AnalyzeResponse
from app.orchestrator import analyze
from app.services.climateserv import ClimateServError

app = FastAPI(
    title="DroughtWatch API",
    description="Agricultural drought early warning for subsistence farmers in Afghanistan.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/demo", response_model=AnalyzeResponse)
def demo_endpoint() -> AnalyzeResponse:
    return AnalyzeResponse.model_validate(
        {
            "location": {"lat": 34.52, "lon": 69.18},
            "period": {"start": "2026-01-26", "end": "2026-04-26"},
            "data": {
                "rainfall": {
                    "latest": 1.2,
                    "mean_30d": 2.1,
                    "mean_window": 3.7,
                    "trend": "declining",
                    "sample_count": 90,
                },
                "ndvi": {
                    "latest": -0.4,
                    "mean_30d": -0.2,
                    "mean_window": 0.1,
                    "trend": "declining",
                    "sample_count": 90,
                },
                "soil_moisture": {
                    "latest": 0.11,
                    "mean_30d": 0.13,
                    "mean_window": 0.24,
                    "trend": "declining",
                    "sample_count": 90,
                },
            },
            "advice": {
                "risk_level": "high",
                "summary": (
                    "Rainfall and soil moisture are running well below the seasonal norm. "
                    "Vegetation stress is increasing, so fields may deteriorate quickly without intervention."
                ),
                "recommendations": [
                    "Prioritize irrigation for the most vulnerable plots and reduce water loss where possible.",
                    "Delay planting of water-intensive crops until conditions improve.",
                    "Monitor fields twice weekly for crop stress and prepare contingency feed or seed plans.",
                ],
            },
        }
    )
