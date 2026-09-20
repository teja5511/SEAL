"use client";

import React, { useState } from "react";
import type { AlertLevel, RankedNala } from "@/lib/types";
import { AlertMark } from "@/components/AlertMark";
import { LocalCaption, useDrainCopy } from "./LocaleContext";

interface QueueProps {
  nalas: RankedNala[];
  selectedId: string | null;
  onSelectNala: (nala: RankedNala) => void;
  onDispatchNala?: (nalaId: string) => void;
}

export function Queue({ nalas, selectedId, onSelectNala, onDispatchNala }: QueueProps) {
  const [filter, setFilter] = useState<"ALL" | AlertLevel>("ALL");
  const [search, setSearch] = useState("");
  const { searchHint, glossary, showLocal } = useDrainCopy();

  const filteredNalas = nalas.filter((n) => {
    if (filter !== "ALL" && n.alert !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        n.nameEn.toLowerCase().includes(q) ||
        n.nameTe.toLowerCase().includes(q) ||
        n.ward.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getAlertBadge = (alert: AlertLevel) => {
    switch (alert) {
      case "RED":
        return "bg-danger/20 border-danger/60 text-danger";
      case "YELLOW":
        return "bg-amber/20 border-amber/60 text-amber";
      case "WATCH":
      default:
        return "bg-teal/20 border-teal/50 text-teal";
    }
  };

  const getStatusBadge = (status: RankedNala["status"]) => {
    switch (status) {
      case "verified":
        return "bg-teal/25 border-teal text-teal";
      case "held":
        return "bg-danger/25 border-danger text-danger";
      case "dispatched":
        return "bg-amber/25 border-amber text-amber";
      case "queued":
        return "bg-lagoon/20 border-lagoon/50 text-lagoon";
      case "idle":
      default:
        return "bg-line/60 border-line text-mute";
    }
  };

  return (
    <div className="hud-glass flex h-full flex-col overflow-hidden rounded-hud shadow-hud">
      <div className="border-b border-line p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-paper">Drain queue</h2>
          </div>
          <span className="rounded border border-line bg-ink px-2 py-0.5 font-mono text-xs text-mute">
            {filteredNalas.length} / {nalas.length}
          </span>
        </div>
        {showLocal ? (
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-mute">{glossary}</p>
        ) : (
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-mute">Storm drain queue</p>
        )}

        <input
          type="text"
          placeholder={searchHint}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 font-mono text-xs text-paper placeholder-mute focus:border-teal focus:outline-none"
        />

        <div className="mt-2 grid grid-cols-4 gap-1">
          {(["ALL", "RED", "YELLOW", "WATCH"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilter(lvl)}
              className={`rounded border py-1 font-mono text-[11px] transition ${
                filter === lvl
                  ? "border-teal bg-teal/20 font-bold text-teal"
                  : "border-line bg-ink text-mute hover:border-mute/40"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-1.5">
        {filteredNalas.length === 0 && (
          <div className="m-2 rounded-md border border-line bg-ink/50 p-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-mute">No pins in this filter</p>
            <p className="mt-1 text-xs text-mute">Clear search or switch ALL / RED / YELLOW / WATCH.</p>
          </div>
        )}
        {filteredNalas.map((n, index) => {
          const isSelected = n.id === selectedId;
          return (
            <div
              key={n.id}
              onClick={() => onSelectNala(n)}
              className={`cursor-pointer rounded-lg border p-2.5 transition ${
                isSelected
                  ? "border-teal bg-ink shadow-glow"
                  : "border-transparent bg-ink/30 hover:border-line hover:bg-ink/55"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-mute">#{index + 1}</span>
                  <AlertMark alert={n.alert} sealed={n.status === "verified"} held={n.status === "held"} />
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${getAlertBadge(n.alert)}`}>
                    {n.alert}
                  </span>
                  <span className="font-mono text-xs font-semibold text-paper">{n.id}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${getStatusBadge(
                      n.status
                    )}`}
                  >
                    {n.status}
                  </span>
                  <span className="font-mono text-xs font-bold text-teal">Risk {n.risk}</span>
                </div>
              </div>

              <div className="mt-1">
                <div className="truncate text-xs font-semibold text-paper/90">{n.nameEn}</div>
                <LocalCaption text={n.nameTe} className="truncate font-sans text-[11px] text-mute/80" />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-line/40 bg-ink">
                  <div
                    className={`h-full rounded-full ${
                      n.clog >= 85 ? "bg-danger" : n.clog >= 65 ? "bg-amber" : "bg-teal"
                    }`}
                    style={{ width: `${n.clog}%` }}
                  />
                </div>
                <span className="whitespace-nowrap font-mono text-[10px] text-mute">
                  {n.clog}% clog · {n.clogClass}
                </span>
              </div>

              <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-mute">
                <span>Ward: {n.ward}</span>
                <span>{n.households.toLocaleString()} HH</span>
                <span>p90 {n.precipP90Mm.toFixed(0)}mm</span>
              </div>

              {isSelected && n.status === "idle" && onDispatchNala && (
                <div className="mt-2 flex justify-end border-t border-line/40 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDispatchNala(n.id);
                    }}
                    className="rounded border border-teal bg-teal/20 px-2 py-1 font-mono text-[11px] font-semibold text-teal hover:bg-teal/30"
                  >
                    Dispatch {n.crew} · ₹{n.payInr}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
