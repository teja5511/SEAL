"use client";

import React from "react";

interface PhoneFrameProps {
  children: React.ReactNode;
  dock?: React.ReactNode;
  crewName?: string;
  wardName?: string;
  timeString?: string;
  onCamera?: () => void;
  onAttach?: () => void;
  cameraDisabled?: boolean;
}

export function PhoneFrame({
  children,
  dock,
  crewName = "Laxmi Crew · Moosarambagh",
  wardName = "Ward 42 Chaderghat",
  timeString = "12:48",
  onCamera,
  onAttach,
  cameraDisabled = false,
}: PhoneFrameProps) {
  return (
    <div className="relative mx-auto h-[760px] w-full max-w-[390px] select-none">
      <div className="pointer-events-none absolute -right-[3px] top-[120px] h-16 w-[3px] rounded-l-sm bg-[#3a4248]" />
      <div className="pointer-events-none absolute -left-[3px] top-[108px] h-8 w-[3px] rounded-r-sm bg-[#3a4248]" />
      <div className="pointer-events-none absolute -left-[3px] top-[148px] h-12 w-[3px] rounded-r-sm bg-[#3a4248]" />
      <div className="pointer-events-none absolute -left-[3px] top-[204px] h-12 w-[3px] rounded-r-sm bg-[#3a4248]" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[48px] border-[6px] border-[#222c32] bg-[#0b141a] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
        <div className="absolute left-1/2 top-2.5 z-40 flex h-[22px] w-[118px] -translate-x-1/2 items-center justify-center rounded-full bg-black">
          <div className="mr-3 h-[6px] w-11 rounded-full bg-[#1a1f24]" />
          <div className="h-2.5 w-2.5 rounded-full border border-white/10 bg-[#0f172a] shadow-[inset_0_0_4px_#1e3a5f]" />
        </div>

        <div className="z-30 flex h-11 items-end justify-between px-7 pb-1 font-mono text-[11px] text-white">
          <span className="font-semibold tracking-tight">{timeString}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-[#e8eef6]">
            <SignalBars />
            <span className="text-[10px]">5G</span>
            <Battery />
          </div>
        </div>

        <div className="z-30 flex h-14 items-center justify-between border-b border-[#2a3942] bg-[#1f2c34] px-2.5 shadow-md">
          <div className="flex min-w-0 items-center gap-2">
            <span className="px-0.5 text-lg leading-none text-[#00a884]">‹</span>
            <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00a884] text-sm font-bold text-white">
              S
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#2ee6c5] ring-2 ring-[#1f2c34]" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-white">SEAL Dispatch</div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-[#00a884]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00a884]" />
                <span className="truncate">
                  {crewName} · {wardName}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pr-1.5 text-[#8696a0]">
            <PhoneIcon />
            <VideoIcon />
            <span className="text-lg leading-none">⋮</span>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto p-3">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84'><g fill='none' stroke='%232ee6c5' stroke-width='1'><path d='M12 18c8 4 8 12 0 16'/><circle cx='62' cy='22' r='5'/><path d='M20 58h18M20 64h10'/><path d='M58 52l12 8-12 8z'/></g></svg>\")",
              backgroundSize: "84px 84px",
            }}
          />
          <div className="relative z-10 mx-auto mb-3 max-w-[280px] rounded-md border border-[#222d34] bg-[#182229] p-1.5 text-center font-mono text-[10px] leading-tight text-[#8696a0] shadow-sm">
            🔒 Messages & desilting proofs are verified by SEAL Smart Escrow Ledger.
          </div>
          <div className="relative z-10 space-y-2.5">{children}</div>
        </div>

        {dock ? (
          <div className="z-30 shrink-0 border-t border-[#2a3942] bg-[#0b141a] px-3 py-2">{dock}</div>
        ) : null}

        <div className="z-30 flex h-14 items-center gap-2 border-t border-[#2a3942] bg-[#1f2c34] px-2.5 pb-1">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-[#2a3942] px-3 text-xs text-mute">
            <span className="text-sm">😊</span>
            <span className="truncate font-sans text-[#8696a0]">Type a message</span>
            <button
              type="button"
              onClick={onAttach}
              disabled={cameraDisabled}
              className="ml-auto text-sm disabled:opacity-40"
              aria-label="Attach photo"
            >
              📎
            </button>
          </div>
          <button
            type="button"
            onClick={onCamera}
            disabled={cameraDisabled}
            aria-label="Send after-photo"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00a884] text-sm text-white shadow disabled:cursor-not-allowed disabled:bg-[#2a3942] disabled:text-[#8696a0]"
          >
            📷
          </button>
        </div>
        <div className="mx-auto mb-1.5 h-1 w-[118px] rounded-full bg-white/25" />
      </div>
    </div>
  );
}

function SignalBars() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden>
      <rect x="0" y="7" width="2.2" height="3" rx="0.4" fill="currentColor" />
      <rect x="3.6" y="5" width="2.2" height="5" rx="0.4" fill="currentColor" />
      <rect x="7.2" y="2.5" width="2.2" height="7.5" rx="0.4" fill="currentColor" />
      <rect x="10.8" y="0" width="2.2" height="10" rx="0.4" fill="currentColor" />
    </svg>
  );
}

function Battery() {
  return (
    <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden>
      <rect x="0.5" y="0.5" width="18" height="10" rx="2.2" fill="none" stroke="currentColor" />
      <rect x="2" y="2" width="13.5" height="7" rx="1" fill="#2ee6c5" />
      <rect x="19.2" y="3.2" width="1.6" height="4.6" rx="0.6" fill="currentColor" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.6 3.8c.4-.4 1-.5 1.5-.3l2.2 1c.5.2.8.7.8 1.3v2.1c0 .4-.2.8-.5 1.1l-1.1 1.1a12.6 12.6 0 0 0 6.3 6.3l1.1-1.1c.3-.3.7-.5 1.1-.5h2.1c.6 0 1.1.3 1.3.8l1 2.2c.2.5.1 1.1-.3 1.5l-1.4 1.4c-.4.4-1 .6-1.6.5C11.4 20.6 3.4 12.6 2.7 5.8c-.1-.6.1-1.2.5-1.6L6.6 3.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 24 18" fill="none" aria-hidden>
      <rect x="1" y="2" width="15" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 7.2 22 4.4v9.2l-5.5-2.8V7.2Z" fill="currentColor" />
    </svg>
  );
}
