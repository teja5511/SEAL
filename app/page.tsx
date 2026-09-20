"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { applyLiveWeather, buildState } from "@/lib/store";
import { applyOps } from "@/lib/ops";
import type { AppState, MapLayer, RankedNala } from "@/lib/types";
import { DynamicMap } from "@/components/DynamicMap";
import { Queue } from "@/components/Queue";
import { ReplayClock } from "@/components/ReplayClock";
import { HeatGuardCard } from "@/components/HeatGuardCard";
import { ConditionsCard } from "@/components/ConditionsCard";
import { useDrainCopy } from "@/components/LocaleContext";
import { useOps } from "@/components/OpsContext";

const INITIAL_HOUR = -4;

let initialCommandState: AppState | undefined;

function getInitialCommandState(): AppState {
  if (!initialCommandState) initialCommandState = buildState(INITIAL_HOUR, false);
  return initialCommandState;
}

function nalaSnapshotEqual(a: RankedNala, b: RankedNala): boolean {
  return (
    a.id === b.id &&
    a.status === b.status &&
    a.risk === b.risk &&
    a.alert === b.alert &&
    a.forecastMm === b.forecastMm &&
    a.precipP90Mm === b.precipP90Mm &&
    a.reason === b.reason &&
    a.waterProb === b.waterProb &&
    a.clog === b.clog
  );
}

function pickSelectedNala(nalas: RankedNala[], current: RankedNala | null): RankedNala | null {
  if (!nalas.length) return null;
  if (!current) return nalas[0];
  const refreshed = nalas.find((n) => n.id === current.id);
  const next = refreshed ?? nalas[0];
  if (current.id === next.id && nalaSnapshotEqual(current, next)) return current;
  return next;
}

export default function CommandPage() {
  const { drains } = useDrainCopy();
  const { ops, dispatchPin } = useOps();
  const initialState = getInitialCommandState();
  const [hour, setHour] = useState<number>(INITIAL_HOUR);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [liveWeather, setLiveWeather] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(initialState);
  const [selectedNala, setSelectedNala] = useState<RankedNala | null>(initialState.nalas[0] ?? null);
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState<MapLayer>("risk");
  const [layersOpen, setLayersOpen] = useState(false);
  const [visible, setVisible] = useState({ RED: true, YELLOW: true, WATCH: true, sealed: true });
  const skipHourSyncRef = useRef(true);
  const pinConsumed = useRef(false);
  const viewState = applyOps(appState, ops);

  const syncSelectedFromNalas = useCallback((nalas: RankedNala[]) => {
    setSelectedNala((prev) => pickSelectedNala(nalas, prev));
  }, []);

  useLayoutEffect(() => {
    if (liveWeather) return;
    if (skipHourSyncRef.current) {
      skipHourSyncRef.current = false;
      return;
    }
    setAppState(buildState(hour, false));
  }, [hour, liveWeather]);

  useLayoutEffect(() => {
    if (pinConsumed.current) {
      syncSelectedFromNalas(viewState.nalas);
      return;
    }
    const pin = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("pin") : null;
    if (pin) {
      const match = viewState.nalas.find((n) => n.id === pin);
      if (match) {
        setSelectedNala(match);
        pinConsumed.current = true;
        return;
      }
    } else {
      pinConsumed.current = true;
    }
    syncSelectedFromNalas(viewState.nalas);
  }, [viewState.nalas, syncSelectedFromNalas]);

  const fetchLiveWeather = useCallback(async () => {
    try {
      const res = await fetch("/api/weather");
      if (res.ok) {
        const weather = await res.json();
        setAppState((prev) => {
          const next = applyLiveWeather(prev, weather);
          syncSelectedFromNalas(next.nalas);
          return next;
        });
      }
    } catch (err) {
      console.warn("Error fetching live weather:", err);
    }
  }, [syncSelectedFromNalas]);

  useEffect(() => {
    if (!isPlaying) return;
    const order = [-6, -4, -2, 0];
    const timer = window.setInterval(() => {
      setHour((h) => {
        const i = order.indexOf(h);
        const nextH = i < 0 || i >= order.length - 1 ? 0 : order[i + 1];
        if (nextH === 0) setIsPlaying(false);
        return nextH;
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const toggleLiveWeather = () => {
    if (!liveWeather) {
      setIsPlaying(false);
      setLiveWeather(true);
      fetchLiveWeather();
    } else {
      setLiveWeather(false);
    }
  };

  const handleSelectHour = (newHour: number) => {
    setLiveWeather(false);
    setIsPlaying(false);
    setHour(newHour);
  };

  const handleDispatchNala = (nalaId: string) => {
    dispatchPin(nalaId);
  };

  const proofs = viewState.proofs.slice(0, 2);
  const reportedIds = new Set(Object.keys(ops.reports));

  return (
    <div className="flex h-full min-h-0 flex-col bg-ink">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-2.5 lg:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
            Hyderabad · GHMC · Monsoon 2026 (Demo)
          </p>
          <h1 className="font-display text-lg font-bold leading-tight tracking-tight text-pretty xl:text-xl">
            Seal the drain before the rain.
          </h1>
          <p className="hidden text-[11px] text-mute sm:block">Cleaner drains. Safer cities. Stronger communities.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <ReplayClock
            hour={hour}
            setHour={handleSelectHour}
            onStep={handleSelectHour}
            onSelectHour={handleSelectHour}
            playing={isPlaying}
            live={liveWeather}
            onPlay={() => {
              setLiveWeather(false);
              setIsPlaying((p) => {
                if (!p && hour === 0) handleSelectHour(-6);
                return !p;
              });
            }}
          />

          <div className="flex items-center gap-2 border-l border-line/70 pl-4">
            <span className="text-[11px] text-mute">Go live</span>
            <button
              type="button"
              role="switch"
              aria-checked={liveWeather}
              aria-label="Go live weather"
              onClick={toggleLiveWeather}
              className={`relative h-6 w-11 rounded-full transition ${liveWeather ? "bg-teal" : "bg-line"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper transition ${liveWeather ? "left-5" : "left-0.5"}`}
              />
            </button>
            <p className="hidden max-w-[9.5rem] text-[10px] leading-snug text-mute xl:block">
              {liveWeather ? "Live weather. Replay is paused." : "Using demo scenario. Switch to live weather anytime."}
            </p>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 pb-[6.5rem] lg:h-full lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden lg:p-4 lg:pb-4">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 lg:h-full">
          <div className="relative isolate z-0 h-[min(46vh,420px)] min-h-[280px] overflow-hidden rounded-2xl border border-line/80 bg-elevated lg:h-auto lg:min-h-0 lg:flex-1">
            <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex flex-col gap-2 sm:inset-x-3 sm:top-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-line bg-panel/90 p-0.5 text-[11px] backdrop-blur">
                  {(
                    [
                      ["risk", "Risk"],
                      ["rainfall", "Rainfall"],
                      ["wbgt", "WBGT"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLayer(id)}
                      className={`rounded-md px-2.5 py-1 ${layer === id ? "bg-elevated font-semibold text-paper" : "text-mute hover:text-paper"}`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLayersOpen((v) => !v)}
                    className={`rounded-md px-2.5 py-1 ${layersOpen ? "bg-elevated text-paper" : "text-mute hover:text-paper"}`}
                  >
                    Layers
                  </button>
                </div>
                {layersOpen && (
                  <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-panel/95 px-2 py-1.5 font-mono text-[10px] backdrop-blur">
                    {(["RED", "YELLOW", "WATCH", "sealed"] as const).map((key) => (
                      <label key={key} className="flex items-center gap-1 text-mute">
                        <input
                          type="checkbox"
                          checked={visible[key]}
                          onChange={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
                        />
                        {key === "sealed" ? "SEALED" : key}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="pointer-events-auto w-full sm:w-44 sm:shrink-0">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search drains…"
                  aria-label="Search drains, wards"
                  className="w-full rounded-lg border border-line bg-panel/90 px-3 py-1.5 text-[12px] text-paper outline-none placeholder:text-mute backdrop-blur focus:border-teal"
                />
              </div>
            </div>

            <DynamicMap
              nalas={viewState.nalas}
              selectedNala={selectedNala}
              onSelectNala={setSelectedNala}
              splitView={viewState.splitView || hour === 0}
              hour={viewState.hour}
              query={query}
              layer={layer}
              visible={visible}
            />

            {hour === 0 && (
              <div className="pointer-events-none absolute right-3 top-[6.75rem] z-10 max-w-[14rem] rounded-lg border border-danger/40 bg-danger/15 px-2.5 py-2 font-mono text-[10px] text-paper sm:top-14">
                T–0 split · sealed {drains} stay at 0 m · unsealed RED pins flood
              </div>
            )}
            {layer === "rainfall" && hour !== 0 && (
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-lagoon/30 bg-panel/90 px-2.5 py-1.5 font-mono text-[10px] text-mute">
                Rainfall · halo size = p90 mm
              </div>
            )}
            {layer === "wbgt" && (
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-amber/30 bg-panel/90 px-2.5 py-1.5 font-mono text-[10px] text-mute">
                WBGT · HeatGuard is city-wide; HOLD pins stay red
              </div>
            )}
          </div>

          {proofs.length > 0 ? (
            <RecentVerifications proofs={proofs} nalas={viewState.nalas} />
          ) : (
            <p className="hidden px-1 font-mono text-[10px] text-mute md:block">
              Recent verifications appear at T–2h once after-photos clear escrow.
            </p>
          )}
        </div>

        <div className="relative z-10 flex min-h-0 flex-col gap-3 lg:overflow-y-auto scrollbar-thin">
          <div className="flex min-h-[16.5rem] flex-col lg:min-h-[18rem] lg:flex-[1.35]">
            <Queue
              nalas={viewState.nalas}
              selectedId={selectedNala?.id ?? null}
              onSelectNala={setSelectedNala}
              onDispatchNala={handleDispatchNala}
              search={query}
              onSearch={setQuery}
              reportedIds={reportedIds}
            />
          </div>
          <HeatGuardCard weather={viewState.weather} />
          <ConditionsCard weather={viewState.weather} live={liveWeather} />
        </div>
      </div>

      <footer className="hidden shrink-0 items-center justify-between border-t border-line/70 px-5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute lg:flex">
        <span>SEAL · Making cities flood-ready, together.</span>
        <span>Earth Forward · Waste Reduction · Flood Resilience · Informal Livelihoods</span>
      </footer>
    </div>
  );
}

function RecentVerifications({
  proofs,
  nalas,
}: {
  proofs: AppState["proofs"];
  nalas: RankedNala[];
}) {
  return (
    <section className="board-card hidden rounded-2xl p-3 md:block">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">Recent Verifications</h2>
        <Link href="/ledger" className="text-[11px] text-teal">
          View all →
        </Link>
      </div>
      {proofs.length === 0 ? (
        <p className="text-[11px] text-mute">No after-photos verified at this beat. Step Replay to T–2h or T–0.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {proofs.map((p) => {
            const n = nalas.find((x) => x.id === p.nalaId);
            return (
              <article key={p.nalaId} className="flex gap-3 rounded-xl border border-line/70 bg-ink/30 p-2">
                <div className="flex w-[7.5rem] shrink-0 overflow-hidden rounded-lg border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.beforeUrl} alt="" className="h-16 w-1/2 object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.afterUrl} alt="" className="h-16 w-1/2 object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-mute">{p.nalaId}</span>
                    <span className="rounded-full bg-teal/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-teal">
                      Verified
                    </span>
                  </div>
                  <p className="truncate text-[12px] font-medium">{n?.ward ?? n?.nameEn}</p>
                  <p className="font-mono text-[11px] text-amber">₹{p.paidInr.toLocaleString("en-IN")} released to crew</p>
                  <Link href="/ledger" className="text-[11px] text-teal">
                    View in Ledger
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
