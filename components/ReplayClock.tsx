"use client";

import { STORM_BEATS } from "@/lib/scenario";

interface ReplayClockProps {
  hour?: number;
  playing?: boolean;
  onPlay?: () => void;
  onStep?: (h: number) => void;
  currentHour?: number;
  onSelectHour?: (h: number) => void;
  setHour?: (h: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export function ReplayClock(props: ReplayClockProps) {
  const activeHour = props.hour ?? props.currentHour ?? -6;
  const isCurrentlyPlaying = props.playing ?? props.isPlaying ?? false;
  const handlePlayToggle = props.onPlay ?? props.onTogglePlay ?? (() => {});
  const handleStepChange = (h: number) => {
    if (props.setHour) props.setHour(h);
    if (props.onStep && props.onStep !== props.setHour) props.onStep(h);
    if (props.onSelectHour && props.onSelectHour !== props.setHour && props.onSelectHour !== props.onStep) {
      props.onSelectHour(h);
    }
  };
  const currentBeat = STORM_BEATS.find((b) => b.hour === activeHour) || STORM_BEATS[0];
  const progress = ((activeHour + 6) / 6) * 100;

  const formatCountdown = (h: number) => {
    if (h === 0) return "T–00:00 RAIN";
    return `T–0${Math.abs(h)}:00`;
  };

  return (
    <div className="hud-glass flex flex-col gap-2.5 overflow-visible rounded-hud p-3 shadow-hud">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-teal" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Storm clock</span>
        </div>
        <div className="font-mono text-sm font-bold tracking-wide text-teal">{formatCountdown(activeHour)}</div>
      </div>

      <div className="relative mt-1 px-1">
        <div className="absolute left-3 right-3 top-[11px] h-px bg-line" />
        <div
          className="absolute left-3 top-[11px] h-px bg-teal/70"
          style={{ width: `calc(${progress}% - 12px)` }}
        />
        <div className="relative grid grid-cols-4 gap-1.5">
          {STORM_BEATS.map((beat) => {
            const active = beat.hour === activeHour;
            const label = beat.hour === 0 ? "T-0" : `T${beat.hour}`;
            return (
              <button
                key={beat.hour}
                type="button"
                onClick={() => handleStepChange(beat.hour)}
                aria-label={label}
                data-hour={beat.hour}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={`z-10 h-2.5 w-2.5 rounded-full border-2 transition ${
                    active ? "border-teal bg-teal shadow-glow" : "border-line bg-ink"
                  }`}
                />
                <span
                  className={`w-full rounded-lg border py-1.5 text-center font-mono text-[11px] transition ${
                    active
                      ? "border-teal bg-teal/15 font-bold text-teal"
                      : "border-line bg-ink/60 text-mute hover:border-mute/40 hover:text-paper"
                  }`}
                >
                  <span className="block font-bold">{label}</span>
                  <span className="mt-0.5 block text-[10px] opacity-80">
                    {beat.hour === -6
                      ? "Idle"
                      : beat.hour === -4
                        ? "Nowcast"
                        : beat.hour === -2
                          ? "Proof"
                          : "Rain"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-line/50 pt-2">
        <button
          type="button"
          onClick={handlePlayToggle}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 px-3 font-mono text-xs font-bold transition ${
            isCurrentlyPlaying
              ? "border border-amber/50 bg-amber/20 text-amber hover:bg-amber/30"
              : "bg-teal font-semibold text-ink hover:bg-teal/90 shadow-glow"
          }`}
        >
          {isCurrentlyPlaying ? "Pause replay" : "Replay storm"}
        </button>
        <div className="px-2 font-mono text-[11px] text-mute">
          {currentBeat.precipP90Mm}mm p90 · {currentBeat.tempC}°C
        </div>
      </div>
    </div>
  );
}
