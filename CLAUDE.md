# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DroughtWatch Backend** — a FastAPI-based agricultural early warning system for subsistence farmers in Afghanistan. The service fetches environmental data from satellite sources and uses AI to generate localized, plain-language advice.

## Tech Stack

- Python 3.x
- FastAPI + Uvicorn
- Google Gemini SDK (`google-genai` or `google-generativeai`)
- `requests` for fetching external satellite data

## Critical Rules

- **AI provider is locked to Google Gemini.** All AI, reasoning, and text-generation tasks MUST go through the Google Gemini API. Do NOT introduce Anthropic, Claude, or OpenAI SDKs — this is a mandatory requirement for the hackathon prize track being targeted.
- **All API endpoints must return strictly formatted JSON.**
- **Never commit `.env` files or API keys.**

## Data Sources

All environmental data comes from the **ClimateSERV API** (`https://climateserv.servirglobal.net/api`). Three datasets are in scope:

| Dataset | ClimateSERV Dataset ID | Resolution | Coverage |
|---|---|---|---|
| UCSB CHIRPS Rainfall | `0` | Daily | 1981–near present |
| SPoRT Evaporative Stress Index 4-week (ESI) | `29` | Weekly | 2000–present |
| LIS-Modeled Soil Moisture 0-10cm | `664` | Daily | 2000–near present |

**Why these IDs:** The originally specified NDVI (ID 28, eMODIS Central Asia) and SMAP (ID 38, USDA) both ended coverage in August/September 2022 and return empty results. The substitutes above were verified live against the API and return current data for Afghanistan. ESI is a superior drought indicator over raw NDVI — negative values mean vegetation is more water-stressed than normal.

ClimateSERV uses an async job pattern: `POST /submitDataRequest/` → poll `GET /getDataRequestProgress/?id=` → `GET /getDataFromRequest/?id=`. See `app/services/climateserv.py` for the implementation.
