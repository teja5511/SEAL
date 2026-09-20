import { buildState, ledgerStats } from "@/lib/store";

export default function AnalyticsPage() {
  const t4 = buildState(-4);
  const t0 = buildState(0);
  const stats = ledgerStats(t0);
  const red = t4.nalas.filter((n) => n.alert === "RED").length;
  const yellow = t4.nalas.filter((n) => n.alert === "YELLOW").length;
  const watch = t4.nalas.filter((n) => n.alert === "WATCH").length;
  const maxRisk = Math.max(...t4.nalas.map((n) => n.risk));

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal">Ops pulse · T–4h snapshot</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">What the next band will cost if we wait.</h1>
      <p className="mt-3 max-w-2xl text-sm text-mute">
        Analytics is a read of Core 1 — rank, heat, and escrow — not a second score. Gemini never writes these numbers.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Drains watched" value={t4.nalas.length} />
        <Tile label="RED now" value={red} tone="danger" />
        <Tile label="Verified at T–0" value={stats.jobs} tone="teal" />
        <Tile label="Households saved" value={stats.householdsSaved} />
      </div>

      <section className="board-card mt-6 rounded-2xl p-5">
        <h2 className="text-sm font-semibold">Risk mix at T–4h</h2>
        <p className="mt-1 text-[11px] text-mute">Count of pins by alert. Shape on the map still carries the same meaning as colour.</p>
        <div className="mt-4 space-y-3">
          <Bar label="RED · flood if unsealed" n={red} max={t4.nalas.length} className="bg-danger" />
          <Bar label="YELLOW · queue before the band" n={yellow} max={t4.nalas.length} className="bg-amber" />
          <Bar label="WATCH · hold the line" n={watch} max={t4.nalas.length} className="bg-teal" />
        </div>
      </section>

      <section className="board-card mt-4 rounded-2xl p-5">
        <h2 className="text-sm font-semibold">Highest Core 1 scores</h2>
        <ol className="mt-3 space-y-2">
          {t4.nalas.slice(0, 6).map((n, i) => (
            <li key={n.id} className="flex items-center justify-between gap-3 border-b border-line/60 py-2 last:border-0">
              <div className="min-w-0">
                <span className="font-mono text-[10px] text-mute">
                  {i + 1} · {n.id}
                </span>
                <div className="truncate text-[13px]">{n.nameEn}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold tabular-nums text-danger">{n.risk}</div>
                <div
                  className="mt-1 h-1 w-24 rounded-full bg-line"
                  aria-hidden
                >
                  <div className="h-1 rounded-full bg-danger" style={{ width: `${(n.risk / maxRisk) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: "danger" | "teal" }) {
  return (
    <div className="board-card rounded-2xl p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-mute">{label}</div>
      <div className={`mt-2 font-display text-3xl font-bold tabular-nums ${tone === "danger" ? "text-danger" : tone === "teal" ? "text-teal" : "text-paper"}`}>
        {value.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

function Bar({ label, n, max, className }: { label: string; n: number; max: number; className: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-mute">
        <span>{label}</span>
        <span className="font-mono text-paper">{n}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${max ? (n / max) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
