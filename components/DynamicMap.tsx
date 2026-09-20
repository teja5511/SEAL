"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
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

function MapBootScreen() {
  return (
    <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-3 bg-[#061525] font-mono text-xs text-mute">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-lagoon border-t-transparent" />
      <span className="font-semibold uppercase tracking-wider text-lagoon">Loading Hyderabad map</span>
    </div>
  );
}

export function DynamicMap(props: MapProps) {
  const [MapCanvas, setMapCanvas] = useState<ComponentType<MapProps> | null>(null);

  useEffect(() => {
    let alive = true;
    void import("./MapView").then((mod) => {
      if (!alive) return;
      setMapCanvas(() => mod.MapView ?? mod.default);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!MapCanvas) return <MapBootScreen />;
  return <MapCanvas {...props} />;
}
