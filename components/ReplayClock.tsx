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
  live?: boolean;
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

  const formatCountdown = (h: number) => {
    if (h === 0) return "T – 00:00";
    return `T – ${String(Math.abs(h)).padStart(2, "0")}:00`;
  };

  return (
    <div className={`flex items-center gap-3 ${props.live ? "opacity-50" : ""}`}>
      <button
        type="button"
        onClick={handlePlayToggle}
        disabled={props.live}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition ${
          isCurrentlyPlaying
            ? "border-amber/50 bg-amber/15 text-amber"
            : "border-teal/40 bg-teal/15 text-teal hover:bg-teal/25"
        }`}
        aria-label={isCurrentlyPlaying ? "Pause replay" : "Replay storm"}
      >
        {isCurrentlyPlaying ? (
          <span className="flex gap-0.5">
            <span className="h-3 w-0.5 rounded-sm bg-current" />
            <span className="h-3 w-0.5 rounded-sm bg-current" />
          </span>
        ) : (
          <span className="ml-0.5 border-y-[6px] border-l-[10px] border-y-transparent border-l-current" />
        )}
      </button>

      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-semibold text-mute">Replay Storm</span>
          <span className="font-mono text-lg font-bold tabular-nums tracking-tight text-lagoon">{formatCountdown(activeHour)}</span>
        </div>
        <div className="mt-1 flex items-center gap-0">
          {STORM_BEATS.map((beat, i) => {
            const active = beat.hour === activeHour;
            const passed = beat.hour <= activeHour;
            return (
              <div key={beat.hour} className="flex items-center">
                {i > 0 && <span className={`h-px w-6 sm:w-8 ${passed ? "bg-teal/70" : "bg-line"}`} />}
                <button
                  type="button"
                  disabled={props.live}
                  onClick={() => handleStepChange(beat.hour)}
                  className={`rounded px-1 font-mono text-[10px] transition ${
                    active ? "font-bold text-teal" : "text-mute hover:text-paper"
                  }`}
                >
                  {beat.hour === 0 ? "T–0" : `T–${Math.abs(beat.hour)}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
