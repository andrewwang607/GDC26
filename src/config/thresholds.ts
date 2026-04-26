export const REQUEST_TIMEOUT_MS = 10_000;

export const SMAP_STALE_DAYS_THRESHOLD = 14;

export const ALERT_LEVEL_THRESHOLDS = {
  watchMinAverage: 1.75,
  actNowMinAverage: 2.5,
  soilMoistureModerateAnomalyPct: -25,
  soilMoistureSevereAnomalyPct: -50,
  rainfallModerateAnomalyPct: -10,
  rainfallSevereAnomalyPct: -30
} as const;

export const NDVI_CLASSIFICATION_THRESHOLDS = {
  healthyMin: 0.4,
  moderateStressMin: 0.2,
  severeStressMin: 0.1
} as const;

export const BASELINES = {
  smap: { startYear: 2015, endYear: 2020 },
  ndvi: { startYear: 2010, endYear: 2020 }
} as const;

export const SUPPORTED_LANGUAGES = [
  "dari",
  "pashto",
  "arabic",
  "french",
  "amharic",
  "somali",
  "hausa",
  "tigrinya"
] as const;

export const RATE_LIMIT = {
  windowMs: 60_000,
  max: 30
} as const;
