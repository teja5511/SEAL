"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LocaleProvider, useDrainCopy, useLocale } from "./LocaleContext";
import { SealMark } from "./SealMark";

const links = [
  { href: "/", label: "Command" },
  { href: "/report", label: "Report" },
  { href: "/crew", label: "Crew" },
  { href: "/ledger", label: "Ledger" },
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

  return (
    <div className="min-h-screen pb-[4.25rem] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/72 backdrop-blur-2xl">
        <div className="relative mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <SealMark className="h-8 w-8 shadow-glow" />
            <span className="min-w-0">
              <span className="block font-display text-[15px] font-bold leading-none tracking-tight">SEAL</span>
              <span className="mt-0.5 hidden truncate text-[10px] uppercase tracking-[0.16em] text-mute sm:block">
                Seal the drain before the rain
              </span>
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex"
          >
            <PillNav path={path} />
          </nav>

          <div
            className="relative flex shrink-0 items-center rounded-full border border-line bg-panel/85 p-1"
            title="English is the default for international judges. Telugu is the Hyderabad crew language."
          >
            {(["en", "local"] as const).map((id) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`relative z-10 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                    active ? "font-semibold text-ink" : "text-mute hover:text-paper"
                  }`}
                >
                  {active && (
                    <motion.span layoutId="locale-pill" className="absolute inset-0 rounded-full bg-teal" transition={spring} />
                  )}
                  <span className="relative z-10">{id === "en" ? "EN" : "EN+TE"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="w-full">{children}</main>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-ink/90 px-3 py-2 backdrop-blur-2xl md:hidden"
      >
        <PillNav path={path} compact />
      </nav>

      <footer className="hidden border-t border-line/80 bg-ink/90 md:block">
        <div className="mx-auto flex h-7 max-w-[1600px] items-center justify-between gap-3 px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
          <span>{glossary}</span>
          <span className="hidden text-teal/80 lg:inline">
            {mode === "en" ? "English UI · Telugu is optional crew locale" : "English + Telugu crew locale"}
          </span>
        </div>
      </footer>
    </div>
  );
}

function PillNav({ path, compact = false }: { path: string; compact?: boolean }) {
  return (
    <div className={`relative flex items-center rounded-full border border-line bg-panel/85 p-1 ${compact ? "w-full" : ""}`}>
      {links.map((l) => {
        const active = path === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`relative z-10 flex-1 rounded-full px-3 py-1.5 text-center text-[13px] transition sm:px-4 ${
              active ? "font-semibold text-ink" : "text-mute hover:text-paper"
            }`}
          >
            {active && (
              <motion.span
                layoutId={compact ? "seal-nav-mobile" : "seal-nav"}
                className="absolute inset-0 rounded-full bg-teal"
                transition={spring}
              />
            )}
            <span className="relative z-10">{l.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
