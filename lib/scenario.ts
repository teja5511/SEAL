import type { WeatherPacket } from "./types";
import { crewSignalFromWbgt, estimateWbgt } from "./wbgt";

export type StormBeat = {
  hour: number;
  label: string;
  precipMeanMm: number;
  precipP90Mm: number;
  tempC: number;
  humidity: number;
  windMs: number;
  autoDispatch: string[];
  autoVerify: string[];
  heatHold: string[];
};

export const STORM_BEATS: StormBeat[] = [
  {
    hour: -6,
    label: "T–6h  crews idle",
    precipMeanMm: 2,
    precipP90Mm: 4,
    tempC: 31,
    humidity: 62,
    windMs: 2.1,
    autoDispatch: [],
    autoVerify: [],
    heatHold: [],
  },
  {
    hour: -4,
    label: "T–4h  nowcast 28–40 mm",
    precipMeanMm: 28,
    precipP90Mm: 40,
    tempC: 29.5,
    humidity: 78,
    windMs: 3.4,
    autoDispatch: ["N-11", "N-03", "N-18"],
    autoVerify: [],
    heatHold: [],
  },
  {
    hour: -2,
    label: "T–2h  proof + heat HOLD",
    precipMeanMm: 36,
    precipP90Mm: 48,
    tempC: 34.8,
    humidity: 71,
    windMs: 1.2,
    autoDispatch: ["N-07", "N-01", "N-24"],
    autoVerify: ["N-11", "N-03"],
    heatHold: ["N-18"],
  },
  {
    hour: 0,
    label: "T–0  first rain",
    precipMeanMm: 22,
    precipP90Mm: 31,
    tempC: 27.2,
    humidity: 88,
    windMs: 4.0,
    autoDispatch: [],
    autoVerify: ["N-07"],
    heatHold: [],
  },
];

export function weatherFromBeat(beat: StormBeat): WeatherPacket {
  const wbgtC = estimateWbgt(beat.tempC, beat.humidity, beat.windMs);
  const { signal, reason } = crewSignalFromWbgt(wbgtC);
  return {
    source: "replay",
    initTime: "2026-09-20T12:00:00Z",
    forecastHour: 6 + beat.hour,
    precipMeanMm: beat.precipMeanMm,
    precipP90Mm: beat.precipP90Mm,
    tempC: beat.tempC,
    dewC: beat.tempC - 4,
    humidity: beat.humidity,
    windMs: beat.windMs,
    wbgtC,
    crewSignal: signal,
    crewReason: reason,
  };
}

export function beatIndexForHour(hour: number) {
  if (hour >= 0) return 3;
  if (hour >= -2) return 2;
  if (hour >= -4) return 1;
  return 0;
}
