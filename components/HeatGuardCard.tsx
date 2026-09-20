"use client";

import type { WeatherPacket } from "@/lib/types";

function thumbPct(wbgtC: number) {
  if (wbgtC < 28) {
    const t = Math.max(0, Math.min(1, (wbgtC - 20) / 8));
    return 8 + t * 20;
  }
  if (wbgtC < 32) {
    const t = (wbgtC - 28) / 4;
    return 42 + t * 18;
  }
  const t = Math.max(0, Math.min(1, (wbgtC - 32) / 6));
  return 74 + t * 18;
}

export function HeatGuardCard({ weather }: { weather: WeatherPacket }) {
  const hold = weather.crewSignal === "HOLD";
  const shade = weather.crewSignal === "SHADE_BREAK";
  const pct = thumbPct(weather.wbgtC);
  const shown = weather.wbgtC.toFixed(1);
  const status = hold ? "HOLD" : shade ? "SHADE" : "WORK";
  const hint = hold
    ? "No dispatch in unsafe heat. Map redness cannot override this."
    : shade
      ? "45 min work / 15 min shade and water."
      : "Outdoor drain work is allowed.";

  return (
    <section
      className={`rounded-2xl border p-3.5 ${
        hold ? "border-danger/50 bg-danger/10" : shade ? "border-amber/40 bg-amber/10" : "border-teal/30 bg-teal/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
              hold ? "bg-danger/20 text-danger" : shade ? "bg-amber/20 text-amber" : "bg-teal/15 text-teal"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M7.2 2.2h1.6c.4 0 .7.3.7.7v6.2a2.6 2.6 0 1 1-3 0V2.9c0-.4.3-.7.7-.7Z" stroke="currentColor" />
              <circle cx="8" cy="11.4" r="1.3" fill="currentColor" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold">HeatGuard</h2>
            <p className="mt-0.5 text-[11px] leading-snug text-mute">{hint}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[10px] uppercase tracking-wider text-mute">WBGT</div>
          <div className={`font-display text-2xl font-bold tabular-nums leading-none ${hold ? "text-danger" : shade ? "text-amber" : "text-paper"}`}>
            {shown}°C
          </div>
          <div
            className={`mt-1 inline-flex whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
              hold ? "bg-danger text-white" : shade ? "bg-amber text-ink" : "bg-teal text-ink"
            }`}
          >
            {status}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div
          className="relative h-5"
          role="meter"
          aria-label="Wet bulb globe temperature"
          aria-valuemin={20}
          aria-valuemax={38}
          aria-valuenow={weather.wbgtC}
          aria-valuetext={`${shown} degrees Celsius, ${status}`}
        >
          <div className="absolute inset-x-0 top-[7px] flex h-1.5 overflow-hidden rounded-full">
            <span className="w-[33%] bg-teal" />
            <span className="w-[33%] bg-amber" />
            <span className="w-[34%] bg-danger" />
          </div>
          <span
            className="absolute top-0 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-paper bg-ink shadow"
            style={{ left: `${pct}%` }}
            title={`WBGT ${shown}°C`}
            aria-hidden
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
          <Zone title="Work" range="< 28°C" active={!hold && !shade} tone="text-teal" />
          <Zone title="Shade" range="28–32°C" active={shade} tone="text-amber" />
          <Zone title="Hold" range="≥ 32°C" active={hold} tone="text-danger" />
        </div>
      </div>
    </section>
  );
}

function Zone({
  title,
  range,
  active,
  tone,
}: {
  title: string;
  range: string;
  active: boolean;
  tone: string;
}) {
  return (
    <div className={`rounded-md px-1 py-1 ${active ? "bg-ink/35" : ""}`}>
      <div className={`text-[10px] font-semibold uppercase tracking-wide ${active ? tone : "text-mute"}`}>{title}</div>
      <div className="font-mono text-[9px] tabular-nums text-mute">{range}</div>
    </div>
  );
}
