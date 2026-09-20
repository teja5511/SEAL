"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LocaleProvider, useDrainCopy, useLocale } from "./LocaleContext";
import { SealMark } from "./SealMark";
import { buildState, ledgerStats } from "@/lib/store";

const links = [
  { href: "/", label: "Command", icon: CommandIcon },
  { href: "/report", label: "Report", icon: ReportIcon },
  { href: "/crew", label: "Crew", icon: CrewIcon },
  { href: "/ledger", label: "Ledger", icon: LedgerIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
];

const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ShellInner>{children}</ShellInner>
    </LocaleProvider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { mode, setMode } = useLocale();
  const { glossary } = useDrainCopy();
  const [drawer, setDrawer] = useState(false);
  const isCommand = path === "/";

  const briefing = useMemo(() => {
    const snap = buildState(-4);
    const stats = ledgerStats(buildState(0));
    const moving = snap.nalas.filter((n) => n.status === "dispatched" || n.status === "held");
    return {
      monitored: snap.nalas.length,
      dispatched: moving.length,
      verified: stats.jobs,
      households: stats.householdsSaved || snap.nalas.reduce((s, n) => s + n.households, 0),
    };
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-ink">
      {drawer && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/70 lg:hidden"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] shrink-0 flex-col border-r border-line/80 bg-panel/95 transition-transform lg:static lg:translate-x-0 ${
          drawer ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <SealMark className="h-10 w-10 shadow-glow" />
          <div className="min-w-0">
            <div className="font-display text-[17px] font-bold leading-none tracking-tight">SEAL</div>
            <div className="mt-1 text-[10px] leading-tight text-mute">
              Storm Emergency
              <br />
              Action Ledger
            </div>
          </div>
        </div>

        <nav aria-label="Primary" className="mt-2 flex flex-col gap-0.5 px-3">
          {links.map((l) => {
            const active = path === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setDrawer(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                  active ? "bg-teal/10 font-semibold text-paper" : "text-mute hover:bg-elevated hover:text-paper"
                }`}
              >
                <Icon active={active} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 mt-5 rounded-xl border border-line bg-elevated/80 p-3">
          <div className="flex items-start gap-2">
            <PinIcon />
            <div>
              <div className="text-[12px] font-semibold text-paper">Hyderabad (GHMC)</div>
              <div className="text-[10px] text-mute">Monsoon 2026 (Demo)</div>
            </div>
          </div>
          <dl className="mt-3 space-y-1.5 font-mono text-[11px]">
            <StatRow label="Drains monitored" value={briefing.monitored} />
            <StatRow label="Dispatched" value={briefing.dispatched} />
            <StatRow label="Verified & paid" value={briefing.verified} />
            <StatRow label="Households safer" value={`~${briefing.households.toLocaleString("en-IN")}`} />
          </dl>
        </div>

        <Link
          href="/ledger"
          onClick={() => setDrawer(false)}
          className="mx-3 mt-3 overflow-hidden rounded-xl border border-line bg-elevated/80"
        >
          <div className="relative h-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/plastic-before.svg" alt="" className="h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent" />
          </div>
          <div className="px-3 pb-3 pt-1">
            <p className="text-[12px] font-semibold leading-snug text-paper">Cleaner tomorrows flow here.</p>
            <p className="mt-1 text-[10px] leading-relaxed text-mute">
              Waste reduction. Flood resilience. Stronger communities.
            </p>
          </div>
        </Link>

        <div className="mt-auto border-t border-line/80 px-3 py-3">
          <div
            className="mb-3 flex items-center rounded-full border border-line bg-ink/60 p-1"
            title="English is the default for international judges. Telugu is the Hyderabad crew language."
          >
            {(["en", "local"] as const).map((id) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`relative z-10 flex-1 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                    active ? "font-semibold text-ink" : "text-mute hover:text-paper"
                  }`}
                >
                  {active && <motion.span layoutId="locale-pill" className="absolute inset-0 rounded-full bg-teal" transition={spring} />}
                  <span className="relative z-10">{id === "en" ? "EN" : "EN+TE"}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-lagoon/20 font-mono text-[11px] font-bold text-lagoon">
              A
            </div>
            <div>
              <div className="text-[12px] font-semibold tracking-wide">ARJUN</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-mute">Operator</div>
            </div>
          </div>
          <p className="mt-2 hidden font-mono text-[9px] text-mute/80 lg:block">{glossary}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line/80 bg-panel/80 px-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-mute"
            onClick={() => setDrawer(true)}
            aria-expanded={drawer}
            aria-controls="sidebar"
          >
            Menu
          </button>
          <Link href="/" className="flex items-center gap-2">
            <SealMark className="h-7 w-7" />
            <span className="font-display text-sm font-bold">SEAL</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-wider text-mute">GHMC demo</span>
        </header>

        <main className={`min-h-0 min-w-0 flex-1 ${isCommand ? "overflow-hidden" : "overflow-y-auto pb-[4.5rem] lg:pb-0"}`}>
          {children}
        </main>
      </div>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-ink/90 px-3 py-2 backdrop-blur-2xl lg:hidden"
      >
        <div className="flex items-center rounded-full border border-line bg-panel/85 p-1">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative z-10 flex-1 rounded-full px-1 py-1.5 text-center text-[11px] sm:px-2 sm:text-[13px] ${
                  active ? "font-semibold text-ink" : "text-mute"
                }`}
              >
                {active && (
                  <motion.span layoutId="seal-nav-mobile" className="absolute inset-0 rounded-full bg-teal" transition={spring} />
                )}
                <span className="relative z-10">{l.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 text-mute">
      <dt>{label}</dt>
      <dd className="font-semibold tabular-nums text-paper">{value}</dd>
    </div>
  );
}

function CommandIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={active ? "text-teal" : "text-mute"}>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" />
    </svg>
  );
}

function ReportIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={active ? "text-teal" : "text-mute"}>
      <path d="M4 2.5h5.5L12.5 6v7.5a1 1 0 0 1-1 1h-7.5a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z" stroke="currentColor" />
      <path d="M9.5 2.5V6H13" stroke="currentColor" />
    </svg>
  );
}

function CrewIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={active ? "text-teal" : "text-mute"}>
      <circle cx="6" cy="5.5" r="2" stroke="currentColor" />
      <path d="M2.5 13c.4-2.2 1.8-3.5 3.5-3.5S9.1 10.8 9.5 13" stroke="currentColor" strokeLinecap="round" />
      <circle cx="11" cy="6" r="1.5" stroke="currentColor" />
      <path d="M10.2 9.6c1.2.3 2.2 1.3 2.6 3.4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function LedgerIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={active ? "text-teal" : "text-mute"}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" />
      <path d="M5 6h6M5 8.5h6M5 11h4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function AnalyticsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={active ? "text-teal" : "text-mute"}>
      <path d="M2.5 12.5h11" stroke="currentColor" strokeLinecap="round" />
      <path d="M4.5 10V7.5M8 10V4.5M11.5 10V6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="mt-0.5 text-teal">
      <path d="M7 1.5c-2.2 0-4 1.7-4 3.8 0 2.8 4 7.2 4 7.2s4-4.4 4-7.2c0-2.1-1.8-3.8-4-3.8Z" stroke="currentColor" />
      <circle cx="7" cy="5.2" r="1.2" fill="currentColor" />
    </svg>
  );
}
