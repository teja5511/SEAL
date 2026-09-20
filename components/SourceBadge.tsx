import React from "react";
import type { DataSource } from "@/lib/types";

interface SourceBadgeProps {
  source: DataSource;
  interactive?: boolean;
  onToggleLive?: () => void;
  isLive?: boolean;
}

export function SourceBadge({ source, interactive = false, onToggleLive, isLive = false }: SourceBadgeProps) {
  const getBadgeConfig = () => {
    switch (source) {
      case "weathernext3":
        return {
          label: "WeatherNext 3",
          sub: "0.1° / 0.05° GEE",
          dotColor: "bg-teal animate-pulse",
          borderColor: "border-teal/30",
          bgColor: "bg-teal/10",
          textColor: "text-teal",
        };
      case "open-meteo":
        return {
          label: "Open-Meteo",
          sub: "Nowcast Hyderabad",
          dotColor: "bg-amber animate-pulse",
          borderColor: "border-amber/30",
          bgColor: "bg-amber/10",
          textColor: "text-amber",
        };
      case "gee-cache":
        return {
          label: "GEE Telemetry Cache",
          sub: "Dynamic World / SRTM",
          dotColor: "bg-teal/70",
          borderColor: "border-line",
          bgColor: "bg-panel",
          textColor: "text-mute",
        };
      case "replay":
      default:
        return {
          label: "Replay Storm",
          sub: "Hyd 2026 Scenario",
          dotColor: "bg-lagoon",
          borderColor: "border-teal/30",
          bgColor: "bg-teal/10",
          textColor: "text-lagoon",
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono tracking-tight transition-colors ${config.bgColor} ${config.borderColor}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
        <span className={`font-semibold ${config.textColor}`}>{config.label}</span>
        <span className="text-mute/80 hidden sm:inline">| {config.sub}</span>
      </div>

      {interactive && onToggleLive && (
        <button
          onClick={onToggleLive}
          type="button"
          className={`text-xs font-mono px-2 py-1 rounded-md border transition-all ${
            isLive
              ? "bg-teal/20 text-teal border-teal/40 font-medium"
              : "bg-panel text-mute hover:text-white border-line hover:border-mute/40"
          }`}
          title="Toggle between live weather API and Replay scenario"
        >
          {isLive ? "● LIVE ACTIVE" : "GO LIVE"}
        </button>
      )}
    </div>
  );
}
