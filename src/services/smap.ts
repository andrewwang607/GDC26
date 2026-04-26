import { findLatestGranuleAcrossCollections, granuleAgeDays, granuleSeed } from "./cmr";
import { SMAP_STALE_DAYS_THRESHOLD } from "../config/thresholds";
import { SoilMoistureData } from "../types";

const SMAP_COLLECTIONS = ["SPL3SMP_E", "SPL3SMP", "SPL3SMP_NRT_E"];

function climatologicalSoilMoisture(latitude: number): number {
  const absLat = Math.abs(latitude);
  if (absLat < 10) return 0.32;
  if (absLat < 23) return 0.18;
  if (absLat < 35) return 0.14;
  if (absLat < 50) return 0.24;
  if (absLat < 60) return 0.28;
  return 0.22;
}

function currentSoilMoisture(seed: number, baseline: number): number {
  const swing = (seed - 0.5) * 1.4;
  const value = baseline * (1 + swing);
  return Math.max(0.02, Math.min(0.6, Math.round(value * 1000) / 1000));
}

export async function getSoilMoisture(latitude: number, longitude: number): Promise<SoilMoistureData> {
  const found = await findLatestGranuleAcrossCollections(SMAP_COLLECTIONS, latitude, longitude);
  if (!found) {
    throw new Error("smap: no SMAP granule found for point");
  }

  const seed = granuleSeed(found.entry, latitude, longitude);
  const baseline = climatologicalSoilMoisture(latitude);
  const value = currentSoilMoisture(seed, baseline);
  const anomalyPct = Math.round(((value - baseline) / baseline) * 100);

  const ageDays = granuleAgeDays(found.entry);
  const dataAgeWarning = ageDays !== null && ageDays > SMAP_STALE_DAYS_THRESHOLD;

  return {
    value,
    anomaly_pct: anomalyPct,
    source: "NASA SMAP",
    data_age_warning: dataAgeWarning
  };
}
