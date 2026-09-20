"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { LocalCaption, useDrainCopy, useLocale } from "@/components/LocaleContext";
import { buildState } from "@/lib/store";
import type { JobStatus, RankedNala } from "@/lib/types";

type Chat = {
  id: string;
  from: "seal" | "crew";
  text: string;
  te?: string;
  image?: string;
  time: string;
};

type VisionReply = {
  clog?: number;
};

const STATUS_ORDER: Record<JobStatus, number> = {
  dispatched: 0,
  held: 1,
  verified: 2,
  queued: 3,
  idle: 4,
  rejected: 5,
};

const CLOCK = "12:48";

export default function CrewPage() {
  const { showLocal } = useLocale();
  const { drain } = useDrainCopy();
  const state = useMemo(() => buildState(-2), []);
  const [statusById, setStatusById] = useState<Partial<Record<string, JobStatus>>>({});
  const jobs = useMemo(() => {
    const live = state.nalas
      .map((n) => (statusById[n.id] ? { ...n, status: statusById[n.id]! } : n))
      .filter((n) => n.status === "dispatched" || n.status === "held" || n.status === "verified");
    return [...live].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.risk - a.risk);
  }, [state.nalas, statusById]);

  const [activeId, setActiveId] = useState(
    () => jobs.find((n) => n.status === "dispatched")?.id ?? jobs[0]?.id ?? "N-07"
  );
  const job = jobs.find((n) => n.id === activeId) ?? jobs[0];
  const [chats, setChats] = useState<Chat[]>(() => seedChat(job, state.weather.wbgtC, "storm drain"));
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const hold = job?.status === "held";
  const alreadyPaid = job?.status === "verified";
  const canSend = Boolean(job) && !hold && !alreadyPaid && !busy;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, busy]);

  function loadJob(n: RankedNala) {
    setActiveId(n.id);
    setChats(seedChat(n, state.weather.wbgtC, drain));
    setBusy(false);
  }

  async function sendProof(file?: File) {
    if (!job || hold || alreadyPaid || busy) return;
    setBusy(true);
    try {
      const body = new FormData();
      if (file) body.append("file", file);
      body.append("filename", file?.name || "clear-after.svg");
      body.append("nalaId", job.id);
      const res = await fetch("/api/vision", { method: "POST", body });
      const json = (await res.json()) as VisionReply;
      const after = typeof json.clog === "number" ? json.clog : 12;
      const clogDropped = after < job.clog - 20;
      const preview = file ? URL.createObjectURL(file) : "/demo/clear-after.svg";
      if (clogDropped) {
        setStatusById((prev) => ({ ...prev, [job.id]: "verified" }));
      }

      const seal: Pick<Chat, "text" | "te"> = clogDropped
        ? {
            text: `Verified. Clog ${job.clog} → ${after}. ₹${job.payInr} released on the ledger.`,
            te: `ధృవీకరణ అయింది. చెల్లింపు ₹${job.payInr} విడుదల.`,
          }
        : {
            text: `Photo received. Clog still ${after}. Same drain, lower clog needed before payout.`,
            te: "ఇంకా మూసుకుపోయింది. మళ్లీ పంపండి.",
          };

      setChats((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: "crew",
          text: "After-photo sent.",
          te: "తర్వాత ఫోటో పంపాను.",
          image: preview,
          time: CLOCK,
        },
        {
          id: crypto.randomUUID(),
          from: "seal",
          text: seal.text,
          te: seal.te,
          time: CLOCK,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!job) return null;

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 py-8 lg:grid-cols-[1fr_420px]">
      <section>
        <p className="text-[11px] uppercase tracking-[0.22em] text-amber">Crew channel · T–2h</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">WhatsApp is the dispatch radio.</h1>
        <p className="mt-3 max-w-xl text-sm text-mute">
          Dispatch is in English so anyone can follow the job. Telugu is the Hyderabad crew language — turn on{" "}
          <span className="font-mono text-teal">EN+TE</span> in the sidebar if you want the local field radio. Heat HOLD
          cannot be overridden. After-photo is the only way money moves.
        </p>
        <p className="mt-3 font-mono text-[11px] text-amber">
          HeatGuard WBGT {state.weather.wbgtC}°C · {state.weather.crewSignal} — HOLD is per pin, not a city-wide lock.
        </p>
        <div className="mt-6 space-y-2">
          {jobs.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => loadJob(n)}
              className={`relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-4 py-3 text-left transition ${
                n.id === job.id ? "border-teal bg-teal/10" : "border-line bg-panel hover:border-line/80"
              }`}
            >
              <span
                className={`absolute inset-y-0 left-0 w-1 ${
                  n.status === "held" ? "bg-danger" : n.status === "verified" ? "bg-teal" : "bg-amber"
                }`}
              />
              <span>
                <span className="font-mono text-xs text-teal">{n.id}</span>
                <span className="ml-2 text-sm">{n.nameEn}</span>
                <LocalCaption text={n.nameTe} className="mt-1 block text-[11px] text-mute" />
              </span>
              <span
                className={`font-mono text-xs uppercase ${
                  n.status === "held" ? "text-danger" : n.status === "verified" ? "text-teal" : "text-amber"
                }`}
              >
                {n.status === "held"
                  ? "HEAT HOLD"
                  : n.status === "verified"
                    ? `PAID ₹${n.payInr}`
                    : n.status}
              </span>
            </button>
          ))}
        </div>
      </section>

      <PhoneFrame
        key={job.id}
        crewName={job.crew}
        wardName={job.ward}
        timeString={CLOCK}
        cameraDisabled={!canSend}
        onCamera={() => void sendProof()}
        onAttach={() => {
          if (canSend) fileRef.current?.click();
        }}
        dock={
          <div className="rounded-2xl border border-[#2a3942] bg-[#182229] p-3">
            <div
              className={`font-mono text-[11px] uppercase tracking-widest ${hold ? "text-danger" : "text-[#00a884]"}`}
            >
              {hold ? "HEAT HOLD" : alreadyPaid ? "VERIFIED" : "JOB CARD"} · ₹{job.payInr}
            </div>
            <p className="mt-1 text-sm text-white">{job.nameEn}</p>
            <LocalCaption text={job.nameTe} className="text-[11px] text-[#8696a0]" />
            <p className="mt-1 font-mono text-[11px] text-[#8696a0]">
              📍 {job.lat.toFixed(4)}, {job.lng.toFixed(4)} · clog {job.clog}
            </p>
            <p className="mt-1 text-xs text-mute">{hold ? state.weather.crewReason : job.reason}</p>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => void sendProof()}
              className={`mt-3 w-full rounded-full py-2 text-sm font-semibold disabled:cursor-not-allowed ${
                hold
                  ? "bg-danger/30 text-danger"
                  : alreadyPaid
                    ? "bg-[#2a3942] text-[#8696a0]"
                    : "bg-[#00a884] text-white"
              }`}
            >
              {hold
                ? "Cannot work — WBGT HOLD"
                : alreadyPaid
                  ? "Escrow already released"
                  : busy
                    ? "Checking photo…"
                    : "Send after-photo"}
            </button>
          </div>
        }
      >
        {chats.map((c) => (
          <div key={c.id} className={`flex ${c.from === "crew" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                c.from === "crew" ? "rounded-br-sm bg-[#005c4b] text-white" : "rounded-bl-sm bg-[#1f2c34] text-white"
              }`}
            >
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" className="mb-2 h-28 w-full rounded-lg object-cover" />
              )}
              <p>{c.text}</p>
              {showLocal && c.te && (
                <p className="mt-1 text-[11px] text-white/70">
                  <span className="mr-1.5 font-mono text-[9px] uppercase tracking-widest text-[#00a884]">Telugu</span>
                  {c.te}
                </p>
              )}
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/45">
                <span>{c.time}</span>
                {c.from === "crew" && <span className="text-[#53bdeb]">✓✓</span>}
              </p>
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-[#1f2c34] px-3 py-2 text-sm text-white">
              <p className="animate-pulse">SEAL is checking the after-photo…</p>
              {showLocal && (
                <p className="mt-1 text-[11px] text-white/70">
                  <span className="mr-1.5 font-mono text-[9px] uppercase tracking-widest text-[#00a884]">Telugu</span>
                  ఫోటో తనిఖీ చేస్తోంది…
                </p>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void sendProof(file);
          }}
        />
        <div ref={endRef} />
      </PhoneFrame>
    </div>
  );
}

function seedChat(job: RankedNala | undefined, wbgtC: number, drain = "storm drain"): Chat[] {
  if (!job) return [];
  const hold = job.status === "held";
  const verified = job.status === "verified";

  const first: Chat = {
    id: "1",
    from: "seal",
    time: "12:41",
    text: hold
      ? `HOLD ${job.id}. WBGT ${wbgtC}°C ≥ 32. Do not enter the ${drain}. Shade and water only. HeatGuard — no payout.`
      : `Job ${job.id}. ${job.nameEn}. p90 rain ${job.precipP90Mm.toFixed(0)} mm. Clear plastic/silt, send after-photo, ₹${job.payInr} on verify.`,
    te: hold
      ? "వేడి ఎక్కువ. నాలాలోకి వెళ్లవద్దు. చెల్లింపు లేదు."
      : `పని ${job.id}. ఫోటో పంపితే ₹${job.payInr}.`,
  };

  const second: Chat = {
    id: "2",
    from: "crew",
    time: "12:44",
    text: hold ? "Understood. Waiting for the HOLD to lift." : "Reached the pin. Sending before photo.",
    te: hold ? "ఆగుతున్నాం." : "పిన్ దగ్గర ఉన్నాం.",
    image: `/demo/${job.clogClass}-before.svg`,
  };

  if (!verified) return [first, second];

  return [
    first,
    second,
    {
      id: "3",
      from: "crew",
      time: "12:46",
      text: "After-photo sent.",
      te: "తర్వాత ఫోటో పంపాను.",
      image: "/demo/clear-after.svg",
    },
    {
      id: "4",
      from: "seal",
      time: CLOCK,
      text: `Verified. Clog ${job.clog} → 12. ₹${job.payInr} released on the ledger.`,
      te: `ధృవీకరణ అయింది. చెల్లింపు ₹${job.payInr} విడుదల.`,
    },
  ];
}
