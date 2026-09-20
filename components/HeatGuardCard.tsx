"use client";

import type { WeatherPacket } from "@/lib/types";

export function HeatGuardCard({ weather }: { weather: WeatherPacket }) {
  const hold = weather.crewSignal === "HOLD";
  const shade = weather.crewSignal === "SHADE_BREAK";
  const pct = Math.max(0, Math.min(100, ((weather.wbgtC - 22) / (36 - 22)) * 100));

  return (
    <section
      className={`overflow-hidden rounded-2xl border p-3.5 ${
        hold ? "border-danger/50 bg-danger/10" : shade ? "border-amber/40 bg-amber/10" : "border-teal/30 bg-teal/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg ${hold ? "bg-danger/20 text-danger" : "bg-teal/15 text-teal"}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2.2c.8 0 1.4.6 1.4 1.4v5.1a2.4 2.4 0 1 1-2.8 0V3.6c0-.8.6-1.4 1.4-1.4Z" stroke="currentColor" />
            </svg>
          </span>
          <div>
            <h2 className="text-[13px] font-semibold">HeatGuard</h2>
            <p className="mt-0.5 max-w-[16rem] text-[11px] leading-snug text-mute">
              Worker safety first. No dispatch in unsafe heat.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute">WBGT</div>
          <div className={`font-display text-2xl font-bold tabular-nums leading-none ${hold ? "text-danger" : "text-paper"}`}>
            {weather.wbgtC.toFixed(0)}°C
          </div>
          <div
            className={`mt-1 inline-flex rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
              hold ? "bg-danger text-white" : shade ? "bg-amber text-ink" : "bg-teal text-ink"
            }`}
          >
            {weather.crewSignal === "SHADE_BREAK" ? "SHADE_BREAK" : weather.crewSignal}
          </div>
        </div>
      </div>
      {hold && <p className="mt-2 text-[11px] text-danger/90">Too hot for outdoor work.</p>}

      <div className="relative mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-gradient-to-r from-teal via-amber to-danger" />
        <span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
        <div className="mt-2 grid grid-cols-3 font-mono text-[9px] uppercase tracking-wider text-mute">
          <span>&lt; 28°C WORK</span>
          <span className="text-center">28 – 32°C SHADE_BREAK</span>
          <span className="text-right">≥ 32°C HOLD</span>
        </div>
      </div>
    </section>
  );
}
