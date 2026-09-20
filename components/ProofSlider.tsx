"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "./LocaleContext";

interface ProofSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeClog?: number;
  afterClog?: number;
  paidInr?: number;
  kgPlastic?: number;
  nalaName?: string;
  nalaNameTe?: string;
}

export function ProofSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "BEFORE: CLOGGED DRAIN",
  afterLabel = "AFTER: SEALED & CLEARED",
  beforeClog = 86,
  afterClog = 12,
  paidInr = 180,
  kgPlastic = 19,
  nalaName = "N-01 Musk storm drain at Moosarambagh",
  nalaNameTe,
}: ProofSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const sliderId = useId();
  const { showLocal } = useLocale();

  const moveTo = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    if (width <= 0) return;
    const pct = ((clientX - left) / width) * 100;
    setSliderPosition(Math.max(2, Math.min(98, pct)));
  }, []);

  const stopDrag = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      moveTo(e.clientX);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [moveTo, stopDrag]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };

  const rupees = paidInr.toLocaleString("en-IN");

  return (
    <div className="w-full overflow-hidden rounded-hud border border-line bg-panel shadow-hud">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ink/60 p-3.5">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal">
            Proof Audit Verification
          </span>
          <div className="font-display text-sm font-bold text-paper">{nalaName}</div>
          {showLocal && nalaNameTe ? (
            <div className="text-[11px] text-mute">
              <span className="mr-1.5 font-mono text-[9px] uppercase tracking-widest text-teal/80">Telugu</span>
              {nalaNameTe}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="rounded border border-teal/40 bg-teal/15 px-2 py-1 font-bold text-teal">
            ₹{rupees} ESCROW PAID
          </span>
          <span className="rounded border border-line bg-panel px-2 py-1 text-mute">
            {kgPlastic} kg Plastic Diverted
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        role="presentation"
        onPointerDown={onPointerDown}
        onPointerUp={stopDrag}
        onLostPointerCapture={stopDrag}
        className="relative aspect-[4/3] max-h-[460px] w-full cursor-ew-resize select-none overflow-hidden bg-black touch-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterUrl}
          alt="After desilting"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-teal/90 px-2.5 py-1 font-mono text-xs font-bold text-ink shadow-lg">
          {afterLabel} ({afterClog}%)
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt="Before desilting"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-danger/90 px-2.5 py-1 font-mono text-xs font-bold text-white shadow-lg">
          {beforeLabel} ({beforeClog}%)
        </div>

        <div
          className="pointer-events-none absolute top-0 bottom-0 z-10 flex w-1 items-center justify-center bg-teal shadow-[0_0_12px_rgba(46,230,197,0.8)]"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-teal bg-ink font-mono text-xs text-teal shadow-xl">
            ↔
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-line bg-ink/40 p-3">
        <span className="font-mono text-[11px] font-bold text-danger">BEFORE</span>
        <input
          id={sliderId}
          type="range"
          min={2}
          max={98}
          value={sliderPosition}
          aria-label="Before and after proof slider"
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="h-2 min-w-0 w-full flex-1 cursor-pointer accent-teal"
        />
        <span className="font-mono text-[11px] font-bold text-teal">AFTER</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-t border-line bg-panel py-2.5 text-center font-mono text-xs">
        <div>
          <div className="text-[10px] text-mute">CLOG REDUCTION</div>
          <div className="text-sm font-bold text-teal">-{beforeClog - afterClog}%</div>
        </div>
        <div>
          <div className="text-[10px] text-mute">SOLID WASTE EXTRACTED</div>
          <div className="text-sm font-bold text-white">{kgPlastic} kg</div>
        </div>
        <div>
          <div className="text-[10px] text-mute">PAYMENT SETTLEMENT</div>
          <div className="text-sm font-bold text-amber">₹{rupees} via UPI</div>
        </div>
      </div>
    </div>
  );
}
