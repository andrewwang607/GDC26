from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Any

import requests

from app.config import get_settings


class OpenMeteoError(RuntimeError):
    pass


def _request(params: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    url = f"{settings.open_meteo_base_url}/archive"
    try:
      resp = requests.get(url, params=params, timeout=20)
    except requests.RequestException as e:
      raise OpenMeteoError(f"request failed: {e}") from e
    if resp.status_code != 200:
      raise OpenMeteoError(f"request HTTP {resp.status_code}: {resp.text[:200]}")
    try:
      body = resp.json()
    except ValueError as e:
      raise OpenMeteoError(f"response non-JSON: {resp.text[:200]}") from e
    if body.get("error"):
      raise OpenMeteoError(body.get("reason", "unknown Open-Meteo error"))
    return body


def fetch_precipitation(lat: float, lon: float, start: date, end: date) -> list[dict[str, Any]]:
    body = _request(
        {
            "latitude": lat,
            "longitude": lon,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "daily": "precipitation_sum",
            "timezone": "GMT",
        }
    )
    daily = body.get("daily", {})
    times = daily.get("time", [])
    values = daily.get("precipitation_sum", [])
    rows: list[dict[str, Any]] = []
    for t, value in zip(times, values):
        rows.append(
            {
                "date": t,
                "raw_value": value,
                "NaN": 0 if value is not None else 100,
            }
        )
    return rows


def fetch_soil_moisture(lat: float, lon: float, start: date, end: date) -> list[dict[str, Any]]:
    body = _request(
        {
            "latitude": lat,
            "longitude": lon,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "hourly": "soil_moisture_0_to_7cm",
            "timezone": "GMT",
        }
    )
    hourly = body.get("hourly", {})
    times = hourly.get("time", [])
    values = hourly.get("soil_moisture_0_to_7cm", [])

    buckets: dict[str, list[float]] = defaultdict(list)
    for t, value in zip(times, values):
        if value is None:
            continue
        buckets[t.split("T", 1)[0]].append(value)

    rows: list[dict[str, Any]] = []
    for day in sorted(buckets):
        vals = buckets[day]
        rows.append(
            {
                "date": day,
                "raw_value": sum(vals) / len(vals),
                "NaN": 0,
            }
        )
    return rows
