from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from typing import Any, Callable

from app.models import (
    AnalyzeRequest,
    AnalyzeResponse,
    Advice,
    DataBlock,
    DatasetSummary,
    Location,
    Period,
    Trend,
)
from app.services import climateserv as cs
from app.services.gemini import GeminiError, generate_advice

# ESI lags ~10 months and LIS soil moisture ~7 months on ClimateSERV (verified 2025-04).
# If a fetch returns no valid data for the requested window, we shift the window
# back in FALLBACK_STEP_DAYS increments up to FALLBACK_MAX_SHIFTS times.
FALLBACK_STEP_DAYS = 90
FALLBACK_MAX_SHIFTS = 5


FetchFn = Callable[[float, float, date, date], list[dict[str, Any]]]


def _fetch_with_fallback(
    fn: FetchFn,
    lat: float,
    lon: float,
    start: date,
    end: date,
) -> list[dict[str, Any]]:
    """Fetch a dataset, shifting the window backward until data is returned."""
    for shift in range(FALLBACK_MAX_SHIFTS + 1):
        offset = timedelta(days=shift * FALLBACK_STEP_DAYS)
        rows = fn(lat, lon, start - offset, end - offset)
        valid = [r for r in rows if r.get("NaN", 100) < 50]
        if valid:
            return rows
    return []


def _summarize(rows: list[dict[str, Any]]) -> DatasetSummary:
    valid = [r["raw_value"] for r in rows if r.get("NaN", 100) < 50 and r["raw_value"] is not None]
    if not valid:
        return DatasetSummary(
            latest=None, mean_30d=None, mean_window=None,
            trend="unknown", sample_count=0,
        )

    latest = valid[-1]
    mean_window = sum(valid) / len(valid)
    tail = valid[-min(30, len(valid)):]
    mean_30d = sum(tail) / len(tail)

    # Trend: compare last-third vs first-third of the valid series.
    n = len(valid)
    third = max(1, n // 3)
    early_mean = sum(valid[:third]) / third
    late_mean = sum(valid[-third:]) / third
    delta = late_mean - early_mean
    threshold = abs(early_mean) * 0.05 if early_mean != 0 else 0.01
    if delta > threshold:
        trend: Trend = "rising"
    elif delta < -threshold:
        trend = "declining"
    else:
        trend = "flat"

    return DatasetSummary(
        latest=latest,
        mean_30d=mean_30d,
        mean_window=mean_window,
        trend=trend,
        sample_count=len(valid),
    )


def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    end = date.today()
    start = end - timedelta(days=req.days)

    # Fire all three ClimateSERV fetches concurrently (requests is sync → threadpool).
    fetches: dict[str, tuple[FetchFn, float, float, date, date]] = {
        "rainfall": (cs.fetch_chirps, req.lat, req.lon, start, end),
        "ndvi": (cs.fetch_esi, req.lat, req.lon, start, end),
        "soil_moisture": (cs.fetch_soil_moisture, req.lat, req.lon, start, end),
    }
    raw: dict[str, list[dict[str, Any]]] = {}

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {
            pool.submit(_fetch_with_fallback, fn, lat, lon, s, e): key
            for key, (fn, lat, lon, s, e) in fetches.items()
        }
        for future in as_completed(futures):
            key = futures[future]
            try:
                raw[key] = future.result()
            except cs.ClimateServError:
                raw[key] = []

    data = DataBlock(
        rainfall=_summarize(raw.get("rainfall", [])),
        ndvi=_summarize(raw.get("ndvi", [])),
        soil_moisture=_summarize(raw.get("soil_moisture", [])),
    )

    location_d = {"lat": req.lat, "lon": req.lon}
    period_d = {"start": str(start), "end": str(end)}
    datasets_d = {
        "rainfall": data.rainfall.model_dump(),
        "ndvi": data.ndvi.model_dump(),
        "soil_moisture": data.soil_moisture.model_dump(),
    }

    try:
        advice_raw = generate_advice(location_d, period_d, datasets_d)
        advice = Advice(
            risk_level=advice_raw.get("risk_level", "unknown"),
            summary=advice_raw.get("summary", ""),
            recommendations=advice_raw.get("recommendations", []),
        )
    except GeminiError as e:
        advice = Advice(
            risk_level="unknown",
            summary=f"AI advice unavailable: {e}",
            recommendations=[],
        )

    return AnalyzeResponse(
        location=Location(lat=req.lat, lon=req.lon),
        period=Period(start=start, end=end),
        data=data,
        advice=advice,
    )
