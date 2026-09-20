"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { applyLiveWeather, buildState } from "@/lib/store";
import type { AppState, RankedNala } from "@/lib/types";
import { DynamicMap } from "@/components/DynamicMap";
import { Queue } from "@/components/Queue";
import { ReplayClock } from "@/components/ReplayClock";
import { WbgtChip } from "@/components/WbgtChip";
import { SourceBadge } from "@/components/SourceBadge";
import { LocalCaption, useDrainCopy } from "@/components/LocaleContext";

export default function CommandPage() {
  const { drains } = useDrainCopy();
  const [hour, setHour] = useState<number>(-6);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [liveWeather, setLiveWeather] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(() => buildState(-6, false));
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [selectedNala, setSelectedNala] = useState<RankedNala | null>(null);
  const selectedNalaRef = useRef<RankedNala | null>(selectedNala);

  useEffect(() => {
    selectedNalaRef.current = selectedNala;
  }, [selectedNala]);

  // Sync state when hour changes or liveWeather changes
  useEffect(() => {
    if (liveWeather) return; // Live weather handled separately
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

  // Handle live weather fetch
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

  const handleSelectNala = (nala: RankedNala) => {
    setSelectedNala(nala);
  };

  const handleDispatchNala = (nalaId: string) => {
    setAppState((prev) => ({
      ...prev,
      nalas: prev.nalas.map((n) =>
        n.id === nalaId ? { ...n, status: "dispatched" } : n
      ),
    }));
    if (selectedNala?.id === nalaId) {
      setSelectedNala((prev) => (prev ? { ...prev, status: "dispatched" } : null));
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

  return (
    <div className="relative flex h-[calc(100vh-3.5rem-4.25rem)] overflow-hidden md:h-[calc(100vh-3.5rem-1.75rem)]">
      {/* Full-viewport MapLibre dark streets */}
      <div className="absolute inset-0 z-0 min-h-[420px]">
        <DynamicMap
          nalas={appState.nalas}
          selectedNala={selectedNala}
          onSelectNala={handleSelectNala}
          splitView={appState.splitView || hour === 0}
          hour={appState.hour}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] map-vignette" />

      {/* Floating HUD Top Left: Timeline & Replay Controls */}
      <div className="pointer-events-auto absolute left-4 top-4 z-30 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2">
        <ReplayClock
          hour={hour}
          setHour={handleSelectHour}
          onStep={handleSelectHour}
          onSelectHour={handleSelectHour}
          playing={isPlaying}
          onPlay={() => {
            setLiveWeather(false);
            setIsPlaying((p) => {
              if (!p && hour === 0) {
                handleSelectHour(-6);
              }
              return !p;
            });
          }}
        />
        <div className="flex flex-col gap-2 md:hidden">
          <div className="hud-glass rounded-hud p-1.5 shadow-hud">
            <SourceBadge
              source={appState.weather.source}
              interactive
              isLive={liveWeather}
              onToggleLive={toggleLiveWeather}
            />
          </div>
          <WbgtChip weather={appState.weather} compact />
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 z-20 hidden max-w-[320px] flex-col items-end gap-2 md:flex">
        <div className="hud-glass flex items-center gap-2 rounded-hud p-1.5 shadow-hud">
          <SourceBadge
            source={appState.weather.source}
            interactive
            isLive={liveWeather}
            onToggleLive={toggleLiveWeather}
          />
        </div>

        <WbgtChip weather={appState.weather} />

        {/* Counterfactual split view toggle indicator at T-0 */}
        {appState.hour === 0 && (
          <div className="flex flex-col gap-1 rounded-hud border border-danger/50 bg-danger/15 p-2.5 font-mono text-xs text-paper shadow-hud backdrop-blur">
            <div className="flex items-center justify-between font-bold text-danger">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
                T–0 RAIN IMPACT
              </span>
              <span>SPLIT VIEW</span>
            </div>
            <p className="text-[11px] text-mute">
              Sealed drains allow 0m inundation. Unsealed {drains} back up to 1.4m.
            </p>
          </div>
        )}
      </div>

      {/* Floating Collapsible Side Queue Panel */}
      <div
        className={`absolute bottom-20 left-4 top-[22rem] z-20 w-[min(24rem,calc(100vw-2rem))] transition-all duration-300 pointer-events-auto md:bottom-4 md:top-[13.75rem] md:w-96 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Queue
          nalas={appState.nalas}
          selectedId={selectedNala?.id ?? null}
          onSelectNala={handleSelectNala}
          onDispatchNala={handleDispatchNala}
        />
      </div>

      {/* Sidebar Toggle Handle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`absolute top-[22rem] z-30 hidden py-2 px-1.5 bg-panel border border-line rounded-r-md text-xs font-mono text-mute hover:text-paper transition-all shadow-hud pointer-events-auto md:block md:top-[13.75rem] ${
          sidebarOpen ? "left-[21.5rem] sm:left-[24.5rem]" : "left-0"
        }`}
        title={sidebarOpen ? "Collapse Queue" : "Expand Queue"}
      >
        {sidebarOpen ? "◀" : "▶ QUEUE"}
      </button>

      {/* Floating Inspector Bottom Right when a Nala is Selected */}
      {selectedNala && (
        <div className="hud-glass pointer-events-auto absolute bottom-4 right-4 z-20 hidden w-[22rem] flex-col gap-3 rounded-hud p-4 shadow-hud md:flex">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] text-teal">{selectedNala.id}</div>
              <div className="font-display text-lg font-bold leading-tight text-paper">{selectedNala.nameEn}</div>
              <LocalCaption text={selectedNala.nameTe} className="text-[11px] text-mute" />
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-mute">Core 1</div>
              <div className="font-display text-3xl font-bold tabular-nums text-teal">{selectedNala.risk}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="rounded-lg border border-line bg-ink/50 p-2">
              <div className="text-mute">Clog</div>
              <div className="text-paper">{selectedNala.clog}% · {selectedNala.clogClass}</div>
            </div>
            <div className="rounded-lg border border-line bg-ink/50 p-2">
              <div className="text-mute">Escrow</div>
              <div className="text-amber">₹{selectedNala.payInr}</div>
            </div>
            <div className="rounded-lg border border-line bg-ink/50 p-2">
              <div className="text-mute">Water</div>
              <div className="text-paper">{Math.round(selectedNala.waterProb * 100)}%</div>
            </div>
            <div className="rounded-lg border border-line bg-ink/50 p-2">
              <div className="text-mute">Elevation</div>
              <div className="text-paper">{selectedNala.elevationM}m</div>
            </div>
          </div>

          <p className="font-mono text-[10px] leading-relaxed text-mute">
            risk = ({selectedNala.clog}/10)^1.4 × {selectedNala.precipP90Mm.toFixed(0)}mm × {selectedNala.basinProxy.toFixed(2)}
          </p>

          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-[11px] text-mute">
              Crew <span className="font-semibold text-paper">{selectedNala.crew}</span>
            </span>
            {selectedNala.status === "idle" ? (
              <button
                type="button"
                onClick={() => handleDispatchNala(selectedNala.id)}
                className="rounded-full bg-teal px-3 py-1.5 text-xs font-bold text-ink shadow-glow"
              >
                Dispatch
              </button>
            ) : selectedNala.status === "verified" ? (
              <a href="/ledger" className="rounded-full border border-teal px-3 py-1.5 text-xs font-bold text-teal">
                Ledger proof
              </a>
            ) : (
              <span className="rounded-full border border-line px-2 py-1 font-mono text-[11px] uppercase text-teal">
                {selectedNala.status}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
