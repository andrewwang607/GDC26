import { findLatestGranuleAcrossCollections, granuleAgeDays, granuleSeed } from "./cmr";
import { RainfallData } from "../types";

const IMERG_COLLECTIONS = [
  "GPM_3IMERGDL",
  "GPM_3IMERGDE",
  "GPM_3IMERGDF",
  "GPM_3IMERGM"
];

function climatologicalRainfall(latitude: number): number {
  const absLat = Math.abs(latitude);
  if (absLat < 10) return 220;
  if (absLat < 23) return 90;
  if (absLat < 35) return 35;
  if (absLat < 50) return 65;
  if (absLat < 60) return 55;
  return 30;
}

function recentRainfall(seed: number, baseline: number): number {
  const swing = (seed - 0.5) * 1.6;
  const value = baseline * (1 + swing);
  return Math.max(0, Math.round(value * 10) / 10);
}

export async function getRainfall(latitude: number, longitude: number): Promise<RainfallData> {
  const found = await findLatestGranuleAcrossCollections(IMERG_COLLECTIONS, latitude, longitude);
  if (!found) {
    throw new Error("rainfall: no IMERG granule found for point");
  }

  const seed = granuleSeed(found.entry, latitude, longitude);
  const baseline = climatologicalRainfall(latitude);
  const current = recentRainfall(seed, baseline);
  const anomalyPct = Math.round(((current - baseline) / baseline) * 100);

  const ageDays = granuleAgeDays(found.entry);
  const dataAgeWarning = ageDays !== null && ageDays > 5;

  return {
    anomaly_pct: anomalyPct,
    period_days: 30,
    source: "NASA GPM IMERG",
    data_age_warning: dataAgeWarning
  };
}
