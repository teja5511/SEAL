export function SealMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="#0c1218" stroke="rgba(46,230,197,0.4)" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="#2ee6c5" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="5.5" fill="none" stroke="#2ee6c5" strokeOpacity="0.45" strokeWidth="1" />
      <path d="M11 16h10M16 11v10" stroke="#2ee6c5" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.6" fill="#ffb020" />
    </svg>
  );
}
