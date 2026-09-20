export function SealMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/seal-icon.jpg"
      alt="SEAL"
      className={`rounded-[22%] object-cover shadow-[0_0_18px_rgba(46,230,197,0.28)] ${className}`}
    />
  );
}
