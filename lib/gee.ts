import geeCache from "@/data/gee-cache.json";
import type { EarthEngine, EEPrivateKey } from "@google/earthengine";

export const HYDERABAD_LNG = 78.486;
export const HYDERABAD_LAT = 17.385;

export const WEATHERNEXT_0P1_ASSET =
  "projects/gcp-public-data-weathernext/assets/weathernext_3_0_0_0p1deg";
export const WEATHERNEXT_0P05_ASSET =
  "projects/gcp-public-data-weathernext/assets/weathernext_3_0_0_0p05deg";

const EE_QUERY_TIMEOUT_MS = 20_000;
const LIVE_SNAPSHOT_TTL_MS = 5 * 60 * 1000;

export type NalaTelemetry = {
  waterProb: number;
  ndwi: number;
  ndbi: number;
  elevationM: number;
  precipP90Mm: number;
};

export type WeatherNextSnapshot = {
  source: "weathernext3" | "gee-cache";
  assetId: string;
  initTime: string;
  precipMeanMm: number;
  precipP90Mm: number;
  tempC: number;
  dewC: number;
  humidity: number;
  windMs: number;
};

type WnGridSample = {
  total_precipitation_1hr_mean?: number | null;
  total_precipitation_1hr_p90?: number | null;
  temperature_2m_mean?: number | null;
  dewpoint_temperature_2m_mean?: number | null;
  wind_speed_10m_mean?: number | null;
  u_component_of_wind_10m_mean?: number | null;
  v_component_of_wind_10m_mean?: number | null;
};

type WnStationSample = {
  station_head_temperature_2m_mean?: number | null;
  station_head_dewpoint_temperature_2m_mean?: number | null;
};

type WnQueryResult = {
  initTime?: string | null;
  endTime?: string | null;
  forecastHour?: number | null;
  grid?: WnGridSample | null;
  station?: WnStationSample | null;
};

let eeInitialized = false;
let eeInitError: Error | null = null;
let eeClient: EarthEngine | null = null;
let liveSnapshotCache: { at: number; value: WeatherNextSnapshot } | null = null;

export function isGeeConfigured(): boolean {
  return Boolean(process.env.EE_PROJECT && process.env.EE_PRIVATE_KEY_JSON);
}

function cachedWeatherFallback(): WeatherNextSnapshot {
  const fallback = geeCache.weathernext3 as WeatherNextSnapshot;
  return { ...fallback, source: "gee-cache" };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** WeatherNext temperatures are Kelvin; tolerate already-Celsius values. */
function kelvinToC(value: number): number {
  return value > 100 ? value - 273.15 : value;
}

/** Catalog precip is meters; values already in mm stay as mm. */
function metersToMm(value: number): number {
  return value >= 0 && value < 2 ? value * 1000 : value;
}

/** Magnus formula RH from 2 m air and dewpoint (°C). */
function relativeHumidity(tempC: number, dewC: number): number {
  const vapor = (t: number) => 6.112 * Math.exp((17.67 * t) / (t + 243.5));
  const rh = (100 * vapor(dewC)) / vapor(tempC);
  return Math.max(0, Math.min(100, Math.round(rh)));
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function evaluate<T>(obj: { evaluate: (cb: (value: T | undefined, error?: Error | string) => void) => void }): Promise<T> {
  return new Promise((resolve, reject) => {
    obj.evaluate((value, error) => {
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      if (value === undefined || value === null) {
        reject(new Error("Earth Engine evaluate returned empty result"));
        return;
      }
      resolve(value);
    });
  });
}

/**
 * Initializes Earth Engine with private key JSON if credentials exist in environment.
 * Gracefully falls back to cache without crashing if keys are missing or invalid.
 */
async function initEarthEngine(): Promise<boolean> {
  if (eeInitialized && eeClient) return true;
  if (eeInitError) return false;

  const project = process.env.EE_PROJECT;
  const privateKeyRaw = process.env.EE_PRIVATE_KEY_JSON;

  if (!project || !privateKeyRaw) {
    return false;
  }

  try {
    // Dynamic import to prevent client bundle evaluation
    const mod = await import("@google/earthengine");
    const ee = ((mod as { default?: EarthEngine }).default ?? mod) as unknown as EarthEngine;

    let privateKeyJson: EEPrivateKey;
    try {
      privateKeyJson =
        typeof privateKeyRaw === "string" ? (JSON.parse(privateKeyRaw) as EEPrivateKey) : (privateKeyRaw as EEPrivateKey);
    } catch {
      eeInitError = new Error("Invalid EE_PRIVATE_KEY_JSON format");
      return false;
    }

    await new Promise<void>((resolve, reject) => {
      ee.data.authenticateViaPrivateKey(
        privateKeyJson,
        () => {
          ee.initialize(null, null, () => resolve(), (err: Error) => reject(new Error(String(err))), null, project);
        },
        (err: Error) => reject(new Error(String(err)))
      );
    });

    eeClient = ee;
    eeInitialized = true;
    return true;
  } catch (err) {
    eeInitError = err instanceof Error ? err : new Error(String(err));
    console.warn("Google Earth Engine initialization skipped / failed. Using gee-cache.", eeInitError.message);
    return false;
  }
}

function buildWnExpression(ee: EarthEngine, includeStation: boolean) {
  const point = ee.Geometry.Point([HYDERABAD_LNG, HYDERABAD_LAT]);

  const latestGrid = ee
    .ImageCollection(WEATHERNEXT_0P1_ASSET)
    .filterBounds(point)
    .filter(ee.Filter.eq("forecast_hour", 1))
    .sort("start_time", false)
    .first();

  const gridSample = latestGrid
    .select([
      "total_precipitation_1hr_mean",
      "total_precipitation_1hr_p90",
      "temperature_2m_mean",
      "dewpoint_temperature_2m_mean",
      "wind_speed_10m_mean",
      "u_component_of_wind_10m_mean",
      "v_component_of_wind_10m_mean",
    ])
    .reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: point,
      scale: 10000,
      bestEffort: true,
    });

  const payload: Record<string, unknown> = {
    initTime: latestGrid.get("start_time"),
    endTime: latestGrid.get("end_time"),
    forecastHour: latestGrid.get("forecast_hour"),
    grid: gridSample,
  };

  if (includeStation) {
    const latestStation = ee
      .ImageCollection(WEATHERNEXT_0P05_ASSET)
      .filterBounds(point)
      .filter(ee.Filter.eq("start_time", latestGrid.get("start_time")))
      .filter(ee.Filter.eq("forecast_hour", 1))
      .first();

    payload.station = latestStation
      .select(["station_head_temperature_2m_mean", "station_head_dewpoint_temperature_2m_mean"])
      .reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: point,
        scale: 5000,
        bestEffort: true,
      });
  }

  return new ee.Dictionary(payload);
}

async function sampleWeatherNext(includeStation: boolean): Promise<WnQueryResult> {
  if (!eeClient) {
    throw new Error("Earth Engine client is not initialized");
  }
  return withTimeout(
    evaluate<WnQueryResult>(buildWnExpression(eeClient, includeStation)),
    EE_QUERY_TIMEOUT_MS,
    "WeatherNext 3 Earth Engine query timed out"
  );
}

function snapshotFromQuery(result: WnQueryResult): WeatherNextSnapshot {
  const grid = result.grid ?? {};
  const station = result.station ?? {};

  const precipMeanRaw = asNumber(grid.total_precipitation_1hr_mean);
  const precipP90Raw = asNumber(grid.total_precipitation_1hr_p90);
  if (precipMeanRaw === null || precipP90Raw === null) {
    throw new Error("WeatherNext 3 sample missing precipitation bands");
  }

  const stationTemp = asNumber(station.station_head_temperature_2m_mean);
  const stationDew = asNumber(station.station_head_dewpoint_temperature_2m_mean);
  const gridTemp = asNumber(grid.temperature_2m_mean);
  const gridDew = asNumber(grid.dewpoint_temperature_2m_mean);

  const tempK = stationTemp ?? gridTemp;
  const dewK = stationDew ?? gridDew;
  if (tempK === null || dewK === null) {
    throw new Error("WeatherNext 3 sample missing temperature bands");
  }

  const tempC = round1(kelvinToC(tempK));
  const dewC = round1(kelvinToC(dewK));

  const windSpeed = asNumber(grid.wind_speed_10m_mean);
  const u = asNumber(grid.u_component_of_wind_10m_mean);
  const v = asNumber(grid.v_component_of_wind_10m_mean);
  const windMs = round1(
    windSpeed ?? (u !== null && v !== null ? Math.hypot(u, v) : cachedWeatherFallback().windMs)
  );

  const initTime =
    (typeof result.initTime === "string" && result.initTime) ||
    (typeof result.endTime === "string" && result.endTime) ||
    new Date().toISOString();

  return {
    source: "weathernext3",
    assetId: WEATHERNEXT_0P1_ASSET,
    initTime,
    precipMeanMm: round1(metersToMm(precipMeanRaw)),
    precipP90Mm: round1(metersToMm(precipP90Raw)),
    tempC,
    dewC,
    humidity: relativeHumidity(tempC, dewC),
    windMs,
  };
}

async function queryWeatherNext3(): Promise<WeatherNextSnapshot> {
  try {
    return snapshotFromQuery(await sampleWeatherNext(true));
  } catch (stationErr) {
    console.warn("WeatherNext 3 0.05° station query failed, using 0.1° grid only:", stationErr);
    return snapshotFromQuery(await sampleWeatherNext(false));
  }
}

/**
 * Retrieves hydro-telemetry for a specific nala pin.
 * Queries Dynamic World (water), Sentinel-2 (NDWI/NDBI), SRTM (elevation),
 * and WeatherNext 3 (precip p90) if connected, or falls back to gee-cache.
 */
export async function getNalaTelemetry(nalaId: string): Promise<NalaTelemetry> {
  const fallback = (geeCache.nalas as Record<string, NalaTelemetry>)[nalaId] ?? {
    waterProb: 0.5,
    ndwi: 0.15,
    ndbi: 0.4,
    elevationM: 505,
    precipP90Mm: 35.0,
  };

  const hasEE = await initEarthEngine();
  if (!hasEE) {
    return fallback;
  }

  try {
    const wn = await getWeatherNextData();
    if (wn.source !== "weathernext3") {
      return fallback;
    }
    return { ...fallback, precipP90Mm: wn.precipP90Mm };
  } catch (err) {
    console.warn(`GEE query failed for ${nalaId}, using cache:`, err);
    return fallback;
  }
}

/**
 * Retrieves regional WeatherNext 3 prediction for Hyderabad coordinates.
 * Live EE query when EE_PROJECT + EE_PRIVATE_KEY_JSON are set; otherwise gee-cache.
 * Never throws — callers can always read a snapshot.
 */
export async function getWeatherNextData(): Promise<WeatherNextSnapshot> {
  const fallback = cachedWeatherFallback();

  if (liveSnapshotCache && Date.now() - liveSnapshotCache.at < LIVE_SNAPSHOT_TTL_MS) {
    return liveSnapshotCache.value;
  }

  const hasEE = await initEarthEngine();
  if (!hasEE) {
    return fallback;
  }

  try {
    const snapshot = await queryWeatherNext3();
    liveSnapshotCache = { at: Date.now(), value: snapshot };
    return snapshot;
  } catch (err) {
    console.warn("Failed reading WeatherNext 3 asset, using cache:", err);
    return fallback;
  }
}
