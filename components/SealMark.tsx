export function SealMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#0b1520" stroke="rgba(122,212,255,0.45)" />
      <path
        d="M8 15.5c3.2-3.8 6.4-3.8 9.6 0s6.4 3.8 9.6 0 6.4-3.8 9.6 0"
        fill="none"
        stroke="#7ad4ff"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 21.5c3.2-3.8 6.4-3.8 9.6 0s6.4 3.8 9.6 0 6.4-3.8 9.6 0"
        fill="none"
        stroke="#2ee6c5"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 27.5c3.2-3.8 6.4-3.8 9.6 0s6.4 3.8 9.6 0 6.4-3.8 9.6 0"
        fill="none"
        stroke="#2ee6c5"
        strokeOpacity="0.45"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
