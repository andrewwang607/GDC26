import { Router } from "express";
import { SUPPORTED_LANGUAGES } from "../config/thresholds";
import { generateSolutions } from "../services/interpreter";
import { fetchAllSignals } from "../services/orchestrate";
import { computeAlertLevel } from "./alert";
import {
  AlertLevel,
  NdviData,
  RainfallData,
  SoilMoistureData,
  SolutionsRequestBody
} from "../types";

const router = Router();

function isValidBody(body: unknown): body is SolutionsRequestBody {
  if (!body || typeof body !== "object") return false;
  const candidate = body as Partial<SolutionsRequestBody>;
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

router.post("/api/solutions", async (req, res) => {
  if (!isValidBody(req.body)) {
    return res.status(400).json({
      error:
        "Invalid request body. Required: latitude, longitude, crop_type, language (dari, pashto, arabic, french, amharic, somali, hausa, tigrinya)."
    });
  }

  const body = req.body;
  const { latitude, longitude } = body;
  const language = body.language.toLowerCase();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Solutions generator unavailable (GEMINI_API_KEY not configured)."
    });
  }

  let soilMoisture: SoilMoistureData | null = null;
  let rainfall: RainfallData | null = null;
  let ndvi: NdviData | null = null;
  let alertLevel: AlertLevel;
  let failures: Array<{ service: string; reason: string }> = [];

  if (body.previous && body.previous.data) {
    soilMoisture = body.previous.data.soil_moisture ?? null;
    rainfall = body.previous.data.rainfall ?? null;
    ndvi = body.previous.data.ndvi ?? null;
    alertLevel = body.previous.alert_level;
  } else {
    const fetched = await fetchAllSignals(latitude, longitude);
    soilMoisture = fetched.soilMoisture;
    rainfall = fetched.rainfall;
    ndvi = fetched.ndvi;
    failures = fetched.failures;

    if (!soilMoisture && !rainfall && !ndvi) {
      return res.status(503).json({
        error: "No upstream drought data sources available.",
        failures
      });
    }

    alertLevel = computeAlertLevel(soilMoisture, rainfall, ndvi);
  }

  let solutions;
  try {
    solutions = await generateSolutions(
      apiKey,
      latitude,
      longitude,
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
      console.warn("solutions generation failed:", err);
    }
    const message = err instanceof Error ? err.message : String(err);
    const isQuota = /429|quota|rate.?limit/i.test(message);
    return res.status(503).json({
      error: isQuota
        ? "Gemini API quota exceeded for this key (free tier: limit 0 on the requested model). Enable billing on the Google AI Studio project, rotate the GEMINI_API_KEY, or wait for the daily quota to reset."
        : "Solutions generator temporarily unavailable."
    });
  }

  const dataPartial = !soilMoisture || !rainfall || !ndvi;
  return res.status(200).json({
    alert_level: alertLevel,
    data: {
      soil_moisture: soilMoisture,
      rainfall,
      ndvi
    },
    solutions,
    data_partial: dataPartial,
    fetched_at: new Date().toISOString()
  });
});

export default router;
