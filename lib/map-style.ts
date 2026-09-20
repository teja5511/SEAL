import type { FilterSpecification, Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

/** Free dark vector tiles — no API key. Carto raster currently watermarks "API KEY REQUIRED". */
export const OPEN_FREE_MAP_DARK = "https://tiles.openfreemap.org/styles/dark";

const INK = "#031016";
const WATER = "#07262f";
const LAND = "#04141c";
const TEAL = "#2ee6c5";
const LAGOON = "#7ad4ff";

/** Last-resort ink so pins still render if tile CDNs are blocked. */
export const INK_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  name: "Ink fallback",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": INK },
    },
  ],
};

function paint(map: MapLibreMap, id: string, prop: string, value: unknown) {
  if (!map.getLayer(id)) return;
  try {
    map.setPaintProperty(id, prop, value);
  } catch {
    /* layer exists but property does not — skip */
  }
}

function layout(map: MapLibreMap, id: string, prop: string, value: unknown) {
  if (!map.getLayer(id)) return;
  try {
    map.setLayoutProperty(id, prop, value);
  } catch {
    /* skip */
  }
}

const LINE_ROADS = ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false];

function addGlow(
  map: MapLibreMap,
  id: string,
  filter: any,
  color: string,
  width: number,
  blur: number,
  opacity: number,
  beforeId?: string
) {
  if (map.getLayer(id) || !map.getSource("openmaptiles")) return;
  const layer = {
    id,
    type: "line" as const,
    source: "openmaptiles",
    "source-layer": "transportation",
    minzoom: 8,
    filter,
    layout: { "line-cap": "round" as const, "line-join": "round" as const },
    paint: {
      "line-color": color,
      "line-width": width,
      "line-blur": blur,
      "line-opacity": opacity,
    },
  };
  if (beforeId && map.getLayer(beforeId)) map.addLayer(layer, beforeId);
  else map.addLayer(layer);
}

/** Recolor OpenFreeMap into a SEAL ops grid: dark ink land, glowing teal streets. */
export function applySealOpsPaint(map: MapLibreMap) {
  paint(map, "background", "background-color", INK);
  paint(map, "water", "fill-color", WATER);
  paint(map, "water", "fill-opacity", 0.95);
  paint(map, "waterway", "line-color", LAGOON);
  paint(map, "waterway", "line-opacity", 0.35);
  paint(map, "waterway", "line-width", 1.6);
  paint(map, "waterway", "line-blur", 1.2);

  paint(map, "landcover_ice_shelf", "fill-color", INK);
  paint(map, "landcover_glacier", "fill-color", INK);
  paint(map, "landuse_residential", "fill-color", LAND);
  paint(map, "landuse_residential", "fill-opacity", 0.35);
  paint(map, "landcover_wood", "fill-color", LAND);
  paint(map, "landcover_wood", "fill-pattern", undefined);
  paint(map, "landcover_wood", "fill-opacity", 0.2);
  paint(map, "landuse_park", "fill-color", LAND);
  paint(map, "landuse_park", "fill-opacity", 0.25);

  paint(map, "building", "fill-color", INK);
  paint(map, "building", "fill-outline-color", INK);
  paint(map, "building", "fill-opacity", 0.12);

  paint(map, "aeroway-area", "fill-color", INK);
  paint(map, "aeroway-runway", "line-color", INK);
  paint(map, "aeroway-taxiway", "line-color", INK);
  paint(map, "aeroway-runway-casing", "line-color", INK);
  paint(map, "road_area_pier", "fill-color", INK);
  paint(map, "road_pier", "line-color", INK);

  const beforeRoads = map.getLayer("highway_path") ? "highway_path" : undefined;
  addGlow(
    map,
    "seal-glow-minor",
    ["all", LINE_ROADS, ["match", ["get", "class"], ["minor", "service", "track"], true, false]],
    TEAL,
    2.4,
    2.2,
    0.28,
    beforeRoads
  );
  addGlow(
    map,
    "seal-glow-major",
    ["all", LINE_ROADS, ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk"], true, false]],
    TEAL,
    6,
    4,
    0.38,
    beforeRoads
  );
  addGlow(
    map,
    "seal-glow-motorway",
    ["all", LINE_ROADS, ["==", ["get", "class"], "motorway"]],
    TEAL,
    10,
    6,
    0.45,
    beforeRoads
  );

  paint(map, "highway_path", "line-color", TEAL);
  paint(map, "highway_path", "line-opacity", 0.12);
  paint(map, "highway_path", "line-width", 0.4);

  paint(map, "highway_minor", "line-color", TEAL);
  paint(map, "highway_minor", "line-opacity", 0.32);
  paint(map, "highway_minor", "line-width", ["interpolate", ["exponential", 1.4], ["zoom"], 11, 0.35, 14, 0.7, 18, 1.4]);

  paint(map, "highway_major_casing", "line-color", "rgba(46, 230, 197, 0.08)");
  paint(map, "highway_major_casing", "line-width", ["interpolate", ["exponential", 1.3], ["zoom"], 10, 2.2, 16, 7]);
  paint(map, "highway_major_inner", "line-color", TEAL);
  paint(map, "highway_major_inner", "line-opacity", 0.72);
  paint(map, "highway_major_inner", "line-width", ["interpolate", ["exponential", 1.3], ["zoom"], 10, 1.1, 16, 3.2]);
  paint(map, "highway_major_subtle", "line-color", TEAL);
  paint(map, "highway_major_subtle", "line-opacity", 0.4);

  paint(map, "highway_motorway_casing", "line-color", "rgba(46, 230, 197, 0.12)");
  paint(map, "highway_motorway_inner", "line-color", TEAL);
  paint(map, "highway_motorway_inner", "line-opacity", 0.92);
  paint(map, "highway_motorway_inner", "line-width", ["interpolate", ["exponential", 1.35], ["zoom"], 8, 1.4, 14, 3.6, 18, 8]);
  paint(map, "highway_motorway_subtle", "line-color", TEAL);
  paint(map, "highway_motorway_subtle", "line-opacity", 0.55);

  paint(map, "railway", "line-color", LAGOON);
  paint(map, "railway", "line-opacity", 0.12);
  paint(map, "railway_dashline", "line-color", INK);
  paint(map, "railway_transit", "line-color", LAGOON);
  paint(map, "railway_transit", "line-opacity", 0.1);
  paint(map, "railway_minor", "line-color", LAGOON);
  paint(map, "railway_minor", "line-opacity", 0.08);

  paint(map, "boundary_state", "line-opacity", 0);
  paint(map, "boundary_country_z0-4", "line-opacity", 0);
  paint(map, "boundary_country_z5-", "line-opacity", 0);

  paint(map, "road_oneway", "icon-opacity", 0);
  paint(map, "road_oneway_opposite", "icon-opacity", 0);

  const style = map.getStyle();
  for (const layer of style?.layers ?? []) {
    if (layer.type !== "symbol") continue;
    const id = layer.id;
    const isWater = id.includes("water");
    const isRoad = id.includes("highway_name") || id.includes("road");
    paint(map, id, "text-color", isWater ? LAGOON : isRoad ? "rgba(122, 212, 255, 0.28)" : "rgba(232, 238, 246, 0.38)");
    paint(map, id, "text-halo-color", INK);
    paint(map, id, "text-halo-width", 1.2);
    paint(map, id, "text-opacity", isRoad ? 0.22 : isWater ? 0.45 : 0.4);
    layout(map, id, "text-transform", "uppercase");
  }

  if (map.getLayer("ne2_shaded")) {
    paint(map, "ne2_shaded", "raster-opacity", 0);
  }
}
