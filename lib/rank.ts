import type { AlertLevel, NalaSeed, RankedNala } from "./types";

/**
 * Deterministic Core 1 ranker.
 * Gemini / any LLM is barred from writing this score (SEAL dual-core contract).
 * risk = clog^1.4 * forecast_mm * basin_proxy * (1 + 0.35 * waterProb)
 */
export function rankNala(
  nala: NalaSeed,
  forecastMm: number,
  extras?: { waterProb?: number; ndwi?: number; ndbi?: number; elevationM?: number; precipP90Mm?: number }
): RankedNala {
  const precipP90Mm = extras?.precipP90Mm ?? forecastMm * 1.25;
  const waterProb = extras?.waterProb ?? Math.min(0.85, 0.15 + (nala.basinProxy - 0.7) * 0.4);
  const ndwi = extras?.ndwi ?? waterProb * 0.4;
  const ndbi = extras?.ndbi ?? 0.25 + nala.clog / 400;
  const elevationM = extras?.elevationM ?? 510 - nala.basinProxy * 18;

  const wet = Math.max(0.4, precipP90Mm);
  const risk = Math.round(Math.pow(nala.clog / 10, 1.4) * wet * nala.basinProxy * (1 + 0.35 * waterProb));

  let alert: AlertLevel = "WATCH";
  if (risk >= 220) alert = "RED";
  else if (risk >= 90) alert = "YELLOW";

  const reason =
    alert === "RED"
      ? `Clog ${nala.clog} · WN3 p90 ${precipP90Mm.toFixed(0)} mm · basin ${nala.basinProxy.toFixed(2)} · Dynamic World water ${Math.round(waterProb * 100)}%. This pin floods if it is not sealed.`
      : alert === "YELLOW"
        ? `Rising storm drain. Clog ${nala.clog} with ${precipP90Mm.toFixed(0)} mm p90 rain. Queue it before the band arrives.`
        : `Watch only. Clog ${nala.clog} and ${forecastMm.toFixed(0)} mm mean rain stay under the seal threshold.`;

  return {
    ...nala,
    forecastMm,
    precipP90Mm,
    risk,
    alert,
    reason,
    status: "idle",
    waterProb,
    ndwi,
    ndbi,
    elevationM,
  };
}

export function floodDepthIfUnsealed(nala: RankedNala, sealed: boolean) {
  if (sealed) return 0;
  if (nala.alert !== "RED") return Math.max(0, nala.historyFloodM * 0.25);
  return nala.historyFloodM;
}
