"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyOps, EMPTY_OPS, OPS_STORAGE_KEY, readOps, writeOps, type OpsPatch, type ResidentReport } from "@/lib/ops";
import type { AppState, ProofRecord } from "@/lib/types";

type OpsContextValue = {
  ops: OpsPatch;
  ready: boolean;
  queueReport: (report: ResidentReport) => void;
  dispatchPin: (nalaId: string) => void;
  verifyPin: (proof: ProofRecord) => void;
};

const OpsContext = createContext<OpsContextValue>({
  ops: EMPTY_OPS,
  ready: false,
  queueReport: () => {},
  dispatchPin: () => {},
  verifyPin: () => {},
});

export function OpsProvider({ children }: { children: React.ReactNode }) {
  const [ops, setOps] = useState<OpsPatch>(EMPTY_OPS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOps(readOps());
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === OPS_STORAGE_KEY) setOps(readOps());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((updater: (prev: OpsPatch) => OpsPatch) => {
    setOps((prev) => {
      const next = updater(prev);
      writeOps(next);
      return next;
    });
  }, []);

  const queueReport = useCallback(
    (report: ResidentReport) => {
      commit((prev) => ({
        ...prev,
        reports: { ...prev.reports, [report.nalaId]: report },
      }));
    },
    [commit]
  );

  const dispatchPin = useCallback(
    (nalaId: string) => {
      commit((prev) => {
        if (prev.dispatched.includes(nalaId) || prev.verified[nalaId]) return prev;
        return { ...prev, dispatched: [...prev.dispatched, nalaId] };
      });
    },
    [commit]
  );

  const verifyPin = useCallback(
    (proof: ProofRecord) => {
      commit((prev) => ({
        ...prev,
        verified: { ...prev.verified, [proof.nalaId]: proof },
        dispatched: prev.dispatched.includes(proof.nalaId) ? prev.dispatched : [...prev.dispatched, proof.nalaId],
      }));
    },
    [commit]
  );

  const value = useMemo(
    () => ({ ops, ready, queueReport, dispatchPin, verifyPin }),
    [ops, ready, queueReport, dispatchPin, verifyPin]
  );

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export function useOps() {
  return useContext(OpsContext);
}

export function useLiveState(base: AppState): AppState {
  const { ops } = useOps();
  return useMemo(() => applyOps(base, ops), [base, ops]);
}
