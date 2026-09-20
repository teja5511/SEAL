"use client";

import { useMemo } from "react";
import { buildState, ledgerStats } from "@/lib/store";
import { useDrainCopy, LocalCaption } from "@/components/LocaleContext";

export default function AnalyticsPage() {
  const { drain, drains } = useDrainCopy();

  const t4 = useMemo(() => buildState(-4), []);
  const t0 = useMemo(() => buildState(0), []);
  const stats = useMemo(() => ledgerStats(t0), [t0]);

  const nalas = t4?.nalas ?? [];
  const total = nalas.length;
  const red = nalas.filter((n) => n.alert === "RED").length;
  const yellow = nalas.filter((n) => n.alert === "YELLOW").length;
  const watch = nalas.filter((n) => n.alert === "WATCH").length;

  const redPct = total > 0 ? Math.round((red / total) * 100) : 0;
  const yellowPct = total > 0 ? Math.round((yellow / total) * 100) : 0;
  const watchPct = total > 0 ? Math.max(0, 100 - redPct - yellowPct) : 0;

  const maxRisk = total > 0 ? Math.max(...nalas.map((n) => n.risk), 1) : 1;
  const unsealedRed = Math.max(0, stats.redCount - stats.sealedCount);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal">
          Ops pulse · T–4h dispatch to T–0 proof
        </p>
        <span className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
          Core 1 Immutable Read
        </span>
      </div>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
        Pre-storm action scoreboard.
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-mute">
        Analytics is a deterministic read of Core 1 — rank, heat safety, and escrow. Gemini cannot invent risk or alter
        these metrics.
      </p>

      {/* Video-Ready Scoreboard */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-mute">
            Video Scoreboard · Key Operations Metrics
          </h2>
          <span className="font-mono text-[10px] text-teal">T–4h snapshot vs T–0 close</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Tile 1: Households Saved */}
          <div className="board-card rounded-2xl border-teal/30 bg-teal/5 p-5 shadow-glow">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-teal">Households saved</span>
              <span className="rounded bg-teal/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-teal">T–0</span>
            </div>
            <div className="mt-2 font-display text-4xl font-bold tabular-nums text-teal">
              {stats.householdsSaved.toLocaleString("en-IN")}
            </div>
            <p className="mt-1 text-xs text-mute">Protected from flood inundation by verified clears.</p>
          </div>

          {/* Tile 2: Verified Jobs at T-0 */}
          <div className="board-card rounded-2xl border-teal/30 bg-elevated/90 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-teal">Verified jobs at T–0</span>
              <span className="rounded bg-teal/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-teal">
                Proof verified
              </span>
            </div>
            <div className="mt-2 font-display text-4xl font-bold tabular-nums text-paper">
              {stats.jobs}
            </div>
            <p className="mt-1 text-xs text-mute">Pay released strictly upon authenticated after-photo proof.</p>
          </div>

          {/* Tile 3: Risk Mix Scoreboard */}
          <div className="board-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-mute">Risk mix at T–4h</span>
              <span className="font-mono text-[10px] text-mute">{total} {drains}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold tabular-nums text-danger">{red}</span>
              <span className="font-mono text-xs text-danger font-semibold">RED</span>
              <span className="text-mute">·</span>
              <span className="font-display text-3xl font-bold tabular-nums text-amber">{yellow}</span>
              <span className="font-mono text-xs text-amber font-semibold">YELLOW</span>
              <span className="text-mute">·</span>
              <span className="font-display text-3xl font-bold tabular-nums text-teal">{watch}</span>
              <span className="font-mono text-xs text-teal font-semibold">WATCH</span>
            </div>
            <p className="mt-1 text-xs text-mute">Critical alerts queued ahead of the rain band.</p>
          </div>

          {/* Tile 4: Escrow Released */}
          <div className="board-card rounded-2xl p-5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-mute">Escrow released</span>
            <div className="mt-2 font-display text-3xl font-bold tabular-nums text-amber">
              ₹{stats.rupees.toLocaleString("en-IN")}
            </div>
            <p className="mt-1 text-xs text-mute">Indian rupees disbursed to crew wallets on proof.</p>
          </div>

          {/* Tile 5: Plastic Pulled */}
          <div className="board-card rounded-2xl p-5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-mute">Plastic pulled</span>
            <div className="mt-2 font-display text-3xl font-bold tabular-nums text-paper">
              {stats.kgPlastic.toLocaleString("en-IN")} kg
            </div>
            <p className="mt-1 text-xs text-mute">Recovered by informal crews before waterway discharge.</p>
          </div>

          {/* Tile 6: Monitored Network */}
          <div className="board-card rounded-2xl p-5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-mute">Monitored {drains}</span>
            <div className="mt-2 font-display text-3xl font-bold tabular-nums text-paper">
              {total}
            </div>
            <p className="mt-1 text-xs text-mute">Active catchment outlets tracked in Hyderabad.</p>
          </div>
        </div>
      </section>

      {/* Risk Mix Distribution Bar */}
      <section className="board-card mt-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Risk mix breakdown · T–4h dispatch</h2>
            <p className="mt-0.5 text-[11px] text-mute">
              Deterministic alert distribution. Map markers preserve exact risk tiers.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-danger">
              <span className="inline-block h-2 w-2 rounded-full bg-danger" />
              RED {red} ({redPct}%)
            </span>
            <span className="flex items-center gap-1 text-amber">
              <span className="inline-block h-2 w-2 rounded-full bg-amber" />
              YELLOW {yellow} ({yellowPct}%)
            </span>
            <span className="flex items-center gap-1 text-teal">
              <span className="inline-block h-2 w-2 rounded-full bg-teal" />
              WATCH {watch} ({watchPct}%)
            </span>
          </div>
        </div>

        {/* Stacked Visual Bar */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-ink flex" aria-label="Risk mix stacked bar">
          {total > 0 ? (
            <>
              <div
                className="h-full bg-danger transition-all duration-500"
                style={{ width: `${redPct}%` }}
                title={`RED: ${red} (${redPct}%)`}
              />
              <div
                className="h-full bg-amber transition-all duration-500"
                style={{ width: `${yellowPct}%` }}
                title={`YELLOW: ${yellow} (${yellowPct}%)`}
              />
              <div
                className="h-full bg-teal transition-all duration-500"
                style={{ width: `${watchPct}%` }}
                title={`WATCH: ${watch} (${watchPct}%)`}
              />
            </>
          ) : (
            <div className="h-full w-full bg-line/40" />
          )}
        </div>

        {/* Breakdown Detail Rows */}
        <div className="mt-4 space-y-2.5">
          <Bar
            label="RED · flood if unsealed"
            n={red}
            max={total}
            pct={redPct}
            className="bg-danger"
            description="Immediate overflow hazard if rain band arrives unsealed"
          />
          <Bar
            label="YELLOW · queue before the band"
            n={yellow}
            max={total}
            pct={yellowPct}
            className="bg-amber"
            description="Moderate clog index; pre-staged for secondary dispatch"
          />
          <Bar
            label="WATCH · hold the line"
            n={watch}
            max={total}
            pct={watchPct}
            className="bg-teal"
            description="Low clog level; catchment holding buffer"
          />
        </div>
      </section>

      {/* Action vs Inaction Comparison Cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="board-card rounded-2xl border-teal/40 bg-teal/10 p-5 shadow-glow">
          <div className="font-mono text-[10px] uppercase tracking-widest text-teal">If we act</div>
          <div className="mt-2 font-display text-3xl font-bold text-paper">
            {stats.sealedCount === 1 ? `1 ${drain} sealed` : `${stats.sealedCount} ${drains} sealed`}
          </div>
          <p className="mt-1 text-sm text-mute">
            {stats.householdsSaved.toLocaleString("en-IN")} households stay dry at T–0. Escrow paid only on verified
            after-photos.
          </p>
        </div>

        <div className="board-card rounded-2xl border-danger/40 bg-danger/10 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-danger">If we don’t</div>
          <div className="mt-2 font-display text-3xl font-bold text-paper">
            {stats.householdsAtRisk.toLocaleString("en-IN")} at risk
          </div>
          <p className="mt-1 text-sm text-mute">
            {unsealedRed === 1
              ? `1 unsealed RED ${drain} still backs up when the rain band arrives.`
              : `${unsealedRed} unsealed RED ${drains} still back up when the rain band arrives.`}
          </p>
        </div>
      </div>

      {/* Dual-Core Immutable Invariant Banner */}
      <div className="board-card mt-4 rounded-2xl border-line/90 bg-elevated/70 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/20 text-xs font-bold text-teal">
            ✓
          </span>
          <div className="text-xs leading-relaxed text-mute">
            <span className="font-semibold text-paper">Dual-Core Guarantee:</span> Core 1 computes risk scores
            (0–100) deterministically from GEE topography, slope drop, and WeatherNext 3 precipitation. Gemini never
            invents risk or alters financial escrow.
          </div>
        </div>
      </div>

      {/* Highest Core 1 Scores Table */}
      <section className="board-card mt-4 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Highest Core 1 scores</h2>
            <p className="mt-0.5 text-[11px] text-mute">
              Priority ranking from physical catchment risk at T–4h.
            </p>
          </div>
          <span className="font-mono text-[10px] text-mute">
            Showing top {Math.min(6, total)} of {total}
          </span>
        </div>

        {total === 0 ? (
          <p className="mt-4 py-8 text-center text-sm text-mute">
            No {drains} found in this catchment.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {nalas.slice(0, 6).map((n, i) => (
              <li
                key={n.id}
                className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-mute">
                      #{i + 1} · {n.id}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                        n.alert === "RED"
                          ? "bg-danger/20 text-danger"
                          : n.alert === "YELLOW"
                          ? "bg-amber/20 text-amber"
                          : "bg-teal/20 text-teal"
                      }`}
                    >
                      {n.alert}
                    </span>
                    <span className="font-mono text-[10px] text-mute">
                      ~{n.households.toLocaleString("en-IN")} homes
                    </span>
                  </div>
                  <div className="truncate text-[13px] font-medium text-paper">{n.nameEn}</div>
                  <LocalCaption text={n.nameTe} className="text-[11px] text-mute" />
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold tabular-nums text-danger">{n.risk}</div>
                  <div className="mt-1 h-1 w-24 rounded-full bg-ink" aria-hidden>
                    <div
                      className="h-1 rounded-full bg-danger"
                      style={{ width: `${maxRisk > 0 ? (n.risk / maxRisk) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Bar({
  label,
  n,
  max,
  pct,
  className,
  description,
}: {
  label: string;
  n: number;
  max: number;
  pct: number;
  className: string;
  description: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-mute">{label}</span>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-mute">{pct}%</span>
          <span className="font-bold text-paper">{n}</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink">
        <div
          className={`h-full rounded-full ${className} transition-all duration-300`}
          style={{ width: `${max > 0 ? (n / max) * 100 : 0}%` }}
        />
      </div>
      <p className="mt-0.5 text-[10px] text-mute/80">{description}</p>
    </div>
  );
}
