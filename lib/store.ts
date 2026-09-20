import nalas from "@/data/hyderabad-nalas.json";
import { rankNala } from "./rank";
import { beatIndexForHour, STORM_BEATS, weatherFromBeat } from "./scenario";
import type { AppState, JobStatus, NalaSeed, ProofRecord, RankedNala, WeatherPacket } from "./types";

const seeds = nalas as NalaSeed[];

function applyBeat(list: RankedNala[], hour: number): RankedNala[] {
  const currentIdx = beatIndexForHour(hour);
  const dispatch = new Set<string>();
  const verify = new Set<string>();
  const hold = new Set<string>();

  for (let i = 0; i <= currentIdx; i++) {
    const beat = STORM_BEATS[i];
    beat.autoDispatch.forEach((id) => dispatch.add(id));
    beat.heatHold.forEach((id) => hold.add(id));
    beat.autoVerify.forEach((id) => verify.add(id));
  }

  return list.map((n) => {
    let status: JobStatus = "idle";
    if (hour >= -4 && n.alert === "RED") {
      status = "queued";
    }
    if (dispatch.has(n.id)) status = "dispatched";
    if (hold.has(n.id)) status = "held";
    if (verify.has(n.id)) status = "verified";
    if (hour === -6) status = "idle";
    return { ...n, status };
  });
}

export function buildState(hour = -6, liveWeather = false): AppState {
  const beat = STORM_BEATS[beatIndexForHour(hour)];
  const weather = weatherFromBeat(beat);
  const ranked = seeds.map((n) => rankNala(n, weather.precipMeanMm, { precipP90Mm: weather.precipP90Mm }));
  const nalasWithStatus = applyBeat(ranked, hour).sort((a, b) => b.risk - a.risk);

  const proofs: ProofRecord[] = nalasWithStatus
    .filter((n) => n.status === "verified")
    .map((n) => ({
      nalaId: n.id,
      beforeUrl: `/demo/${n.clogClass}-before.svg`,
      afterUrl: `/demo/clear-after.svg`,
      beforeClog: n.clog,
      afterClog: 12,
      verified: true,
      paidInr: n.payInr,
      kgPlastic: Math.round(8 + n.clog / 8),
      at: n.id === "N-07" ? "T–0" : "T–2h",
    }));

  return {
    hour,
    playing: false,
    liveWeather,
    weather,
    nalas: nalasWithStatus,
    proofs,
    selectedId: nalasWithStatus[0]?.id ?? null,
    splitView: hour === 0,
  };
}

/** Re-rank pins with live precip. Status / proofs stay from the Replay Storm beat. */
export function applyLiveWeather(state: AppState, weather: WeatherPacket): AppState {
  const statusById = new Map(state.nalas.map((n) => [n.id, n.status]));
  const extrasById = new Map(
    state.nalas.map((n) => [
      n.id,
      { waterProb: n.waterProb, ndwi: n.ndwi, ndbi: n.ndbi, elevationM: n.elevationM },
    ])
  );

  const nalasWithStatus = seeds
    .map((n) => {
      const extras = extrasById.get(n.id);
      const ranked = rankNala(n, weather.precipMeanMm, {
        precipP90Mm: weather.precipP90Mm,
        waterProb: extras?.waterProb,
        ndwi: extras?.ndwi,
        ndbi: extras?.ndbi,
        elevationM: extras?.elevationM,
      });
      return { ...ranked, status: statusById.get(n.id) ?? ranked.status };
    })
    .sort((a, b) => b.risk - a.risk);

  return {
    ...state,
    liveWeather: true,
    weather,
    nalas: nalasWithStatus,
    selectedId: nalasWithStatus.some((n) => n.id === state.selectedId)
      ? state.selectedId
      : (nalasWithStatus[0]?.id ?? null),
  };
}

export function ledgerStats(state: AppState) {
  const paid = state.proofs.filter((p) => p.verified);
  const sealed = new Set(paid.map((p) => p.nalaId));
  const red = state.nalas.filter((n) => n.alert === "RED");
  const householdsSaved = red.filter((n) => sealed.has(n.id)).reduce((s, n) => s + n.households, 0);
  const householdsAtRisk = red.filter((n) => !sealed.has(n.id)).reduce((s, n) => s + n.households, 0);
  return {
    jobs: paid.length,
    rupees: paid.reduce((s, p) => s + p.paidInr, 0),
    kgPlastic: paid.reduce((s, p) => s + p.kgPlastic, 0),
    householdsSaved,
    householdsAtRisk,
    redCount: red.length,
    sealedCount: sealed.size,
  };
}
