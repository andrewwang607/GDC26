from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError, wait
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

# ClimateSERV can be both slow and stale for some datasets. To keep the API
# responsive enough for the dashboard, we pre-shift lagging datasets backward
# and enforce an overall fetch budget so partial data can still be returned.
FALLBACK_STEP_DAYS = 90
ANALYSIS_FETCH_BUDGET_S = 35
ADVICE_TIMEOUT_S = 12

DATASET_FETCH_CONFIG: dict[str, dict[str, Any]] = {
    "rainfall": {"fn": cs.fetch_chirps, "lag_days": 0, "max_shifts": 0},
    "ndvi": {"fn": cs.fetch_esi, "lag_days": 365, "max_shifts": 4},
    "soil_moisture": {"fn": cs.fetch_soil_moisture, "lag_days": 365, "max_shifts": 4},
}


FetchFn = Callable[[float, float, date, date], list[dict[str, Any]]]


def _fetch_with_fallback(
    fn: FetchFn,
    lat: float,
    lon: float,
    start: date,
    end: date,
    lag_days: int = 0,
    max_shifts: int = 0,
) -> list[dict[str, Any]]:
    """Fetch a dataset, shifting the window backward until data is returned."""
    for shift in range(max_shifts + 1):
        offset = timedelta(days=lag_days + shift * FALLBACK_STEP_DAYS)
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


def _build_fallback_advice(data: DataBlock, reason: str | None = None) -> Advice:
    sample_count = (
        data.rainfall.sample_count
        + data.ndvi.sample_count
        + data.soil_moisture.sample_count
    )
    if sample_count == 0:
        summary = (
            "Live environmental datasets were unavailable before the request deadline. "
            "The dashboard returned without satellite metrics so you can retry quickly."
        )
        recommendations = [
            "Retry in a few minutes when external data services are less busy.",
            "Use demo mode or cached field observations if you need a quick preview now.",
        ]
        risk_level = "unknown"
    else:
        summary = (
            "Some live datasets were delayed, so this response uses the partial satellite data "
            "that arrived within the request budget."
        )
        recommendations = [
            "Treat missing metrics as unavailable rather than normal conditions.",
            "Retry later to refresh the full rainfall, soil moisture, and vegetation picture.",
        ]
        risk_level = "moderate"

    if reason:
        summary = f"{summary} {reason}"

    return Advice(
        risk_level=risk_level,
        summary=summary,
        recommendations=recommendations,
    )


def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    end = date.today()
    start = end - timedelta(days=req.days)

    raw: dict[str, list[dict[str, Any]]] = {}
    pool = ThreadPoolExecutor(max_workers=3)
    try:
        futures = {
            pool.submit(
                _fetch_with_fallback,
                config["fn"],
                req.lat,
                req.lon,
                start,
                end,
                config["lag_days"],
                config["max_shifts"],
            ): key
            for key, config in DATASET_FETCH_CONFIG.items()
        }
        done, pending = wait(futures, timeout=ANALYSIS_FETCH_BUDGET_S)

        for future in done:
            key = futures[future]
            try:
                raw[key] = future.result()
            except cs.ClimateServError:
                raw[key] = []

        for future in pending:
            raw[futures[future]] = []
            future.cancel()
    finally:
        pool.shutdown(wait=False, cancel_futures=True)

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

    if (
        data.rainfall.sample_count == 0
        and data.ndvi.sample_count == 0
        and data.soil_moisture.sample_count == 0
    ):
        advice = _build_fallback_advice(data)
    else:
        try:
            with ThreadPoolExecutor(max_workers=1) as advice_pool:
                future = advice_pool.submit(generate_advice, location_d, period_d, datasets_d)
                advice_raw = future.result(timeout=ADVICE_TIMEOUT_S)
            advice = Advice(
                risk_level=advice_raw.get("risk_level", "unknown"),
                summary=advice_raw.get("summary", ""),
                recommendations=advice_raw.get("recommendations", []),
            )
        except FuturesTimeoutError:
            advice = _build_fallback_advice(data, "AI advice timed out.")
        except GeminiError as e:
            advice = _build_fallback_advice(data, f"AI advice unavailable: {e}")

    return AnalyzeResponse(
        location=Location(lat=req.lat, lon=req.lon),
        period=Period(start=start, end=end),
        data=data,
        advice=advice,
    )
