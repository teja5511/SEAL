import type { CrewSignal } from "./types";

/** Liljegren-lite WBGT from 2m air, humidity, and wind. Good enough for a HOLD/WORK gate. */
export function estimateWbgt(tempC: number, humidity: number, windMs: number) {
  const rh = Math.max(5, Math.min(100, humidity));
  const tw =
    tempC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(tempC + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  const tg = tempC + Math.max(0, 4 - windMs * 0.6);
  const wbgt = 0.7 * tw + 0.2 * tg + 0.1 * tempC;
  return Math.round(wbgt * 10) / 10;
}

export function crewSignalFromWbgt(wbgtC: number): { signal: CrewSignal; reason: string } {
  if (wbgtC >= 32) {
    return {
      signal: "HOLD",
      reason: `WBGT ${wbgtC}°C ≥ 32. Outdoor storm-drain work held until the heat drops. HeatGuard rule — map redness cannot override.`,
    };
  }
  if (wbgtC >= 28) {
    return {
      signal: "SHADE_BREAK",
      reason: `WBGT ${wbgtC}°C. 45/15 work-rest. Hydrate at the nearest water ATM before entering the storm drain.`,
    };
  }
  return {
    signal: "WORK",
    reason: `WBGT ${wbgtC}°C is under the 28°C caution line. Crews can seal drains.`,
  };
}
