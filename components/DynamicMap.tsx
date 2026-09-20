"use client";

import dynamic from "next/dynamic";
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
    <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center gap-3 bg-[#0e0e0e] font-mono text-xs text-mute">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      <span className="font-semibold uppercase tracking-wider text-teal">Loading Hyderabad map</span>
    </div>
  );
}

const MapCanvas = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: MapBootScreen,
});

export function DynamicMap(props: MapProps) {
  return <MapCanvas {...props} />;
}
