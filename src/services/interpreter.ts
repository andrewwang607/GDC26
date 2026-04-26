import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AlertInterpretation,
  AlertLevel,
  NdviData,
  RainfallData,
  SoilMoistureData,
  SolutionsInterpretation
} from "../types";

const MODEL_CHAIN = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

const FALLBACK_STATUSES = new Set([404, 429, 500, 502, 503, 504]);

interface GeminiCallResult {
  text: string;
  model: string;
}

function shouldFallback(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; message?: string };
  if (typeof e.status === "number" && FALLBACK_STATUSES.has(e.status)) return true;
  if (typeof e.message === "string") {
    return /\b(?:429|500|502|503|504|quota|overloaded|unavailable|high demand|not found|rate.?limit)\b/i.test(
      e.message
    );
  }
  return false;
}

async function callGemini(
  apiKey: string,
  prompt: string,
  temperature: number
): Promise<GeminiCallResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown = null;
  const attempted: string[] = [];
  for (const modelName of MODEL_CHAIN) {
    attempted.push(modelName);
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json", temperature }
      });
      const result = await model.generateContent(prompt);
      return { text: result.response.text(), model: modelName };
    } catch (err) {
      lastError = err;
      if (!shouldFallback(err)) {
        throw err;
      }
    }
  }
  const lastMessage = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`All Gemini models failed (${attempted.join(", ")}): ${lastMessage}`);
}

function buildPrompt(
  alertLevel: AlertLevel,
  cropType: string,
  language: string,
  sm: SoilMoistureData | null,
  rf: RainfallData | null,
  ndvi: NdviData | null
): string {
  const smText = sm ? `${sm.anomaly_pct}% below average` : "unavailable";
  const rfText = rf ? `${rf.anomaly_pct}% below average` : "unavailable";
  const ndviText = ndvi ? `${ndvi.classification}, ${ndvi.anomaly_pct}% below normal` : "unavailable";

  return `You are an agricultural advisor translating drought data into farmer guidance for NGO field workers.

Rules:
- No scientific jargon (no NDVI, anomaly %, satellite names)
- Tailor advice to the crop type
- "act_now": lead with most urgent action
- English summary: 3 sentences max
- Translate guidance to: ${language}. Supported: Dari, Pashto, Arabic, French, Amharic, Somali, Hausa, Tigrinya. If confidence is low, append [Translation confidence: low — recommend human review]
- If a data source is missing, say so plainly. Never speculate.

Data:
- Alert: ${alertLevel}
- Crop: ${cropType}
- Soil moisture: ${smText}
- Rainfall (30d): ${rfText}
- Vegetation: ${ndviText}

Return ONLY this JSON:
{ "english_summary": "", "local_language_guidance": "", "recommended_actions": [] }`;
}

function parseStructuredResponse(text: string): AlertInterpretation | null {
  try {
    const parsed = JSON.parse(text) as AlertInterpretation;
    if (
      typeof parsed.english_summary === "string" &&
      typeof parsed.local_language_guidance === "string" &&
      Array.isArray(parsed.recommended_actions)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function interpretAlert(
  apiKey: string,
  alertLevel: AlertLevel,
  cropType: string,
  language: string,
  sm: SoilMoistureData | null,
  rf: RainfallData | null,
  ndvi: NdviData | null
): Promise<AlertInterpretation> {
  const prompt = buildPrompt(alertLevel, cropType, language, sm, rf, ndvi);

  let lastText = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { text } = await callGemini(apiKey, prompt, 0.2);
    lastText = text;
    const parsed = parseStructuredResponse(text);
    if (parsed) {
      return parsed;
    }
  }

  return {
    english_summary: lastText || "Interpreter unavailable.",
    local_language_guidance: "",
    recommended_actions: [],
    structured_response: false
  };
}

function buildSolutionsPrompt(
  latitude: number,
  longitude: number,
  alertLevel: AlertLevel,
  cropType: string,
  language: string,
  sm: SoilMoistureData | null,
  rf: RainfallData | null,
  ndvi: NdviData | null
): string {
  const smText = sm ? `${sm.anomaly_pct}% below average` : "unavailable";
  const rfText = rf ? `${rf.anomaly_pct}% below average` : "unavailable";
  const ndviText = ndvi ? `${ndvi.classification}, ${ndvi.anomaly_pct}% below normal` : "unavailable";

  return `You are an agricultural and humanitarian expert advising NGO field workers on drought response.

For the location and signal data below, generate:
1. effects: 4 to 6 specific impacts on this region — span agriculture, livestock, water security, food security, household economics, and displacement risk where relevant. Tailor to the local climate zone (use the latitude/longitude to infer region) and crop.
2. solutions: 6 to 8 concrete interventions. Mix short-term emergency measures (next 2 to 4 weeks) and longer-term resilience-building actions (3 to 12 months). Be specific to the region: water harvesting techniques relevant to that climate zone, drought-tolerant variety substitutes for the crop, livestock destocking guidance, NGO/government program types likely to apply.
3. english_summary: 4 to 6 sentence narrative bringing the situation and response together.
4. local_language_summary: same in ${language}. Supported: Dari, Pashto, Arabic, French, Amharic, Somali, Hausa, Tigrinya. If confidence in translation is low, append [Translation confidence: low — recommend human review].

Rules:
- No scientific jargon (no NDVI, anomaly %, satellite names)
- Tailor everything to ${cropType} farming
- If a data source is missing, acknowledge it and do not speculate
- Avoid generic platitudes — be concrete and actionable

Data:
- Location: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}
- Alert level: ${alertLevel}
- Crop: ${cropType}
- Soil moisture: ${smText}
- Rainfall (30d): ${rfText}
- Vegetation: ${ndviText}

Return ONLY this JSON:
{ "effects": [], "solutions": [], "english_summary": "", "local_language_summary": "" }`;
}

function parseSolutionsResponse(text: string): SolutionsInterpretation | null {
  try {
    const parsed = JSON.parse(text) as SolutionsInterpretation;
    if (
      Array.isArray(parsed.effects) &&
      Array.isArray(parsed.solutions) &&
      typeof parsed.english_summary === "string" &&
      typeof parsed.local_language_summary === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateSolutions(
  apiKey: string,
  latitude: number,
  longitude: number,
  alertLevel: AlertLevel,
  cropType: string,
  language: string,
  sm: SoilMoistureData | null,
  rf: RainfallData | null,
  ndvi: NdviData | null
): Promise<SolutionsInterpretation> {
  const prompt = buildSolutionsPrompt(latitude, longitude, alertLevel, cropType, language, sm, rf, ndvi);

  let lastText = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { text } = await callGemini(apiKey, prompt, 0.3);
    lastText = text;
    const parsed = parseSolutionsResponse(text);
    if (parsed) {
      return parsed;
    }
  }

  return {
    effects: [],
    solutions: [],
    english_summary: lastText || "Solutions generator unavailable.",
    local_language_summary: "",
    structured_response: false
  };
}
