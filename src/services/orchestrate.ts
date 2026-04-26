import { REQUEST_TIMEOUT_MS } from "../config/thresholds";
import { getNdvi } from "./ndvi";
import { getRainfall } from "./rainfall";
import { getSoilMoisture } from "./smap";
import { NdviData, RainfallData, SoilMoistureData } from "../types";

export interface ServiceFailure {
  service: string;
  reason: string;
}

export interface SignalFetchResult {
  soilMoisture: SoilMoistureData | null;
  rainfall: RainfallData | null;
  ndvi: NdviData | null;
  failures: ServiceFailure[];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(id);
        reject(error);
      });
  });
}

function reasonOf(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  return String(reason);
}

export async function fetchAllSignals(
  latitude: number,
  longitude: number
): Promise<SignalFetchResult> {
  const [smResult, rfResult, ndviResult] = await Promise.allSettled([
    withTimeout(getSoilMoisture(latitude, longitude), REQUEST_TIMEOUT_MS, "SMAP"),
    withTimeout(getRainfall(latitude, longitude), REQUEST_TIMEOUT_MS, "IMERG"),
    withTimeout(getNdvi(latitude, longitude), REQUEST_TIMEOUT_MS, "NDVI")
  ]);

  const failures: ServiceFailure[] = [];
  if (smResult.status === "rejected") failures.push({ service: "SMAP", reason: reasonOf(smResult.reason) });
  if (rfResult.status === "rejected") failures.push({ service: "IMERG", reason: reasonOf(rfResult.reason) });
  if (ndviResult.status === "rejected") failures.push({ service: "NDVI", reason: reasonOf(ndviResult.reason) });

  return {
    soilMoisture: smResult.status === "fulfilled" ? smResult.value : null,
    rainfall: rfResult.status === "fulfilled" ? rfResult.value : null,
    ndvi: ndviResult.status === "fulfilled" ? ndviResult.value : null,
    failures
  };
}
