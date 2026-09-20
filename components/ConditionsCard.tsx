"use client";

import type { WeatherPacket } from "@/lib/types";

function nowcastBars(weather: WeatherPacket) {
  const labels = ["Now", "+1h", "+2h", "+3h", "+4h", "+5h"];
  const hour = weather.forecastHour - 6;
  const designed: Record<number, number[]> = {
    [-6]: [2, 4, 6, 8, 10, 12],
    [-4]: [12, 18, 26, 34, 28, 16],
    [-2]: [20, 26, 34, 40, 32, 22],
    [0]: [22, 18, 12, 8, 6, 4],
  };
  const raw = designed[hour] ?? designed[-4];
  const scaled = raw.map((v) => Math.round((v / Math.max(...raw)) * Math.max(weather.precipP90Mm, 1)));
  return labels.map((label, i) => ({ label, mm: weather.source === "replay" ? raw[i] : scaled[i] }));
}

function windLabel(ms: number) {
  return `${Math.round(ms * 3.6)} km/h`;
}

export function ConditionsCard({ weather, live }: { weather: WeatherPacket; live: boolean }) {
  const bars = nowcastBars(weather);
  const maxMm = Math.max(...bars.map((b) => b.mm), 1);
  const clock = weather.initTime.slice(11, 16) || "16:20";

  return (
    <section className="board-card rounded-2xl p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold">Current Conditions — Hyderabad</h2>
        <span className="font-mono text-[10px] text-mute">
          {live ? "Live data" : "Demo"} / {clock}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <Metric icon="temp" label="Air Temperature" value={`${weather.tempC.toFixed(0)}°C`} />
        <Metric icon="hum" label="Humidity" value={`${weather.humidity}%`} />
        <Metric icon="wbgt" label="WBGT" value={`${weather.wbgtC.toFixed(0)}°C`} warn={weather.wbgtC >= 32} />
        <Metric
          icon="wind"
          label="Wind"
          value={weather.source === "replay" ? `ESE ${windLabel(weather.windMs)}` : windLabel(weather.windMs)}
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-mute">Next 6 hours (precip p90)</p>
        <div className="flex h-14 items-end gap-2">
          {bars.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[9px] text-mute">{b.mm}</span>
              <div
                className="w-full rounded-sm bg-lagoon/80"
                style={{ height: `${Math.max(8, (b.mm / maxMm) * 44)}px` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-2 font-mono text-[9px] text-mute">
          {bars.map((b) => (
            <span key={b.label} className="flex-1 text-center">
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {weather.precipP90Mm >= 20 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-lagoon/20 bg-ink/40 p-2.5">
          <span className="text-lagoon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2.5c2.2 2.6 4.5 5.2 4.5 7.4A4.5 4.5 0 1 1 3.5 9.9C3.5 7.7 5.8 5.1 8 2.5Z" stroke="currentColor" />
            </svg>
          </span>
          <p className="text-[11px] leading-snug text-mute">
            <span className="font-semibold text-paper">Nowcast</span>
            {" · "}
            Higher rainfall in 2–4 hours. High-risk drains are being dispatched.
          </p>
        </div>
      )}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  warn,
}: {
  icon: "temp" | "hum" | "wbgt" | "wind";
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line/80 bg-ink/30 p-2 text-center">
      <div className={`mx-auto mb-1 ${warn ? "text-danger" : "text-lagoon"}`}>
        {icon === "temp" && (
          <svg width="16" height="16" viewBox="0 0 16 16" className="mx-auto" fill="none" aria-hidden>
            <path d="M4 10.5a4 4 0 1 0 8 0c0-1.5-1-2.6-1.6-4.2L9 2.5H7L5.6 6.3C5 7.9 4 9 4 10.5Z" stroke="currentColor" />
          </svg>
        )}
        {icon === "hum" && (
          <svg width="16" height="16" viewBox="0 0 16 16" className="mx-auto" fill="none" aria-hidden>
            <path d="M8 2.5c2.2 2.6 4.5 5.2 4.5 7.4A4.5 4.5 0 1 1 3.5 9.9C3.5 7.7 5.8 5.1 8 2.5Z" stroke="currentColor" />
          </svg>
        )}
        {icon === "wbgt" && (
          <svg width="16" height="16" viewBox="0 0 16 16" className="mx-auto" fill="none" aria-hidden>
            <path d="M8 2.2c.8 0 1.4.6 1.4 1.4v5.1a2.4 2.4 0 1 1-2.8 0V3.6c0-.8.6-1.4 1.4-1.4Z" stroke="currentColor" />
          </svg>
        )}
        {icon === "wind" && (
          <svg width="16" height="16" viewBox="0 0 16 16" className="mx-auto" fill="none" aria-hidden>
            <path d="M2 6h9.5a1.8 1.8 0 1 0-1.8-1.8M2 9.5h11a1.6 1.6 0 1 1-1.6 1.6" stroke="currentColor" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className={`font-display text-sm font-bold tabular-nums ${warn ? "text-danger" : "text-paper"}`}>{value}</div>
      <div className="mt-0.5 text-[9px] leading-tight text-mute">{label}</div>
    </div>
  );
}
