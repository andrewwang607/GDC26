from __future__ import annotations

import hashlib
import random
from datetime import date, timedelta

from app.models import DatasetSummary, Trend


def _rng(label: str, lat: float, lon: float) -> random.Random:
    key = f"{label}:{lat:.4f}:{lon:.4f}"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return random.Random(int(digest[:16], 16))


def _series(label: str, lat: float, lon: float, start: date, end: date) -> list[float]:
    rng = _rng(label, lat, lon)
    values: list[float] = []
    current = start
    phase = rng.uniform(0, 6.28)
    trend = rng.uniform(-0.0015, 0.0015)

    while current <= end:
        day_index = (current - start).days
        seasonal = 0.5 + 0.5 * __import__("math").sin((current.timetuple().tm_yday / 365.0) * 6.28 + phase)
        noise = rng.uniform(-0.08, 0.08)

        if label == "rainfall":
            burst = rng.uniform(0, 6) if rng.random() < 0.18 else 0
            value = max(0.0, seasonal * 2.2 + burst + noise + day_index * trend)
        elif label == "soil_moisture":
            value = min(0.38, max(0.06, 0.12 + seasonal * 0.12 + noise * 0.3 + day_index * trend))
        else:
            value = min(0.88, max(0.12, 0.32 + seasonal * 0.28 + noise * 0.5 + day_index * trend))

        values.append(value)
        current += timedelta(days=1)

    return values


def _trend(values: list[float]) -> Trend:
    if not values:
        return "unknown"
    third = max(1, len(values) // 3)
    early_mean = sum(values[:third]) / third
    late_mean = sum(values[-third:]) / third
    delta = late_mean - early_mean
    threshold = abs(early_mean) * 0.05 if early_mean != 0 else 0.01
    if delta > threshold:
        return "rising"
    if delta < -threshold:
        return "declining"
    return "flat"


def generate_dataset_summary(label: str, lat: float, lon: float, start: date, end: date) -> DatasetSummary:
    values = _series(label, lat, lon, start, end)
    tail = values[-min(30, len(values)) :]
    return DatasetSummary(
        latest=values[-1] if values else None,
        mean_30d=sum(tail) / len(tail) if tail else None,
        mean_window=sum(values) / len(values) if values else None,
        trend=_trend(values),
        sample_count=len(values),
    )
