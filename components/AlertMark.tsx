import type { AlertLevel } from "@/lib/types";

type MarkSize = "sm" | "md";

export function AlertMark({
  alert,
  sealed = false,
  held = false,
  size = "sm",
}: {
  alert: AlertLevel;
  sealed?: boolean;
  held?: boolean;
  size?: MarkSize;
}) {
  const px = size === "md" ? 12 : 9;
  const cls = size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";

  if (sealed) {
    return (
      <span
        className={`inline-block rounded-[2px] bg-teal ${cls}`}
        title="Sealed"
        aria-hidden
      />
    );
  }
  if (held) {
    return (
      <span
        className={`inline-block rounded-full border-2 border-danger bg-transparent ${cls}`}
        title="Heat HOLD"
        aria-hidden
      />
    );
  }
  if (alert === "RED") {
    return (
      <span
        className="inline-block rotate-45 bg-danger"
        style={{ width: px, height: px }}
        title="RED"
        aria-hidden
      />
    );
  }
  if (alert === "YELLOW") {
    return (
      <span
        className="inline-block"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${Math.round(px * 0.65)}px solid transparent`,
          borderRight: `${Math.round(px * 0.65)}px solid transparent`,
          borderBottom: `${px + 1}px solid #ffb020`,
        }}
        title="YELLOW"
        aria-hidden
      />
    );
  }
  return <span className={`inline-block rounded-full bg-teal ${cls}`} title="WATCH" aria-hidden />;
}
