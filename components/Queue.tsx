"use client";

import React, { useMemo, useState } from "react";
import type { RankedNala } from "@/lib/types";
import { LocalCaption, useDrainCopy } from "./LocaleContext";

interface QueueProps {
  nalas: RankedNala[];
  selectedId: string | null;
  onSelectNala: (nala: RankedNala) => void;
  onDispatchNala?: (nalaId: string) => void;
  search?: string;
  onSearch?: (q: string) => void;
  activeCrews?: number;
  completed?: number;
}

function shortPlace(n: RankedNala) {
  if (n.nameEn.includes(" at ")) return n.nameEn.split(" at ").pop() as string;
  if (n.nameEn.includes(" near ")) return n.nameEn.split(" near ").pop() as string;
  const cut = n.nameEn.replace(/ storm-?drain/i, "").replace(/ inner/i, "");
  return cut.length > 22 ? n.ward : cut;
}

function clogTenth(n: RankedNala) {
  return Math.max(1, Math.min(10, Math.round(n.clog / 10)));
}

function riskColor(risk: number) {
  if (risk >= 220) return "text-danger";
  if (risk >= 90) return "text-amber";
  return "text-teal";
}

export function Queue({
  nalas,
  selectedId,
  onSelectNala,
  onDispatchNala,
  search = "",
  onSearch,
  activeCrews,
  completed,
}: QueueProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState<"ALL" | "RED" | "YELLOW" | "WATCH">("ALL");
  const { searchHint } = useDrainCopy();

  const crews = activeCrews ?? nalas.filter((n) => n.status === "dispatched" || n.status === "held").length;
  const done = completed ?? nalas.filter((n) => n.status === "verified").length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return nalas.filter((n) => {
      if (alertFilter !== "ALL" && n.alert !== alertFilter) return false;
      if (!q) return true;
      return (
        n.nameEn.toLowerCase().includes(q) ||
        n.nameTe.toLowerCase().includes(q) ||
        n.ward.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q)
      );
    });
  }, [nalas, search, alertFilter]);

  return (
    <section className="board-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-line/80 px-3 py-2.5">
        <h2 className="text-[13px] font-semibold text-paper">Priority Queue</h2>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-mute">
          <span>
            Active Crews <span className="ml-1 text-sm font-bold tabular-nums text-paper">{crews}</span>
          </span>
          <span>
            Completed <span className="ml-1 text-sm font-bold tabular-nums text-teal">{done}</span>
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="rounded-md border border-line px-1.5 py-1 text-mute hover:text-paper"
              aria-label="Filter queue"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 3h10M4 7h6M6 11h2" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-20 mt-1 w-28 overflow-hidden rounded-lg border border-line bg-panel shadow-hud">
                {(["ALL", "RED", "YELLOW", "WATCH"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setAlertFilter(lvl);
                      setFilterOpen(false);
                    }}
                    className={`block w-full px-2 py-1.5 text-left font-mono text-[10px] ${
                      alertFilter === lvl ? "bg-teal/15 text-teal" : "text-mute hover:text-paper"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {onSearch && (
        <label className="sr-only" htmlFor="queue-search">
          {searchHint}
        </label>
      )}

      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        <table className="w-full table-fixed text-left text-[11px]">
          <colgroup>
            <col className="w-8" />
            <col />
            <col className="w-14" />
            <col className="w-14" />
            <col className="w-14" />
            <col className="w-[4.75rem]" />
          </colgroup>
          <thead className="sticky top-0 bg-elevated/95 font-mono text-[9px] uppercase tracking-wider text-mute">
            <tr>
              <th className="px-2 py-2 font-medium">#</th>
              <th className="px-2 py-2 font-medium">Drain / Location</th>
              <th className="px-2 py-2 font-medium">Risk ↓</th>
              <th className="px-2 py-2 font-medium">p90</th>
              <th className="px-2 py-2 font-medium">Clog</th>
              <th className="px-2 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-mute">
                  No drains match this filter.
                </td>
              </tr>
            )}
            {rows.map((n, index) => {
              const selected = n.id === selectedId;
              return (
                <tr
                  key={n.id}
                  onClick={() => onSelectNala(n)}
                  className={`cursor-pointer border-t border-line/60 ${selected ? "bg-teal/10" : "hover:bg-ink/40"}`}
                >
                  <td className="px-2 py-2 font-mono text-mute">{index + 1}</td>
                  <td className="truncate px-2 py-2">
                    <div className="font-mono text-[10px] text-mute">{n.id}</div>
                    <div className="truncate text-[12px] font-medium text-paper">{shortPlace(n)}</div>
                    <LocalCaption text={n.nameTe} className="truncate text-[10px] text-mute" />
                  </td>
                  <td className={`px-2 py-2 font-mono text-[13px] font-bold tabular-nums ${riskColor(n.risk)}`}>{n.risk}</td>
                  <td className="px-2 py-2 font-mono tabular-nums text-paper">{Math.round(n.precipP90Mm)}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-mono tabular-nums text-paper">
                    {clogTenth(n)}
                    <span className="text-mute">/10</span>
                  </td>
                  <td className="px-1.5 py-2">
                    <RowAction nala={n} onDispatch={onDispatchNala} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line/80 px-3 py-2 text-[11px]">
        <span className="text-teal">
          View all drains → <span className="text-mute">{rows.length} shown</span>
        </span>
        <span className="font-mono text-[10px] text-mute">Sort: Risk</span>
      </div>
    </section>
  );
}

function RowAction({ nala, onDispatch }: { nala: RankedNala; onDispatch?: (id: string) => void }) {
  if (nala.status === "held") {
    return (
      <span className="inline-flex rounded-md border border-danger/50 bg-danger/15 px-2 py-1 font-mono text-[10px] font-bold uppercase text-danger">
        HOLD
      </span>
    );
  }
  if (nala.status === "verified") {
    return (
      <a
        href="/ledger"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex rounded-md border border-teal/40 px-2 py-1 font-mono text-[10px] font-semibold uppercase text-teal"
      >
        Paid
      </a>
    );
  }
  if (nala.status === "dispatched") {
    return (
      <span className="inline-flex rounded-md border border-line px-2 py-1 font-mono text-[10px] uppercase text-mute">
        En route
      </span>
    );
  }
  const urgent = nala.alert === "RED";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDispatch?.(nala.id);
      }}
      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
        urgent ? "bg-danger text-white hover:bg-danger/90" : "border border-amber/50 bg-amber/15 text-amber hover:bg-amber/25"
      }`}
    >
      {urgent ? "Dispatch" : "Assign"}
    </button>
  );
}
