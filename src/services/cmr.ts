import axios from "axios";

const CMR_GRANULES_URL = "https://cmr.earthdata.nasa.gov/search/granules.json";

export interface CmrGranuleEntry {
  id?: string;
  title?: string;
  time_start?: string;
  time_end?: string;
  updated?: string;
  links?: Array<{ href?: string; rel?: string }>;
  data_center?: string;
}

interface CmrGranulesResponse {
  feed?: {
    entry?: CmrGranuleEntry[];
  };
}

export interface CmrLookupOptions {
  shortName: string;
  latitude: number;
  longitude: number;
  pageSize?: number;
}

function authHeaders(): Record<string, string> {
  const token = process.env.NASA_EARTHDATA_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function findLatestGranule(
  options: CmrLookupOptions
): Promise<CmrGranuleEntry | null> {
  const response = await axios.get<CmrGranulesResponse>(CMR_GRANULES_URL, {
    headers: authHeaders(),
    params: {
      short_name: options.shortName,
      point: `${options.longitude},${options.latitude}`,
      sort_key: "-start_date",
      page_size: options.pageSize ?? 1
    }
  });

  return response.data.feed?.entry?.[0] ?? null;
}

export async function findLatestGranuleAcrossCollections(
  shortNames: string[],
  latitude: number,
  longitude: number
): Promise<{ entry: CmrGranuleEntry; shortName: string } | null> {
  for (const shortName of shortNames) {
    try {
      const entry = await findLatestGranule({ shortName, latitude, longitude });
      if (entry) {
        return { entry, shortName };
      }
    } catch {
      // try next collection
    }
  }
  return null;
}

export function granuleAgeDays(entry: CmrGranuleEntry): number | null {
  const reference = entry.time_end || entry.time_start;
  if (!reference) {
    return null;
  }
  const then = new Date(reference);
  if (Number.isNaN(then.getTime())) {
    return null;
  }
  const now = new Date();
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
}

export function granuleSeed(entry: CmrGranuleEntry, latitude: number, longitude: number): number {
  const reference = entry.time_start || entry.time_end || entry.updated || "1970-01-01";
  const t = Date.parse(reference);
  const base = Number.isFinite(t) ? t / (1000 * 60 * 60 * 24) : 0;
  const latPart = Math.abs(latitude * 17.31);
  const lonPart = Math.abs(longitude * 9.07);
  return Math.abs((base + latPart + lonPart) % 1);
}
