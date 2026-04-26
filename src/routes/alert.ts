import { Router } from "express";
import { ALERT_LEVEL_THRESHOLDS, SUPPORTED_LANGUAGES } from "../config/thresholds";
import { buildFallbackAdvisory } from "../services/fallback";
import { interpretAlert } from "../services/interpreter";
import { fetchAllSignals } from "../services/orchestrate";
import {
  AlertLevel,
  AlertRequestBody,
  NdviData,
  RainfallData,
  SoilMoistureData
} from "../types";

const router = Router();

function computeAlertLevel(
  sm: SoilMoistureData | null,
  rf: RainfallData | null,
  ndvi: NdviData | null
): AlertLevel {
  const score = (anomaly: number, lo: number, hi: number): 1 | 2 | 3 =>
    anomaly < hi ? 3 : anomaly < lo ? 2 : 1;

  const signals: Array<1 | 2 | 3> = [
    ...(sm
      ? [
          score(
            sm.anomaly_pct,
            ALERT_LEVEL_THRESHOLDS.soilMoistureModerateAnomalyPct,
            ALERT_LEVEL_THRESHOLDS.soilMoistureSevereAnomalyPct
          )
        ]
      : []),
    ...(rf
      ? [
          score(
            rf.anomaly_pct,
            ALERT_LEVEL_THRESHOLDS.rainfallModerateAnomalyPct,
            ALERT_LEVEL_THRESHOLDS.rainfallSevereAnomalyPct
          )
        ]
      : []),
    ...(ndvi
      ? [
          ndvi.classification === "severe_stress" || ndvi.classification === "bare_soil"
            ? (3 as const)
            : ndvi.classification === "moderate_stress"
              ? (2 as const)
              : (1 as const)
        ]
      : [])
  ];

  if (signals.length === 0) {
    return "watch";
  }

  const avg = signals.reduce((a, b) => a + b, 0) / signals.length;
  if (avg >= ALERT_LEVEL_THRESHOLDS.actNowMinAverage) {
    return "act_now";
  }
  if (avg >= ALERT_LEVEL_THRESHOLDS.watchMinAverage) {
    return "watch";
  }
  return "normal";
}

export function isValidAlertBody(body: unknown): body is AlertRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }
  const candidate = body as Partial<AlertRequestBody>;
  const language = candidate.language?.toLowerCase();
  return (
    typeof candidate.latitude === "number" &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    typeof candidate.longitude === "number" &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180 &&
    typeof candidate.crop_type === "string" &&
    candidate.crop_type.trim().length > 0 &&
    typeof language === "string" &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(language)
  );
}

export { computeAlertLevel };

router.post("/api/alert", async (req, res) => {
  if (!isValidAlertBody(req.body)) {
    return res.status(400).json({
      error:
        "Invalid request body. Required: latitude, longitude, crop_type, language (dari, pashto, arabic, french, amharic, somali, hausa, tigrinya)."
    });
  }

  const body = req.body;
  const { latitude, longitude } = body;
  const language = body.language.toLowerCase();

  const { soilMoisture, rainfall, ndvi, failures } = await fetchAllSignals(latitude, longitude);

  if (failures.length > 0 && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("upstream service failures:", failures);
  }

  if (!soilMoisture && !rainfall && !ndvi) {
    return res.status(503).json({
      error: "No upstream drought data sources available.",
      failures
    });
  }

  const alertLevel = computeAlertLevel(soilMoisture, rainfall, ndvi);

  const apiKey = process.env.GEMINI_API_KEY;
  let alert = buildFallbackAdvisory(
    alertLevel,
    body.crop_type,
    language,
    soilMoisture,
    rainfall,
    ndvi,
    apiKey ? undefined : "GEMINI_API_KEY not configured"
  );

  if (apiKey) {
    try {
      alert = await interpretAlert(
        apiKey,
        alertLevel,
        body.crop_type,
        language,
        soilMoisture,
        rainfall,
        ndvi
      );
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("interpreter failed:", err);
      }
      const message = err instanceof Error ? err.message : String(err);
      const isQuota = /429|quota|rate.?limit/i.test(message);
      const isOverloaded = /503|overloaded|unavailable|high demand/i.test(message);
      const reason = isQuota
        ? "Gemini API quota exhausted on all fallback models"
        : isOverloaded
          ? "Gemini API overloaded on all fallback models"
          : "Gemini API error";
      alert = buildFallbackAdvisory(
        alertLevel,
        body.crop_type,
        language,
        soilMoisture,
        rainfall,
        ndvi,
        reason
      );
    }
  }

  const dataPartial = !soilMoisture || !rainfall || !ndvi;
  return res.status(200).json({
    alert_level: alertLevel,
    data: {
      soil_moisture: soilMoisture,
      rainfall,
      ndvi
    },
    alert,
    data_partial: dataPartial,
    fetched_at: new Date().toISOString()
  });
});

export default router;
