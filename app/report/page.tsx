"use client";

import { useMemo, useRef, useState } from "react";
import { buildState } from "@/lib/store";
import { LocalCaption, useDrainCopy } from "@/components/LocaleContext";

type VisionResult = {
  success: boolean;
  clogClass: "clear" | "silt" | "plastic" | "blocked";
  clog: number;
  confidence: number;
  reason: string;
  debrisIdentified: string[];
  immediateActionRequired: boolean;
  recommendedEscrowPayoutInr: number;
  engine: string;
};

const SAMPLES = [
  { file: "plastic-before.svg", label: "Plastic" },
  { file: "silt-before.svg", label: "Silt" },
  { file: "blocked-before.svg", label: "Blocked" },
  { file: "clear-after.svg", label: "Clear" },
] as const;

export default function ReportPage() {
  const { drain, drainPin } = useDrainCopy();
  const state = useMemo(() => buildState(-4), []);
  const [nalaId, setNalaId] = useState(state.nalas[0]?.id ?? "N-11");
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState("drain-sample.jpg");
  const [result, setResult] = useState<VisionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nala = state.nalas.find((n) => n.id === nalaId) ?? state.nalas[0];

  async function analyze(file?: File | null, filenameArg?: string) {
    setBusy(true);
    try {
      const name = filenameArg || file?.name || filename;
      setFilename(name);
      if (file) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(`/demo/${name}`);
      }

      const body = new FormData();
      if (file) {
        body.append("file", file);
      }
      body.append("filename", name);
      body.append("nalaId", nalaId);

      const res = await fetch("/api/vision", { method: "POST", body });
      const json = (await res.json()) as VisionResult;
      setResult(json);
    } catch (err) {
      console.error("Error analyzing image:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hud-glass rounded-[22px] p-6 shadow-hud">
        <p className="text-[11px] uppercase tracking-[0.22em] text-teal">Resident report</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
          Snap the {drain}. Get a clog score.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-mute">
          Gemini 2.0 Flash reads the photo. If there is no API key, a filename heuristic keeps the demo alive.
          The score is evidence — the ledger still will not pay until an after-photo verifies the same drain.
        </p>

        <label className="mt-6 block text-[11px] uppercase tracking-widest text-mute">{drainPin}</label>
        <select
          value={nalaId}
          onChange={(e) => setNalaId(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-3 text-sm"
        >
          {state.nalas.slice(0, 12).map((n) => (
            <option key={n.id} value={n.id}>
              {n.id} · {n.nameEn}
            </option>
          ))}
        </select>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) analyze(f, f.name);
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative mt-5 w-full overflow-hidden rounded-2xl border border-dashed border-teal/40 bg-ink text-center"
        >
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Drain preview" className="mx-auto max-h-80 w-full object-cover" />
              <div className="scanlines pointer-events-none absolute inset-0" />
              {result && (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between rounded-xl border border-teal/30 bg-ink/80 px-3 py-2 text-left backdrop-blur">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-mute">Clog overlay</div>
                    <div className="font-display text-3xl font-bold text-teal">{result.clog}</div>
                  </div>
                  <div className="font-mono text-xs uppercase text-amber">{result.clogClass}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16">
              <div className="font-display text-2xl">Open camera / upload</div>
              <div className="mt-2 text-sm text-mute">Or tap a sample below</div>
            </div>
          )}
        </button>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.file}
              type="button"
              onClick={() => analyze(null, s.file)}
              className={`overflow-hidden rounded-xl border bg-ink text-left transition ${
                filename === s.file ? "border-teal" : "border-line hover:border-teal/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/demo/${s.file}`} alt="" className="h-14 w-full object-cover" />
              <span className="block px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mute">{s.label}</span>
            </button>
          ))}
        </div>
      </section>

      <aside className="rounded-[22px] border border-line bg-ink p-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-mute">Core 1 · immutable JSON</p>
        {busy && <p className="mt-6 font-mono text-teal">Reading scene…</p>}
        {!result && !busy && (
          <div className="mt-10 flex flex-col items-center text-center">
            <ClogRing value={0} idle />
            <p className="mt-4 max-w-[220px] text-sm text-mute">Upload a drain. The overlay stays empty until a score exists.</p>
          </div>
        )}
        {result && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <ClogRing value={result.clog} />
              <div className="min-w-0">
                <div className="text-[11px] uppercase text-mute">{nala?.nameEn}</div>
                <LocalCaption text={nala?.nameTe} />
                <div className="mt-1 text-sm text-mute">clog · {result.clogClass}</div>
                <div className="mt-2 rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase text-amber">
                  {result.engine}
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-paper/85">{result.reason}</p>
            <div className="flex flex-wrap gap-2">
              {result.debrisIdentified.map((d) => (
                <span key={d} className="rounded-full border border-line px-3 py-1 text-xs text-mute">
                  {d}
                </span>
              ))}
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-line bg-panel p-4 font-mono text-[11px] text-teal/90">
{JSON.stringify(
  {
    pinId: nalaId,
    clogClass: result.clogClass,
    clog: result.clog,
    confidence: result.confidence,
    payout: result.recommendedEscrowPayoutInr,
    immediateActionRequired: result.immediateActionRequired,
  },
  null,
  2
)}
            </pre>
            <p className="text-xs text-mute">
              Gemini can label the photo. It cannot change the risk rank on Command. Dual-core contract.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ClogRing({ value, idle = false }: { value: number; idle?: boolean }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = idle ? "#1c2c36" : value >= 85 ? "#ff5c6a" : value >= 65 ? "#ffb020" : "#2ee6c5";
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1c2c36" strokeWidth="8" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - (idle ? 0 : value) / 100)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-3xl font-bold tabular-nums text-paper">{idle ? "—" : value}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-mute">clog</div>
        </div>
      </div>
    </div>
  );
}
