from __future__ import annotations

import json
import time
from datetime import date
from typing import Any

import requests

from app.config import get_settings

# Dataset IDs verified against ClimateSERV live API (2025-04).
# eMODIS NDVI (28) and USDA SMAP (38) both ended coverage in 2022 and return
# empty results. Substitutes below have confirmed daily data through 2024.
CHIRPS_DATASET_ID = 0           # UCSB CHIRPS Rainfall — daily, 1981–near present
ESI_DATASET_ID = 29             # SPoRT Evaporative Stress Index 4-week — weekly, 2000–present
                                # Negative ESI = vegetation more water-stressed than normal
LIS_SOIL_MOISTURE_ID = 664      # LIS-Modeled Soil Moisture 0-10cm — daily, 2000–near present

OPERATION_AVERAGE = 5
INTERVAL_DAILY = 0


class ClimateServError(RuntimeError):
    pass


def point_to_polygon(lat: float, lon: float, buffer_deg: float = 0.05) -> dict[str, Any]:
    """Build a small GeoJSON polygon centered on (lat, lon).

    ClimateSERV expects a polygon, not a point. The buffer (~5 km at the equator)
    is small enough to represent a single farm/village while still returning data.
    """
    b = buffer_deg
    return {
        "type": "Polygon",
        "coordinates": [[
            [lon - b, lat - b],
            [lon + b, lat - b],
            [lon + b, lat + b],
            [lon - b, lat + b],
            [lon - b, lat - b],
        ]],
    }


def _fmt_date(d: date) -> str:
    return d.strftime("%m/%d/%Y")


def submit_job(
    dataset_id: int,
    geometry: dict[str, Any],
    start: date,
    end: date,
    operation: int = OPERATION_AVERAGE,
) -> str:
    settings = get_settings()
    payload = {
        "datatype": dataset_id,
        "begintime": _fmt_date(start),
        "endtime": _fmt_date(end),
        "intervaltype": INTERVAL_DAILY,
        "operationtype": operation,
        "geometry": geometry,
    }
    url = f"{settings.climateserv_base_url}/submitDataRequest/"
    # ClimateSERV accepts both form-encoded and JSON; the documented form uses
    # geometry as a JSON string in a form field.
    form = {
        "datatype": str(dataset_id),
        "begintime": _fmt_date(start),
        "endtime": _fmt_date(end),
        "intervaltype": str(INTERVAL_DAILY),
        "operationtype": str(operation),
        "geometry": json.dumps(geometry),
    }
    try:
        resp = requests.post(url, data=form, timeout=30)
    except requests.RequestException as e:
        raise ClimateServError(f"submit failed: {e}") from e
    if resp.status_code != 200:
        raise ClimateServError(f"submit HTTP {resp.status_code}: {resp.text[:200]}")
    body = resp.text.strip().strip('"').strip("[]").strip('"')
    if not body or body.lower() in {"null", "none"}:
        raise ClimateServError(f"submit returned empty job id: {resp.text!r} payload={payload}")
    return body


def poll_job(job_id: str, timeout_s: int = 120, interval_s: float = 1.5) -> None:
    settings = get_settings()
    url = f"{settings.climateserv_base_url}/getDataRequestProgress/"
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            resp = requests.get(url, params={"id": job_id}, timeout=15)
        except requests.RequestException as e:
            raise ClimateServError(f"poll failed: {e}") from e
        if resp.status_code != 200:
            raise ClimateServError(f"poll HTTP {resp.status_code}: {resp.text[:200]}")
        text = resp.text.strip().strip("[]").strip('"')
        try:
            progress = float(text)
        except ValueError:
            raise ClimateServError(f"poll returned non-numeric: {resp.text!r}")
        if progress >= 100:
            return
        time.sleep(interval_s)
    raise ClimateServError(f"job {job_id} timed out after {timeout_s}s")


def fetch_results(job_id: str) -> list[dict[str, Any]]:
    settings = get_settings()
    url = f"{settings.climateserv_base_url}/getDataFromRequest/"
    try:
        resp = requests.get(url, params={"id": job_id}, timeout=30)
    except requests.RequestException as e:
        raise ClimateServError(f"results fetch failed: {e}") from e
    if resp.status_code != 200:
        raise ClimateServError(f"results HTTP {resp.status_code}: {resp.text[:200]}")
    try:
        body = resp.json()
    except ValueError as e:
        raise ClimateServError(f"results non-JSON: {resp.text[:200]}") from e
    # ClimateSERV nests the array under "data" inside a single-element list.
    if isinstance(body, list) and body and isinstance(body[0], dict) and "data" in body[0]:
        return body[0]["data"]
    if isinstance(body, dict) and "data" in body:
        return body["data"]
    if isinstance(body, list):
        return body
    raise ClimateServError(f"unexpected results shape: {str(body)[:200]}")


def fetch_dataset(
    dataset_id: int,
    lat: float,
    lon: float,
    start: date,
    end: date,
) -> list[dict[str, Any]]:
    geom = point_to_polygon(lat, lon)
    job = submit_job(dataset_id, geom, start, end)
    poll_job(job)
    return fetch_results(job)


def fetch_chirps(lat: float, lon: float, start: date, end: date) -> list[dict[str, Any]]:
    return fetch_dataset(CHIRPS_DATASET_ID, lat, lon, start, end)


def fetch_esi(lat: float, lon: float, start: date, end: date) -> list[dict[str, Any]]:
    return fetch_dataset(ESI_DATASET_ID, lat, lon, start, end)


def fetch_soil_moisture(lat: float, lon: float, start: date, end: date) -> list[dict[str, Any]]:
    return fetch_dataset(LIS_SOIL_MOISTURE_ID, lat, lon, start, end)
