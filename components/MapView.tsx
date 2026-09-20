"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl, MapRef } from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import type { MapLayer, MapVisible, RankedNala } from "@/lib/types";
import { floodDepthIfUnsealed } from "@/lib/rank";
import { OPEN_FREE_MAP_DARK, INK_FALLBACK_STYLE } from "@/lib/map-style";
import { LocalCaption } from "./LocaleContext";

interface MapViewProps {
  nalas: RankedNala[];
  selectedNala: RankedNala | null;
  onSelectNala: (nala: RankedNala) => void;
  splitView?: boolean;
  hour: number;
  query?: string;
  layer?: MapLayer;
  visible?: MapVisible;
}

const DEFAULT_MAP_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE || OPEN_FREE_MAP_DARK;
const DEFAULT_VISIBLE: MapVisible = { RED: true, YELLOW: true, WATCH: true, sealed: true };

function pinFill(nala: RankedNala, layer: MapLayer) {
  if (nala.status === "verified") return "#2ee6c5";
  if (nala.status === "held") return "#ff4d62";
  if (layer === "wbgt") return "#3d5566";
  if (layer === "rainfall") {
    if (nala.precipP90Mm >= 36) return "#ff4d62";
    if (nala.precipP90Mm >= 20) return "#7ad4ff";
    return "#2ee6c5";
  }
  if (nala.alert === "RED") return "#ff4d62";
  if (nala.alert === "YELLOW") return "#ffb020";
  return "#2ee6c5";
}

function shortPlace(n: RankedNala) {
  if (n.nameEn.includes(" at ")) return n.nameEn.split(" at ").pop() as string;
  if (n.nameEn.includes(" near ")) return n.nameEn.split(" near ").pop() as string;
  return n.ward;
}

export function MapView({
  nalas,
  selectedNala,
  onSelectNala,
  splitView = false,
  hour,
  query = "",
  layer = "risk",
  visible = DEFAULT_VISIBLE,
}: MapViewProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [activePopup, setActivePopup] = useState<RankedNala | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState<string | StyleSpecification>(DEFAULT_MAP_STYLE);
  const fellBack = useRef(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nalas.filter((n) => {
      const sealed = n.status === "verified";
      if (sealed && !visible.sealed) return false;
      if (!sealed && !visible[n.alert]) return false;
      if (!q) return true;
      return (
        n.nameEn.toLowerCase().includes(q) ||
        n.nameTe.toLowerCase().includes(q) ||
        n.ward.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q)
      );
    });
  }, [nalas, query, visible]);

  useEffect(() => {
    if (!mapReady || !selectedNala) return;
    setActivePopup(selectedNala);
    mapRef.current?.flyTo({
      center: [selectedNala.lng, selectedNala.lat],
      zoom: 13,
      duration: 900,
    });
  }, [selectedNala, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const resize = () => map.resize();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(map.getContainer());
    window.addEventListener("resize", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [mapReady]);

  const handleLoad = useCallback(() => {
    setMapReady(true);
    mapRef.current?.getMap()?.resize();
  }, []);

  const handleError = useCallback(() => {
    if (fellBack.current || mapReady) return;
    fellBack.current = true;
    setMapStyle(INK_FALLBACK_STYLE);
  }, [mapReady]);

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-ink">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 78.4867,
          latitude: 17.385,
          zoom: 11.2,
        }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
        attributionControl={false}
        dragRotate={false}
        onLoad={handleLoad}
        onError={handleError}
      >
        <NavigationControl position="bottom-right" />

        {shown.map((nala) => {
          const isSelected = selectedNala?.id === nala.id;
          const isSealed = nala.status === "verified";
          const floodDepth = floodDepthIfUnsealed(nala, isSealed);
          const color = pinFill(nala, layer);
          const scale = layer === "rainfall" ? Math.min(1.45, 0.85 + nala.precipP90Mm / 80) : 1;

          return (
            <React.Fragment key={nala.id}>
              {(splitView || hour === 0) && !isSealed && nala.alert === "RED" && (
                <Marker longitude={nala.lng} latitude={nala.lat} anchor="center">
                  <div className="pointer-events-none relative flex items-center justify-center" data-testid="flood-aura">
                    <div
                      className="absolute rounded-full border border-danger/80 bg-danger/20"
                      style={{
                        width: `${Math.min(88, Math.max(36, (floodDepth || 1) * 40))}px`,
                        height: `${Math.min(88, Math.max(36, (floodDepth || 1) * 40))}px`,
                      }}
                    />
                  </div>
                </Marker>
              )}

              {(splitView || hour === 0) && isSealed && (
                <Marker longitude={nala.lng} latitude={nala.lat} anchor="center">
                  <div className="pointer-events-none h-10 w-10 rounded-full border border-teal/70 bg-teal/15" data-testid="teal-shield" />
                </Marker>
              )}

              <Marker
                longitude={nala.lng}
                latitude={nala.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  onSelectNala(nala);
                  setActivePopup(nala);
                }}
              >
                <button type="button" className="group cursor-pointer" style={{ transform: `scale(${isSelected ? scale * 1.15 : scale})` }} aria-label={`${nala.id} ${nala.nameEn}`}>
                  <DropPin color={color} selected={isSelected} pulse={nala.alert === "RED" && !isSealed} />
                </button>
              </Marker>
            </React.Fragment>
          );
        })}

        {activePopup && shown.some((n) => n.id === activePopup.id) && (
          <Popup
            longitude={activePopup.lng}
            latitude={activePopup.lat}
            anchor="bottom"
            closeOnClick={false}
            onClose={() => setActivePopup(null)}
            offset={36}
          >
            <div className="min-w-[148px] font-sans text-paper">
              <div className="font-mono text-[10px] text-mute">{activePopup.id}</div>
              <div className="text-[13px] font-semibold leading-tight">{shortPlace(activePopup)}</div>
              <LocalCaption text={activePopup.nameTe} className="text-[10px] text-mute" />
              <div className="mt-1 font-mono text-[12px] font-bold text-danger">Risk {activePopup.risk}</div>
            </div>
          </Popup>
        )}
      </Map>

      <div className="pointer-events-none absolute inset-0 map-vignette" />

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-2">
        {layer !== "wbgt" && (
          <div className="rounded-lg border border-line/80 bg-panel/90 px-2.5 py-2 backdrop-blur">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-mute">Rainfall Nowcast (mm)</p>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-gradient-to-r from-[#1b3a4a] via-[#2ee6c5] via-40% to-[#ff4d62]" />
            <div className="mt-1 flex justify-between font-mono text-[8px] text-mute">
              <span>0</span>
              <span>10</span>
              <span>25</span>
              <span>50</span>
              <span>100+</span>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line/80 bg-panel/90 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-mute backdrop-blur">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-danger" /> High Risk
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber" /> Watch
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-teal" /> Cleared
          </span>
        </div>
        <div className="w-36 font-mono text-[8px] text-mute">
          <div className="h-px bg-mute/50" />
          <div className="mt-0.5 flex justify-between">
            <span>0</span>
            <span>2.5</span>
            <span>5 km</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropPin({ color, selected, pulse }: { color: string; selected: boolean; pulse: boolean }) {
  return (
    <span className="relative block h-9 w-7">
      {pulse && (
        <span className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full opacity-50" style={{ backgroundColor: color }} />
      )}
      <svg viewBox="0 0 28 36" className={`h-9 w-7 drop-shadow ${selected ? "ring-0" : ""}`} aria-hidden>
        <path
          d="M14 1.2c-6.4 0-11.6 5-11.6 11.2 0 8.4 11.6 22 11.6 22s11.6-13.6 11.6-22C25.6 6.2 20.4 1.2 14 1.2z"
          fill={color}
          stroke="#061018"
          strokeWidth="1.4"
        />
        <circle cx="14" cy="12.2" r="4.1" fill="#061018" fillOpacity="0.55" />
        {selected && <circle cx="14" cy="12.2" r="2.1" fill="#e8eef6" />}
      </svg>
    </span>
  );
}
