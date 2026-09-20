"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl, MapRef } from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import type { MapLayer, MapVisible, RankedNala } from "@/lib/types";
import { floodDepthIfUnsealed } from "@/lib/rank";
import { OPEN_FREE_MAP_DARK, INK_FALLBACK_STYLE, applySealOpsPaint } from "@/lib/map-style";
import { AlertMark } from "@/components/AlertMark";
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

const DEFAULT_MAP_STYLE: string | StyleSpecification = process.env.NEXT_PUBLIC_MAP_STYLE || OPEN_FREE_MAP_DARK;
const DEFAULT_VISIBLE: MapVisible = { RED: true, YELLOW: true, WATCH: true, sealed: true };

function pinColor(nala: RankedNala, layer: MapLayer) {
  if (nala.status === "verified") return "#2ee6c5";
  if (nala.status === "held") return "#ff5c5c";
  if (layer === "wbgt") return "#5a6b78";
  if (layer === "rainfall") {
    if (nala.precipP90Mm >= 36) return "#ff5c5c";
    if (nala.precipP90Mm >= 20) return "#7ad4ff";
    return "#2ee6c5";
  }
  if (nala.alert === "RED") return "#ff5c5c";
  if (nala.alert === "YELLOW") return "#ffb020";
  return "#2ee6c5";
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
  const lastFlownId = useRef<string | null>(null);

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
    if (lastFlownId.current === selectedNala.id) return;
    const first = lastFlownId.current === null;
    lastFlownId.current = selectedNala.id;
    if (first) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    const center = map.getCenter();
    const dx = center.lng - selectedNala.lng;
    const dy = center.lat - selectedNala.lat;
    if (dx * dx + dy * dy < 0.015 * 0.015) return;

    map.easeTo({
      center: [selectedNala.lng, selectedNala.lat],
      zoom: Math.max(map.getZoom(), 12.6),
      duration: 400,
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
    const map = mapRef.current?.getMap();
    if (!map) return;
    applySealOpsPaint(map);
    map.resize();
    requestAnimationFrame(() => map.resize());
    window.setTimeout(() => map.resize(), 250);
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
          zoom: 11.8,
        }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
        attributionControl={false}
        dragRotate={false}
        fadeDuration={0}
        onLoad={handleLoad}
        onError={handleError}
      >
        <NavigationControl position="bottom-right" />

        {shown.map((nala) => {
          const isSelected = selectedNala?.id === nala.id;
          const isSealed = nala.status === "verified";
          const floodDepth = floodDepthIfUnsealed(nala, isSealed);
          const color = pinColor(nala, layer);

          return (
            <React.Fragment key={nala.id}>
              {layer === "rainfall" && (
                <Marker longitude={nala.lng} latitude={nala.lat} anchor="center">
                  <div
                    className="pointer-events-none rounded-full border border-lagoon/40 bg-lagoon/15"
                    style={{
                      width: `${Math.min(72, 18 + nala.precipP90Mm)}px`,
                      height: `${Math.min(72, 18 + nala.precipP90Mm)}px`,
                    }}
                  />
                </Marker>
              )}

              {(splitView || hour === 0) && !isSealed && nala.alert === "RED" && (
                <Marker longitude={nala.lng} latitude={nala.lat} anchor="center">
                  <div className="pointer-events-none relative flex items-center justify-center" data-testid="flood-aura">
                    <div
                      className="pointer-events-none absolute rounded-full border-2 border-danger/80 bg-danger/20"
                      style={{
                        width: `${Math.min(100, Math.max(40, (floodDepth || 1) * 45))}px`,
                        height: `${Math.min(100, Math.max(40, (floodDepth || 1) * 45))}px`,
                      }}
                    />
                    <div
                      className="pointer-events-none animate-pulse rounded-full border border-danger bg-danger/30 shadow-[0_0_24px_rgba(255,92,92,0.85)]"
                      style={{
                        width: `${Math.min(80, Math.max(30, (floodDepth || 1) * 35))}px`,
                        height: `${Math.min(80, Math.max(30, (floodDepth || 1) * 35))}px`,
                      }}
                    />
                  </div>
                </Marker>
              )}

              {(splitView || hour === 0) && isSealed && (
                <Marker longitude={nala.lng} latitude={nala.lat} anchor="center">
                  <div className="pointer-events-none relative flex items-center justify-center" data-testid="teal-shield">
                    <div className="pointer-events-none h-14 w-14 animate-pulse rounded-full border-2 border-teal bg-teal/20 shadow-[0_0_18px_rgba(46,230,197,0.75)]" />
                  </div>
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
                <div className="group flex cursor-pointer flex-col items-center">
                  <div
                    className={`mb-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-tighter shadow-sm ${
                      isSealed
                        ? "bg-teal text-ink ring-1 ring-teal/50"
                        : nala.status === "held"
                          ? "animate-pulse bg-danger text-white"
                          : nala.status === "dispatched"
                            ? "bg-amber text-ink"
                            : nala.alert === "RED"
                              ? "bg-danger/90 text-white"
                              : "border border-line bg-ink text-mute"
                    }`}
                  >
                    {isSealed ? "✓ SEALED · LEDGER" : nala.status === "held" ? "HOLD" : nala.id}
                  </div>

                  <div className="relative flex items-center justify-center">
                    {isSelected && nala.alert === "RED" && !isSealed && (
                      <span
                        className="absolute inline-flex h-6 w-6 animate-ping rounded-full opacity-60"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <div
                      className={`grid h-5 w-5 place-items-center border-2 border-ink bg-ink/80 shadow-lg transition-transform ${
                        isSelected ? "scale-125 ring-2 ring-teal" : "group-hover:scale-110"
                      }`}
                    >
                      <AlertMark
                        alert={nala.alert}
                        sealed={isSealed}
                        held={nala.status === "held"}
                        size="md"
                      />
                    </div>
                  </div>
                </div>
              </Marker>
            </React.Fragment>
          );
        })}

        {activePopup && shown.some((n) => n.id === activePopup.id) && (
          <Popup
            longitude={activePopup.lng}
            latitude={activePopup.lat}
            anchor="top"
            closeOnClick={false}
            onClose={() => setActivePopup(null)}
            className="z-50"
          >
            <div className="min-w-[240px] max-w-[300px] font-mono text-xs text-white">
              <div className="mb-1.5 flex items-center justify-between border-b border-line pb-1.5">
                <span className="font-bold text-teal">
                  {activePopup.id} · {activePopup.ward}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    activePopup.alert === "RED"
                      ? "border border-danger/40 bg-danger/20 text-danger"
                      : activePopup.alert === "YELLOW"
                        ? "border border-amber/40 bg-amber/20 text-amber"
                        : "border border-teal/40 bg-teal/20 text-teal"
                  }`}
                >
                  {activePopup.alert}
                </span>
              </div>

              <div className="font-sans text-sm font-semibold text-white">{activePopup.nameEn}</div>
              <LocalCaption text={activePopup.nameTe} className="font-sans text-[11px] text-mute" />

              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line/60 pt-2 text-[11px]">
                <div>
                  <span className="text-mute">Clog:</span>{" "}
                  <span className="font-bold text-white">{activePopup.clog}%</span> ({activePopup.clogClass})
                </div>
                <div>
                  <span className="text-mute">Risk Score:</span>{" "}
                  <span className="font-bold text-teal">{activePopup.risk}</span>
                </div>
                <div>
                  <span className="text-mute">Households:</span>{" "}
                  <span className="font-bold text-white">{activePopup.households.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-mute">Water Prob:</span>{" "}
                  <span className="font-bold text-white">{Math.round(activePopup.waterProb * 100)}%</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
                <span className="text-[10px] font-bold uppercase text-mute">
                  Crew: <span className="text-white">{activePopup.crew}</span>
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    activePopup.status === "verified"
                      ? "bg-teal/20 text-teal"
                      : activePopup.status === "held"
                        ? "bg-danger/20 text-danger"
                        : "bg-panel text-mute"
                  }`}
                >
                  {activePopup.status}
                </span>
              </div>

              {activePopup.status === "verified" ? (
                <div className="mt-2 space-y-1 rounded border border-teal/40 bg-teal/15 p-2 text-[11px] leading-tight text-teal">
                  <div className="flex items-center justify-between font-bold">
                    <span>✓ SEALED (0.0m flood)</span>
                    <span className="text-amber">₹{activePopup.payInr}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-teal/30 pt-1">
                    <span className="text-[10px] text-white/80">Proof verified</span>
                    <a href="/ledger" className="text-[10px] font-bold text-teal underline hover:text-white">
                      LEDGER PROOF →
                    </a>
                  </div>
                </div>
              ) : splitView || hour === 0 ? (
                <div className="mt-2 rounded border border-danger/40 bg-danger/20 p-1.5 text-[10px] leading-tight text-danger">
                  Unsealed: {activePopup.historyFloodM}m flood depth. {activePopup.households.toLocaleString()} homes inundated.
                </div>
              ) : null}
            </div>
          </Popup>
        )}
      </Map>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-panel/90 px-3 py-1.5 font-mono text-[10px] text-mute backdrop-blur md:flex">
        <span className="relative flex h-3 w-3 items-center justify-center overflow-hidden rounded-full border border-teal">
          <span className="absolute h-px w-full origin-center bg-teal animate-radar" />
        </span>
        <span>Hyderabad basin · © OSM · OpenFreeMap</span>
        <span className="text-line">|</span>
        <span className="inline-flex items-center gap-1">
          <AlertMark alert="RED" /> RED diamond
        </span>
        <span className="inline-flex items-center gap-1">
          <AlertMark alert="YELLOW" /> YELLOW triangle
        </span>
        <span className="inline-flex items-center gap-1">
          <AlertMark alert="WATCH" /> WATCH circle
        </span>
        <span className="inline-flex items-center gap-1">
          <AlertMark alert="WATCH" sealed /> SEALED
        </span>
      </div>

      {(splitView || hour === 0) && (
        <div className="pointer-events-none absolute bottom-14 left-1/2 z-10 -translate-x-1/2 rounded-full border border-teal/40 bg-panel/95 px-4 py-1.5 font-mono text-[11px] text-paper shadow-hud backdrop-blur">
          T–0 split · teal sealed (0 m) · red unsealed flood
        </div>
      )}
    </div>
  );
}

export default MapView;

