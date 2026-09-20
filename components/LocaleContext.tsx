"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type LocaleMode = "en" | "local";

type LocaleContextValue = {
  mode: LocaleMode;
  showLocal: boolean;
  setMode: (mode: LocaleMode) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  mode: "en",
  showLocal: false,
  setMode: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LocaleMode>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("seal-locale");
      if (saved === "local") setModeState("local");
    } catch {
      /* ignore */
    }
  }, []);

  function setMode(next: LocaleMode) {
    setModeState(next);
    try {
      window.localStorage.setItem("seal-locale", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <LocaleContext.Provider value={{ mode, showLocal: mode === "local", setMode }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

/** English mode uses "storm drain". EN+TE may say "nala" (the local word). */
export function useDrainCopy() {
  const { mode, showLocal } = useLocale();
  const local = mode === "local";
  return {
    showLocal,
    drain: local ? "nala" : "storm drain",
    drains: local ? "nalas" : "storm drains",
    drainPin: local ? "Nala pin" : "Drain pin",
    searchHint: local ? "Ward, nala, or ID" : "Ward, drain, or ID",
    glossary: local
      ? "Nala = storm drain · ₹ = Indian rupees · demo city Hyderabad"
      : "Storm drain · Indian rupees (₹) · demo city Hyderabad",
  };
}

/** Telugu is the Hyderabad crew language — never the only text on screen. */
export function LocalCaption({
  text,
  className = "mt-0.5 text-[11px] text-mute",
}: {
  text?: string | null;
  className?: string;
}) {
  const { showLocal } = useLocale();
  if (!showLocal || !text) return null;
  return (
    <p className={className}>
      <span className="mr-1.5 font-mono text-[9px] uppercase tracking-widest text-teal/80">Telugu</span>
      {text}
    </p>
  );
}
