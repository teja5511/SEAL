"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl, MapRef } from "react-map-gl/maplibre";
import type { RankedNala } from "@/lib/types";
import { floodDepthIfUnsealed } from "@/lib/rank";
import { OPEN_FREE_MAP_DARK, INK_FALLBACK_STYLE } from "@/lib/map-style";
import { AlertMark } from "@/components/AlertMark";
import { LocalCaption } from "./LocaleContext";

interface MapViewProps {
  nalas: RankedNala[];
  selectedNala: RankedNala | null;
  onSelectNala: (nala: RankedNala) => void;
  splitView?: boolean;
  hour: number;
}

const DEFAULT_MAP_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE || OPEN_FREE_MAP_DARK;

export function MapView({ nalas, selectedNala, onSelectNala, splitView = false, hour }: MapViewProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [activePopup, setActivePopup] = useState<RankedNala | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);
  const fellBack = useRef(false);

  useEffect(() => {
    if (!mapReady || !selectedNala) return;
    setActivePopup(selectedNala);
    mapRef.current?.flyTo({
      center: [selectedNala.lng, selectedNala.lat],
      zoom: 13,
      duration: 1200,
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

  const getPinColor = (nala: RankedNala) => {
    if (nala.status === "verified") return "#2ee6c5"; // sealed = teal
    if (nala.status === "held") return "#ff5c5c"; // heat held = danger
    if (nala.alert === "RED") return "#ff5c5c";
    if (nala.alert === "YELLOW") return "#ffb020";
    return "#2ee6c5";
  };

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden bg-ink">
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
        onLoad={handleLoad}
        onError={handleError}
      >
        <NavigationControl position="bottom-right" />

        {/* Nala Markers */}
        {nalas.map((nala) => {
          const isSelected = selectedNala?.id === nala.id;
          const isSealed = nala.status === "verified";
          const floodDepth = floodDepthIfUnsealed(nala, isSealed);
          const color = getPinColor(nala);

          return (
            <React.Fragment key={nala.id}>
              {/* RED Flood Inundation Aura at T-0 for unsealed RED pins */}
              {(splitView || hour === 0) && !isSealed && nala.alert === "RED" && (
                <Marker longitude={nala.lng} latitude={nala.lat} anchor="center">
                  <div className="relative flex items-center justify-center pointer-events-none" data-testid="flood-aura">
                    <div
                      className="absolute rounded-full bg-danger/25 border-2 border-danger animate-ping pointer-events-none"
                      style={{
                        width: `${Math.min(100, Math.max(40, (floodDepth || 1) * 45))}px`,
                        height: `${Math.min(100, Math.max(40, (floodDepth || 1) * 45))}px`,
                      }}
                    />
                    <div
                      className="rounded-full bg-danger/30 border border-danger animate-pulse pointer-events-none shadow-[0_0_24px_rgba(255,92,92,0.85)]"
                      style={{
                        width: `${Math.min(80, Math.max(30, (floodDepth || 1) * 35))}px`,
                        height: `${Math.min(80, Math.max(30, (floodDepth || 1) * 35))}px`,
                      }}
                    />
                  </div>
                </Marker>
              )}

              {/* Sealed Protection Shield Aura at T-0 */}
              {(splitView || hour === 0) && isSealed && (
                <Marker longitude={nala.lng} latitude={nala.lat} anchor="center">
                  <div className="relative flex items-center justify-center pointer-events-none" data-testid="teal-shield">
                    <div className="w-14 h-14 rounded-full bg-teal/20 border-2 border-teal animate-pulse pointer-events-none shadow-[0_0_18px_rgba(46,230,197,0.75)]" />
                    <div className="absolute w-8 h-8 rounded-full border border-teal/60 animate-ping opacity-40 pointer-events-none" />
                  </div>
                </Marker>
              )}

              {/* Marker Pin */}
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
                <div className="group cursor-pointer flex flex-col items-center">
                  {/* Status Tag on top */}
                  <div
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter shadow-sm mb-1 transition-all ${
                      isSealed
                        ? "bg-teal text-ink hover:bg-teal/90 flex items-center gap-1 ring-1 ring-teal/50"
                        : nala.status === "held"
                        ? "bg-danger text-white animate-pulse"
                        : nala.status === "dispatched"
                        ? "bg-amber text-ink"
                        : nala.alert === "RED"
                        ? "bg-danger/90 text-white"
                        : "bg-ink border border-line text-mute"
                    }`}
                  >
                    {isSealed ? "✓ SEALED · LEDGER" : nala.status === "held" ? "HOLD" : nala.id}
                  </div>

                  <div className="relative flex items-center justify-center">
                    {nala.alert === "RED" && !isSealed && (
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

        {/* Selected Nala Popup */}
        {activePopup && (
          <Popup
            longitude={activePopup.lng}
            latitude={activePopup.lat}
            anchor="top"
            closeOnClick={false}
            onClose={() => setActivePopup(null)}
            className="z-50"
          >
            <div className="min-w-[240px] max-w-[300px] text-xs font-mono text-white">
              <div className="flex items-center justify-between pb-1.5 border-b border-line mb-1.5">
                <span className="font-bold text-teal">{activePopup.id} · {activePopup.ward}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    activePopup.alert === "RED"
                      ? "bg-danger/20 text-danger border border-danger/40"
                      : activePopup.alert === "YELLOW"
                      ? "bg-amber/20 text-amber border border-amber/40"
                      : "bg-teal/20 text-teal border border-teal/40"
                  }`}
                >
                  {activePopup.alert}
                </span>
              </div>

              <div className="font-semibold text-sm text-white font-sans">{activePopup.nameEn}</div>
              <LocalCaption text={activePopup.nameTe} className="text-[11px] text-mute font-sans" />

              {/* Key hydrological metrics */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-line/60 text-[11px]">
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

              {/* Status and Action */}
              <div className="mt-2.5 pt-2 border-t border-line flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-mute">
                  Crew: <span className="text-white">{activePopup.crew}</span>
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
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

              {/* Flood warning and Ledger link */}
              {activePopup.status === "verified" ? (
                <div className="mt-2 p-2 rounded text-[11px] leading-tight bg-teal/15 text-teal border border-teal/40 space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>✓ SEALED (0.0m flood)</span>
                    <span className="text-amber">₹{activePopup.payInr}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-teal/30">
                    <span className="text-[10px] text-white/80">Proof verified</span>
                    <a
                      href="/ledger"
                      className="inline-flex items-center gap-1 font-bold text-teal hover:text-white underline text-[10px]"
                    >
                      LEDGER PROOF →
                    </a>
                  </div>
                </div>
              ) : (splitView || hour === 0) ? (
                <div className="mt-2 p-1.5 rounded text-[10px] leading-tight bg-danger/20 text-danger border border-danger/40">
                  Unsealed: {activePopup.historyFloodM}m flood depth. {activePopup.households.toLocaleString()} homes inundated.
                </div>
              ) : null}
            </div>
          </Popup>
        )}
      </Map>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-panel/90 px-3 py-1.5 font-mono text-[10px] text-mute backdrop-blur md:flex">
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
