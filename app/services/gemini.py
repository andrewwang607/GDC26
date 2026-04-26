from __future__ import annotations

from typing import Any

from google import genai
from google.genai import types

from app.config import get_settings

_SYSTEM_PROMPT = """You are an agricultural drought advisor for subsistence farmers in Afghanistan.
Given environmental sensor data for a location, produce a concise drought early warning in plain language.
Be specific and actionable. Avoid jargon. Use short sentences a rural farmer can act on.
Always respond in the exact JSON format requested — nothing else."""

_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "risk_level": {
            "type": "string",
            "enum": ["low", "moderate", "high", "severe"],
        },
        "summary": {"type": "string"},
        "recommendations": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 2,
            "maxItems": 5,
        },
    },
    "required": ["risk_level", "summary", "recommendations"],
}


class GeminiError(RuntimeError):
    pass


def _build_prompt(location: dict[str, Any], period: dict[str, Any], datasets: dict[str, Any]) -> str:
    chirps = datasets["rainfall"]
    esi = datasets["ndvi"]
    sm = datasets["soil_moisture"]

    def _fmt(v: float | None, decimals: int = 2) -> str:
        return f"{v:.{decimals}f}" if v is not None else "N/A"

    return f"""Location: {location['lat']:.4f}°N, {location['lon']:.4f}°E (Afghanistan)
Analysis period: {period['start']} to {period['end']}

ENVIRONMENTAL DATA:
- Rainfall (CHIRPS): latest={_fmt(chirps['latest'])} mm/day, 30-day mean={_fmt(chirps['mean_30d'])} mm/day, trend={chirps['trend']}
- Vegetation stress (ESI): latest={_fmt(esi['latest'])}, 30-day mean={_fmt(esi['mean_30d'])} (negative=stressed, positive=healthy), trend={esi['trend']}
- Surface soil moisture (0-10cm): latest={_fmt(sm['latest'], 3)} m³/m³, 30-day mean={_fmt(sm['mean_30d'], 3)} m³/m³, trend={sm['trend']}

Based on this data, assess the drought risk and provide specific farming advice for subsistence farmers in this region.
Return ONLY a JSON object with keys: risk_level (low/moderate/high/severe), summary (2-3 sentences), recommendations (2-5 bullet actions)."""


def generate_advice(
    location: dict[str, Any],
    period: dict[str, Any],
    datasets: dict[str, Any],
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise GeminiError("GEMINI_API_KEY is not set")

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = _build_prompt(location, period, datasets)

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
                temperature=0.2,
            ),
        )
    except Exception as e:
        raise GeminiError(f"Gemini API call failed: {e}") from e

    try:
        import json
        result = json.loads(response.text)
    except (ValueError, AttributeError) as e:
        raise GeminiError(f"Gemini returned non-JSON: {getattr(response, 'text', '')[:200]}") from e

    return result
