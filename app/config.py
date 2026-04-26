import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str | None
    gemini_model: str
    climateserv_base_url: str


def get_settings() -> Settings:
    return Settings(
        gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        climateserv_base_url=os.getenv(
            "CLIMATESERV_BASE_URL",
            "https://climateserv.servirglobal.net/api",
        ).rstrip("/"),
    )
