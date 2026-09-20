import type { AppState, ClogClass, ProofRecord } from "./types";

export type ResidentReport = {
  nalaId: string;
  clog: number;
  clogClass: ClogClass;
  at: string;
};

export type OpsPatch = {
  reports: Record<string, ResidentReport>;
  dispatched: string[];
  verified: Record<string, ProofRecord>;
};

export const EMPTY_OPS: OpsPatch = { reports: {}, dispatched: [], verified: {} };
export const OPS_STORAGE_KEY = "seal-ops-v1";

export function readOps(): OpsPatch {
  if (typeof window === "undefined") return EMPTY_OPS;
  try {
    const raw = window.localStorage.getItem(OPS_STORAGE_KEY);
    if (!raw) return EMPTY_OPS;
    const parsed = JSON.parse(raw) as Partial<OpsPatch>;
    return {
      reports: parsed.reports && typeof parsed.reports === "object" ? parsed.reports : {},
      dispatched: Array.isArray(parsed.dispatched) ? parsed.dispatched.filter((id) => typeof id === "string") : [],
      verified: parsed.verified && typeof parsed.verified === "object" ? parsed.verified : {},
    };
  } catch {
    return EMPTY_OPS;
  }
}

export function writeOps(ops: OpsPatch) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(ops));
  } catch {
    /* quota / private mode */
  }
}

/** Overlay live Report / Dispatch / Crew actions on a Replay Storm snapshot. Never mutates Core 1 risk. */
export function applyOps(state: AppState, ops: OpsPatch): AppState {
  const dispatched = new Set(ops.dispatched);
  const verifiedIds = new Set(Object.keys(ops.verified));

  const nalas = state.nalas.map((n) => {
    const report = ops.reports[n.id];
    const evidence = report
      ? { clog: report.clog, clogClass: report.clogClass }
      : { clog: n.clog, clogClass: n.clogClass };

    if (n.status === "held" && !verifiedIds.has(n.id)) {
      return { ...n, ...evidence };
    }

    let status = n.status;
    if (verifiedIds.has(n.id) || n.status === "verified") status = "verified";
    else if (dispatched.has(n.id) || n.status === "dispatched") status = "dispatched";
    else if (report && (status === "idle" || status === "queued")) status = "queued";

    return { ...n, ...evidence, status };
  });

  const proofsById = new Map(state.proofs.map((p) => [p.nalaId, p]));
  for (const proof of Object.values(ops.verified)) {
    if (proof?.nalaId) proofsById.set(proof.nalaId, proof);
  }

  return { ...state, nalas, proofs: Array.from(proofsById.values()) };
}
