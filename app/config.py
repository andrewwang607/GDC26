import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


def _get_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str | None
    gemini_model: str
    climateserv_base_url: str
    open_meteo_base_url: str
    enable_synthetic_fallback: bool


def get_settings() -> Settings:
    return Settings(
        gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        climateserv_base_url=os.getenv(
            "CLIMATESERV_BASE_URL",
            "https://climateserv.servirglobal.net/api",
        ).rstrip("/"),
        open_meteo_base_url=os.getenv(
            "OPEN_METEO_BASE_URL",
            "https://archive-api.open-meteo.com/v1",
        ).rstrip("/"),
        enable_synthetic_fallback=_get_bool("ENABLE_SYNTHETIC_FALLBACK", False),
    )
