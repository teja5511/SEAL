import { NextResponse } from "next/server";
import { isGeeConfigured, getWeatherNextData, type WeatherNextSnapshot } from "@/lib/gee";
import { estimateWbgt, crewSignalFromWbgt } from "@/lib/wbgt";
import { STORM_BEATS, weatherFromBeat, beatIndexForHour } from "@/lib/scenario";
import type { DataSource, WeatherPacket } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function packetFromSnapshot(wn: WeatherNextSnapshot, source: DataSource): WeatherPacket {
  const wbgtC = estimateWbgt(wn.tempC, wn.humidity, wn.windMs);
  const { signal, reason } = crewSignalFromWbgt(wbgtC);

  return {
    source,
    initTime: wn.initTime,
    forecastHour: 1,
    precipMeanMm: wn.precipMeanMm,
    precipP90Mm: wn.precipP90Mm,
    tempC: wn.tempC,
    dewC: wn.dewC,
    humidity: wn.humidity,
    windMs: wn.windMs,
    wbgtC,
    crewSignal: signal,
    crewReason: reason,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hourParam = searchParams.get("hour");
    const forceReplay = searchParams.get("replay") === "true";

    // If client explicitly asks for replay scenario beat
    if (forceReplay || hourParam !== null) {
      const hour = hourParam !== null ? parseInt(hourParam, 10) : -6;
      const beat = STORM_BEATS[beatIndexForHour(hour)];
      const packet = weatherFromBeat(beat);
      return NextResponse.json(packet);
    }

    let geeSnapshot: WeatherNextSnapshot | null = null;

    // 1. Try Google Earth Engine WeatherNext 3 if credentials exist
    if (isGeeConfigured()) {
      try {
        geeSnapshot = await getWeatherNextData();
        if (geeSnapshot && geeSnapshot.source === "weathernext3") {
          return NextResponse.json(packetFromSnapshot(geeSnapshot, "weathernext3"));
        }
      } catch (err) {
        console.warn("GEE WeatherNext 3 query failed, falling back to Open-Meteo:", err);
      }
    }

    // 2. Fallback to Open-Meteo live nowcast for Hyderabad (17.385, 78.486)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=17.385&longitude=78.486&current=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,wind_speed_10m&hourly=precipitation,temperature_2m&forecast_days=1",
          { signal: controller.signal, next: { revalidate: 300 } }
        );

        if (res.ok) {
          const data = await res.json();
          const tempC = Number.isFinite(Number(data.current?.temperature_2m))
            ? Number(data.current.temperature_2m)
            : 30.5;
          const humidity = Number.isFinite(Number(data.current?.relative_humidity_2m))
            ? Number(data.current.relative_humidity_2m)
            : 70;
          const dewC = Number.isFinite(Number(data.current?.dew_point_2m))
            ? Number(data.current.dew_point_2m)
            : Math.round((tempC - ((100 - humidity) / 5)) * 10) / 10;
          // Open-Meteo returns km/h by default, convert to m/s
          const rawWind = Number(data.current?.wind_speed_10m);
          const windMs = Number.isFinite(rawWind) ? Math.round((rawWind / 3.6) * 10) / 10 : 3.2;
          const currentRain = Number.isFinite(Number(data.current?.precipitation))
            ? Number(data.current.precipitation)
            : 0;

          // Extract next 6 hours precipitation for p90 calculation
          const hourlyRain: number[] = Array.isArray(data.hourly?.precipitation)
            ? data.hourly.precipitation.slice(0, 6).map((v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0))
            : [currentRain];

          const maxRain = Math.max(...hourlyRain, currentRain);
          const avgHourly = hourlyRain.reduce((a, b) => a + b, 0) / (hourlyRain.length || 1);
          const precipMeanMm = Math.round((avgHourly + currentRain) * 10) / 10;
          const precipP90Mm = Math.round(Math.max(precipMeanMm * 1.35, maxRain, 5.0) * 10) / 10;

          const wbgtC = estimateWbgt(tempC, humidity, windMs);
          const { signal, reason } = crewSignalFromWbgt(wbgtC);

          const packet: WeatherPacket = {
            source: "open-meteo",
            initTime: new Date().toISOString(),
            forecastHour: 1,
            precipMeanMm,
            precipP90Mm,
            tempC,
            dewC,
            humidity,
            windMs,
            wbgtC,
            crewSignal: signal,
            crewReason: reason,
          };

          return NextResponse.json(packet);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      console.warn("Open-Meteo live query failed, falling back to gee-cache / replay:", err);
    }

    // 3. Offline gee-cache snapshot (never crash if EE keys are missing or the live query failed)
    try {
      const cached = geeSnapshot ?? (await getWeatherNextData());
      if (cached) {
        return NextResponse.json(packetFromSnapshot(cached, "replay"));
      }
    } catch (err) {
      console.warn("gee-cache snapshot failed, falling back to replay scenario:", err);
    }

    // 4. Fallback to offline replay scenario
    const fallbackBeat = STORM_BEATS[0];
    return NextResponse.json(weatherFromBeat(fallbackBeat));
  } catch (fatalErr) {
    console.error("Unhandled error in weather route, returning offline replay beat:", fatalErr);
    const fallbackBeat = STORM_BEATS[0];
    return NextResponse.json(weatherFromBeat(fallbackBeat));
  }
}
