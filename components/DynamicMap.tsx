"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { MapLayer, MapVisible, RankedNala } from "@/lib/types";

type MapProps = {
  nalas: RankedNala[];
  selectedNala: RankedNala | null;
  onSelectNala: (nala: RankedNala) => void;
  splitView?: boolean;
  hour: number;
  query?: string;
  layer?: MapLayer;
  visible?: MapVisible;
};

function MapBootScreen({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-3 bg-ink font-mono text-xs text-mute">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      <span className="font-semibold uppercase tracking-wider text-teal">{label}</span>
    </div>
  );
}

export function DynamicMap(props: MapProps) {
  const [MapView, setMapView] = useState<ComponentType<MapProps> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("./MapView")
      .then((mod) => {
        if (!cancelled) setMapView(() => mod.MapView);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Map failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-2 bg-ink px-6 text-center font-mono text-xs text-mute">
        <p className="font-semibold uppercase tracking-wider text-danger">Map failed to load</p>
        <p className="max-w-sm text-[11px]">{error}</p>
      </div>
    );
  }

  if (!MapView) return <MapBootScreen label="Loading Hyderabad map" />;

  return <MapView {...props} />;
}
