"use client";

import { useMemo, useState } from "react";
import { ProofSlider } from "@/components/ProofSlider";
import { LocalCaption } from "@/components/LocaleContext";
import { buildState, ledgerStats } from "@/lib/store";

export default function LedgerPage() {
  const state = useMemo(() => buildState(0), []);
  const stats = ledgerStats(state);
  const proofs = state.proofs;
  const [active, setActive] = useState(0);
  const proof = proofs[active] ?? proofs[0];
  const nala = state.nalas.find((n) => n.id === proof?.nalaId);
  const unsealedRed = Math.max(0, stats.redCount - stats.sealedCount);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-teal">T–0 close · Proof ledger</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">
        Pay only when the after-photo proves it.
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-mute">
        Unsealed RED pins still flood. Sealed pins go to 0 m. Rupees (₹, Indian currency) never leave escrow on a
        promise.
      </p>

      <div className="mt-8 hud-glass grid gap-0 overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Verified jobs" value={stats.jobs} />
        <Stat label="Escrow released" value={stats.rupees} prefix="₹" accent />
        <Stat label="Plastic pulled" value={stats.kgPlastic} suffix=" kg" />
        <Stat label="Households saved" value={stats.householdsSaved} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-teal/40 bg-teal/10 p-5 shadow-glow">
          <div className="text-[11px] uppercase tracking-widest text-teal">If we act</div>
          <div className="mt-2 font-display text-3xl font-bold text-paper">
            {stats.sealedCount === 1 ? "1 drain sealed" : `${stats.sealedCount} drains sealed`}
          </div>
          <p className="mt-1 text-sm text-mute">
            {stats.householdsSaved.toLocaleString("en-IN")} homes stay dry at T–0. Escrow paid only on verified
            after-photos.
          </p>
        </div>
        <div className="rounded-2xl border border-danger/40 bg-danger/10 p-5">
          <div className="text-[11px] uppercase tracking-widest text-danger">If we don’t</div>
          <div className="mt-2 font-display text-3xl font-bold text-paper">
            {stats.householdsAtRisk.toLocaleString("en-IN")} at risk
          </div>
          <p className="mt-1 text-sm text-mute">
            {unsealedRed === 1
              ? "1 unsealed RED drain still backs up when the band arrives."
              : `${unsealedRed} unsealed RED drains still back up when the band arrives.`}
          </p>
        </div>
      </div>

      {proof && nala ? (
        <div className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-teal">Verified drain proof</p>
              <p className="mt-1 text-sm text-mute">Drag the handle. Left is clogged. Right is sealed.</p>
            </div>
            <p className="font-mono text-[11px] text-mute">T–0 · {proofs.length} sealed</p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {proofs.map((p, i) => {
              const pin = state.nalas.find((n) => n.id === p.nalaId);
              return (
                <button
                  key={p.nalaId}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`rounded-full border px-3 py-1.5 text-left font-mono text-xs transition ${
                    i === active
                      ? "border-teal bg-teal text-ink"
                      : "border-line text-mute hover:border-teal/50 hover:text-paper"
                  }`}
                >
                  <span className="font-bold">{p.nalaId}</span>
                  {pin ? <span className="ml-2 font-sans opacity-80">{pin.nameEn}</span> : null}
                </button>
              );
            })}
          </div>

          <ProofSlider
            key={proof.nalaId}
            beforeUrl={proof.beforeUrl}
            afterUrl={proof.afterUrl}
            beforeClog={proof.beforeClog}
            afterClog={proof.afterClog}
            paidInr={proof.paidInr}
            kgPlastic={proof.kgPlastic}
            nalaName={`${nala.id} · ${nala.nameEn}`}
            nalaNameTe={nala.nameTe}
          />

          <p className="mt-4 font-mono text-xs text-mute">
            <span className="text-paper">{nala.nameEn}</span>
            {" · verified "}
            {proof.at}
            {" · dual-core: Gemini never wrote this rupee figure."}
            <LocalCaption text={nala.nameTe} className="mt-1 text-[11px] text-mute" />
          </p>
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-line bg-panel p-5 text-sm text-mute">
          No verified jobs at T–0. Replay Storm to seal a drain first.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  prefix = "",
  suffix = "",
  accent,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-line p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="text-[11px] uppercase tracking-widest text-mute">{label}</div>
      <div className={`mt-2 font-display text-3xl font-bold tabular-nums ${accent ? "text-amber" : "text-paper"}`}>
        {prefix}
        {value.toLocaleString("en-IN")}
        {suffix}
      </div>
    </div>
  );
}
