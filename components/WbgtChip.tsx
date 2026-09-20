"use client";

import React, { useState } from "react";
import type { WeatherPacket } from "@/lib/types";

interface WbgtChipProps {
  weather: WeatherPacket;
  compact?: boolean;
}

export function WbgtChip({ weather, compact = false }: WbgtChipProps) {
  const [showDetail, setShowDetail] = useState(false);

  const getSignalStyle = () => {
    switch (weather.crewSignal) {
      case "HOLD":
        return {
          pill: "bg-danger/15 border-danger text-danger",
          indicator: "bg-danger animate-ping",
          title: "HEATGUARD HOLD",
          subtitle: "Outdoor work suspended",
        };
      case "SHADE_BREAK":
        return {
          pill: "bg-amber/15 border-amber text-amber",
          indicator: "bg-amber",
          title: "SHADE BREAK",
          subtitle: "45m work / 15m hydrate",
        };
      case "WORK":
      default:
        return {
          pill: "bg-teal/15 border-teal text-teal",
          indicator: "bg-teal",
          title: "CREW WORK",
          subtitle: "Normal operations",
        };
    }
  };

  const style = getSignalStyle();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setShowDetail(!showDetail)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-md border font-mono text-xs cursor-pointer transition-all ${style.pill}`}
      >
        <span className="relative flex h-2 w-2">
          {weather.crewSignal === "HOLD" && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.indicator}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${style.indicator}`} />
        </span>
        <span className="font-bold">{weather.wbgtC}°C WBGT</span>
        <span className="font-semibold">{style.title}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <div
        onClick={() => setShowDetail(!showDetail)}
        className={`hud-glass cursor-pointer rounded-hud p-3 transition hover:border-line ${style.pill}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {weather.crewSignal === "HOLD" && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.indicator}`} />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${style.indicator}`} />
            </span>
            <div>
              <div className="text-xs font-mono font-bold tracking-wider">{style.title}</div>
              <div className="text-[11px] text-mute">{style.subtitle}</div>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-sm font-bold">{weather.wbgtC}°C WBGT</div>
            <div className="text-[10px] text-mute">
              {weather.tempC}°C Air · {weather.humidity}% RH
            </div>
          </div>
        </div>

        {/* Rain p90 callout */}
        <div className="mt-2 pt-2 border-t border-line/40 flex items-center justify-between text-xs font-mono">
          <span className="text-mute">WN3 Rain p90:</span>
          <span className="text-teal font-semibold">{weather.precipP90Mm.toFixed(1)} mm/hr</span>
        </div>
      </div>

      {/* Expanded HeatGuard policy explainer */}
      {showDetail && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 p-3.5 rounded-lg bg-panel border border-line shadow-2xl text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <span className="font-bold text-white uppercase tracking-wider">HeatGuard Safety Protocol</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail(false);
              }}
              className="text-mute hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-mute leading-relaxed">
            {weather.crewReason}
          </p>
          <div className="mt-3 p-2 rounded bg-ink border border-line text-[11px] text-amber">
            <span className="font-bold">Dual-Core Guard:</span> Heat safety supersedes all storm urgency. Red-alert storm drains cannot force crews into lethal wet-bulb heat.
          </div>
        </div>
      )}
    </div>
  );
}
