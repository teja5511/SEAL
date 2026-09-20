"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { applyLiveWeather, buildState } from "@/lib/store";
import type { AppState, MapLayer, RankedNala } from "@/lib/types";
import { DynamicMap } from "@/components/DynamicMap";
import { Queue } from "@/components/Queue";
import { ReplayClock } from "@/components/ReplayClock";
import { HeatGuardCard } from "@/components/HeatGuardCard";
import { ConditionsCard } from "@/components/ConditionsCard";
import { useDrainCopy } from "@/components/LocaleContext";

export default function CommandPage() {
  const { drains } = useDrainCopy();
  const [hour, setHour] = useState<number>(-4);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [liveWeather, setLiveWeather] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(() => buildState(-4, false));
  const [selectedNala, setSelectedNala] = useState<RankedNala | null>(() => buildState(-4, false).nalas[0] ?? null);
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState<MapLayer>("risk");
  const [layersOpen, setLayersOpen] = useState(false);
  const [visible, setVisible] = useState({ RED: true, YELLOW: true, WATCH: true, sealed: true });
  const selectedNalaRef = useRef<RankedNala | null>(selectedNala);

  useEffect(() => {
    selectedNalaRef.current = selectedNala;
  }, [selectedNala]);

  useEffect(() => {
    if (liveWeather) return;
    const nextState = buildState(hour, false);
    setAppState(nextState);
    const curr = selectedNalaRef.current;
    if (!curr || !nextState.nalas.some((n) => n.id === curr.id)) {
      setSelectedNala(nextState.nalas[0] ?? null);
    } else {
      const refreshed = nextState.nalas.find((n) => n.id === curr.id);
      if (refreshed) setSelectedNala(refreshed);
    }
  }, [hour, liveWeather]);

  const fetchLiveWeather = useCallback(async () => {
    try {
      const res = await fetch("/api/weather");
      if (res.ok) {
        const weather = await res.json();
        setAppState((prev) => {
          const next = applyLiveWeather(prev, weather);
          const curr = selectedNalaRef.current;
          if (curr) {
            const refreshed = next.nalas.find((n) => n.id === curr.id);
            if (refreshed) setSelectedNala(refreshed);
          } else {
            setSelectedNala(next.nalas[0] ?? null);
          }
          return next;
        });
      }
    } catch (err) {
      console.warn("Error fetching live weather:", err);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const order = [-6, -4, -2, 0];
    const timer = window.setInterval(() => {
      setHour((h) => {
        const i = order.indexOf(h);
        const nextH = i < 0 || i >= order.length - 1 ? 0 : order[i + 1];
        if (nextH === 0) setIsPlaying(false);
        const nextState = buildState(nextH, false);
        setAppState(nextState);
        const curr = selectedNalaRef.current;
        if (!curr || !nextState.nalas.some((n) => n.id === curr.id)) {
          setSelectedNala(nextState.nalas[0] ?? null);
        } else {
          const refreshed = nextState.nalas.find((n) => n.id === curr.id);
          if (refreshed) setSelectedNala(refreshed);
        }
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
      const restored = buildState(hour, false);
      setAppState(restored);
      const curr = selectedNalaRef.current;
      if (!curr || !restored.nalas.some((n) => n.id === curr.id)) {
        setSelectedNala(restored.nalas[0] ?? null);
      } else {
        const refreshed = restored.nalas.find((n) => n.id === curr.id);
        if (refreshed) setSelectedNala(refreshed);
      }
    }
  };

  const handleSelectHour = (newHour: number) => {
    setLiveWeather(false);
    setIsPlaying(false);
    setHour(newHour);
    const nextState = buildState(newHour, false);
    setAppState(nextState);
    const curr = selectedNalaRef.current;
    if (!curr || !nextState.nalas.some((n) => n.id === curr.id)) {
      setSelectedNala(nextState.nalas[0] ?? null);
    } else {
      const refreshed = nextState.nalas.find((n) => n.id === curr.id);
      if (refreshed) setSelectedNala(refreshed);
    }
  };

  const handleDispatchNala = (nalaId: string) => {
    setAppState((prev) => ({
      ...prev,
      nalas: prev.nalas.map((n) => (n.id === nalaId ? { ...n, status: "dispatched" } : n)),
    }));
    if (selectedNala?.id === nalaId) {
      setSelectedNala((prev) => (prev ? { ...prev, status: "dispatched" } : null));
    }
  };

  const proofs = appState.proofs.slice(0, 2);

  return (
    <div className="flex h-full min-h-0 flex-col bg-ink">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-2.5 lg:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
            Hyderabad · GHMC · Monsoon 2026 (Demo)
          </p>
          <h1 className="font-display text-lg font-bold leading-tight tracking-tight sm:text-xl">
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

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden lg:p-4">
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-2xl border border-line/80 bg-elevated lg:min-h-0">
            <div className="pointer-events-auto absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
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
                <div className="flex gap-2 rounded-lg border border-line bg-panel/95 px-2 py-1.5 font-mono text-[10px] backdrop-blur">
                  {(["RED", "YELLOW", "WATCH", "sealed"] as const).map((key) => (
                    <label key={key} className="flex items-center gap-1 text-mute">
                      <input
                        type="checkbox"
                        checked={visible[key]}
                        onChange={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
                      />
                      {key === "sealed" ? "Cleared" : key === "WATCH" ? "Low" : key === "RED" ? "High Risk" : "Watch"}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="pointer-events-auto absolute right-3 top-3 z-20 w-[min(16rem,calc(100%-1.5rem))]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drains, areas, wards…"
                className="w-full rounded-lg border border-line bg-panel/90 px-3 py-1.5 text-[12px] text-paper outline-none placeholder:text-mute backdrop-blur focus:border-teal"
              />
            </div>

            <DynamicMap
              nalas={appState.nalas}
              selectedNala={selectedNala}
              onSelectNala={setSelectedNala}
              splitView={appState.splitView || hour === 0}
              hour={appState.hour}
              query={query}
              layer={layer}
              visible={visible}
            />

            {hour === 0 && (
              <div className="pointer-events-none absolute right-3 top-14 z-10 max-w-[14rem] rounded-lg border border-danger/40 bg-danger/15 px-2.5 py-2 font-mono text-[10px] text-paper">
                T–0 split · sealed {drains} stay at 0 m · unsealed RED pins flood
              </div>
            )}
          </div>

          {proofs.length > 0 ? (
            <RecentVerifications proofs={proofs} nalas={appState.nalas} />
          ) : (
            <p className="hidden px-1 font-mono text-[10px] text-mute md:block">
              Recent verifications appear at T–2h once after-photos clear escrow.
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto scrollbar-thin">
          <div className="flex min-h-[280px] flex-col lg:min-h-0 lg:flex-[1.35]">
            <Queue
              nalas={appState.nalas}
              selectedId={selectedNala?.id ?? null}
              onSelectNala={setSelectedNala}
              onDispatchNala={handleDispatchNala}
              search={query}
              onSearch={setQuery}
            />
          </div>
          <HeatGuardCard weather={appState.weather} />
          <ConditionsCard weather={appState.weather} live={liveWeather} />
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
