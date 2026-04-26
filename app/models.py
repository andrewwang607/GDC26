from datetime import date
from typing import Literal
from pydantic import BaseModel, Field

RiskLevel = Literal["low", "moderate", "high", "severe", "unknown"]
Trend = Literal["rising", "declining", "flat", "unknown"]


class AnalyzeRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    days: int = Field(90, ge=7, le=365)


class Location(BaseModel):
    lat: float
    lon: float


class Period(BaseModel):
    start: date
    end: date


class DatasetSummary(BaseModel):
    latest: float | None
    mean_30d: float | None
    mean_window: float | None
    trend: Trend
    sample_count: int


class DataBlock(BaseModel):
    rainfall: DatasetSummary
    ndvi: DatasetSummary
    soil_moisture: DatasetSummary


class Advice(BaseModel):
    risk_level: RiskLevel
    summary: str
    recommendations: list[str]


class AnalyzeResponse(BaseModel):
    location: Location
    period: Period
    data: DataBlock
    advice: Advice
