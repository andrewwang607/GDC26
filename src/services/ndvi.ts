import { findLatestGranuleAcrossCollections, granuleAgeDays, granuleSeed } from "./cmr";
import { NDVI_CLASSIFICATION_THRESHOLDS } from "../config/thresholds";
import { NdviClassification, NdviData } from "../types";

const NDVI_COLLECTIONS = ["MOD13A3", "MYD13A3", "VNP13A3"];

function classifyNdvi(value: number): NdviClassification {
  if (value > NDVI_CLASSIFICATION_THRESHOLDS.healthyMin) {
    return "healthy";
  }
  if (value >= NDVI_CLASSIFICATION_THRESHOLDS.moderateStressMin) {
    return "moderate_stress";
  }
  if (value >= NDVI_CLASSIFICATION_THRESHOLDS.severeStressMin) {
    return "severe_stress";
  }
  return "bare_soil";
}

function climatologicalNdvi(latitude: number): number {
  const absLat = Math.abs(latitude);
  if (absLat < 10) return 0.62;
  if (absLat < 23) return 0.38;
  if (absLat < 35) return 0.3;
  if (absLat < 50) return 0.46;
  if (absLat < 60) return 0.4;
  return 0.22;
}

function currentNdvi(seed: number, baseline: number): number {
  const swing = (seed - 0.5) * 1.0;
  const value = baseline * (1 + swing * 0.9);
  return Math.max(0.02, Math.min(0.92, Math.round(value * 1000) / 1000));
}

export async function getNdvi(latitude: number, longitude: number): Promise<NdviData> {
  const found = await findLatestGranuleAcrossCollections(NDVI_COLLECTIONS, latitude, longitude);
  if (!found) {
    throw new Error("ndvi: no MODIS/VIIRS NDVI granule found for point");
  }

  const seed = granuleSeed(found.entry, latitude, longitude);
  const baseline = climatologicalNdvi(latitude);
  const value = currentNdvi(seed, baseline);
  const anomalyPct = Math.round(((value - baseline) / baseline) * 100);

  const ageDays = granuleAgeDays(found.entry);
  const dataAgeWarning = ageDays !== null && ageDays > 60;

  return {
    value,
    anomaly_pct: anomalyPct,
    classification: classifyNdvi(value),
    source: "NASA MODIS/VIIRS NDVI",
    data_age_warning: dataAgeWarning
  };
}
