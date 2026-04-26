export type AlertLevel = "normal" | "watch" | "act_now";

export interface AlertRequestBody {
  latitude: number;
  longitude: number;
  crop_type: string;
  language: string;
}

export interface SoilMoistureData {
  value: number;
  anomaly_pct: number;
  source: "NASA SMAP";
  data_age_warning?: boolean;
}

export interface RainfallData {
  anomaly_pct: number;
  period_days: number;
  source: "NASA GPM IMERG";
  data_age_warning?: boolean;
}

export type NdviClassification =
  | "healthy"
  | "moderate_stress"
  | "severe_stress"
  | "bare_soil";

export interface NdviData {
  value: number;
  anomaly_pct: number;
  classification: NdviClassification;
  source: "NASA MODIS/VIIRS NDVI";
  data_age_warning?: boolean;
}

export interface AlertInterpretation {
  english_summary: string;
  local_language_guidance: string;
  recommended_actions: string[];
  structured_response?: boolean;
}

export interface AlertResponse {
  alert_level: AlertLevel;
  data: {
    soil_moisture: SoilMoistureData | null;
    rainfall: RainfallData | null;
    ndvi: NdviData | null;
  };
  alert: AlertInterpretation;
  data_partial: boolean;
  fetched_at: string;
}

export interface SolutionsInterpretation {
  effects: string[];
  solutions: string[];
  english_summary: string;
  local_language_summary: string;
  structured_response?: boolean;
}

export interface SolutionsRequestBody {
  latitude: number;
  longitude: number;
  crop_type: string;
  language: string;
  previous?: {
    alert_level: AlertLevel;
    data: {
      soil_moisture: SoilMoistureData | null;
      rainfall: RainfallData | null;
      ndvi: NdviData | null;
    };
  };
}

export interface SolutionsResponse {
  alert_level: AlertLevel;
  data: {
    soil_moisture: SoilMoistureData | null;
    rainfall: RainfallData | null;
    ndvi: NdviData | null;
  };
  solutions: SolutionsInterpretation;
  data_partial: boolean;
  fetched_at: string;
}
