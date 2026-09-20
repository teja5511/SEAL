import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

/** Free dark vector tiles — no API key. Carto raster currently watermarks "API KEY REQUIRED". */
export const OPEN_FREE_MAP_DARK = "https://tiles.openfreemap.org/styles/dark";

const INK = "#061525";
const WATER = "#0a3d56";
const LAND = "#082032";
const ROAD = "#6cb4dc";
const ROAD_BRIGHT = "#8ecbf0";
const LAGOON = "#7ad4ff";
const LABEL = "#eaf4ff";
const HALO = "#041018";

const PLACE_FONT = ["Noto Sans Bold"];
const ROAD_FONT = ["Noto Sans Regular"];
const PLACE_NAME = ["coalesce", ["get", "name_en"], ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];

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
  filter: unknown,
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
  if (beforeId && map.getLayer(beforeId)) map.addLayer(layer as never, beforeId);
  else map.addLayer(layer as never);
}

function sizeStops(stops: number[]) {
  const expr: unknown[] = ["interpolate", ["linear"], ["zoom"]];
  for (let i = 0; i < stops.length; i += 2) expr.push(stops[i], stops[i + 1]);
  return expr;
}

function stylePlace(
  map: MapLibreMap,
  id: string,
  opts: { size: unknown; font?: string[]; maxzoom?: number; minzoom?: number; letter?: number }
) {
  if (!map.getLayer(id)) return;
  layout(map, id, "text-font", opts.font ?? PLACE_FONT);
  layout(map, id, "text-field", PLACE_NAME);
  layout(map, id, "text-size", opts.size);
  layout(map, id, "text-transform", "none");
  layout(map, id, "text-letter-spacing", opts.letter ?? 0.02);
  layout(map, id, "text-padding", 6);
  layout(map, id, "text-max-width", 8);
  layout(map, id, "text-optional", false);
  paint(map, id, "text-color", LABEL);
  paint(map, id, "text-opacity", 1);
  paint(map, id, "text-halo-color", HALO);
  paint(map, id, "text-halo-width", 1.8);
  paint(map, id, "text-halo-blur", 0.25);
  if (opts.minzoom != null || opts.maxzoom != null) {
    try {
      const current = map.getLayer(id) as { minzoom?: number; maxzoom?: number } | undefined;
      map.setLayerZoomRange(id, opts.minzoom ?? current?.minzoom ?? 0, opts.maxzoom ?? current?.maxzoom ?? 24);
    } catch {
      /* skip */
    }
  }
}

/** Recolor OpenFreeMap into a bluish ops grid with readable place names. */
export function applySealOpsPaint(map: MapLibreMap) {
  paint(map, "background", "background-color", INK);
  paint(map, "water", "fill-color", WATER);
  paint(map, "water", "fill-opacity", 0.95);
  paint(map, "waterway", "line-color", LAGOON);
  paint(map, "waterway", "line-opacity", 0.45);
  paint(map, "waterway", "line-width", 1.8);
  paint(map, "waterway", "line-blur", 1);

  paint(map, "landcover_ice_shelf", "fill-color", INK);
  paint(map, "landcover_glacier", "fill-color", INK);
  paint(map, "landuse_residential", "fill-color", LAND);
  paint(map, "landuse_residential", "fill-opacity", 0.4);
  paint(map, "landcover_wood", "fill-color", LAND);
  paint(map, "landcover_wood", "fill-pattern", undefined);
  paint(map, "landcover_wood", "fill-opacity", 0.22);
  paint(map, "landuse_park", "fill-color", "#0a2838");
  paint(map, "landuse_park", "fill-opacity", 0.35);

  paint(map, "building", "fill-color", "#0b2436");
  paint(map, "building", "fill-outline-color", "#123044");
  paint(map, "building", "fill-opacity", 0.35);

  paint(map, "aeroway-area", "fill-color", INK);
  paint(map, "aeroway-runway", "line-color", ROAD);
  paint(map, "aeroway-taxiway", "line-color", ROAD);
  paint(map, "aeroway-runway-casing", "line-color", INK);
  paint(map, "road_area_pier", "fill-color", INK);
  paint(map, "road_pier", "line-color", ROAD);

  const beforeRoads = map.getLayer("highway_path") ? "highway_path" : undefined;
  addGlow(
    map,
    "seal-glow-minor",
    ["all", LINE_ROADS, ["match", ["get", "class"], ["minor", "service", "track"], true, false]],
    "#2f6f96",
    2.2,
    2,
    0.32,
    beforeRoads
  );
  addGlow(
    map,
    "seal-glow-major",
    ["all", LINE_ROADS, ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk"], true, false]],
    "#3d8ec4",
    6,
    4,
    0.42,
    beforeRoads
  );
  addGlow(
    map,
    "seal-glow-motorway",
    ["all", LINE_ROADS, ["==", ["get", "class"], "motorway"]],
    LAGOON,
    10,
    6,
    0.4,
    beforeRoads
  );

  paint(map, "highway_path", "line-color", ROAD);
  paint(map, "highway_path", "line-opacity", 0.18);
  paint(map, "highway_path", "line-width", 0.5);

  paint(map, "highway_minor", "line-color", ROAD);
  paint(map, "highway_minor", "line-opacity", 0.38);
  paint(map, "highway_minor", "line-width", ["interpolate", ["exponential", 1.4], ["zoom"], 11, 0.4, 14, 0.8, 18, 1.6]);

  paint(map, "highway_major_casing", "line-color", "rgba(122, 212, 255, 0.12)");
  paint(map, "highway_major_casing", "line-width", ["interpolate", ["exponential", 1.3], ["zoom"], 10, 2.2, 16, 7]);
  paint(map, "highway_major_inner", "line-color", ROAD_BRIGHT);
  paint(map, "highway_major_inner", "line-opacity", 0.78);
  paint(map, "highway_major_inner", "line-width", ["interpolate", ["exponential", 1.3], ["zoom"], 10, 1.2, 16, 3.4]);
  paint(map, "highway_major_subtle", "line-color", ROAD);
  paint(map, "highway_major_subtle", "line-opacity", 0.5);

  paint(map, "highway_motorway_casing", "line-color", "rgba(122, 212, 255, 0.16)");
  paint(map, "highway_motorway_inner", "line-color", LAGOON);
  paint(map, "highway_motorway_inner", "line-opacity", 0.9);
  paint(map, "highway_motorway_inner", "line-width", ["interpolate", ["exponential", 1.35], ["zoom"], 8, 1.5, 14, 3.8, 18, 8]);
  paint(map, "highway_motorway_subtle", "line-color", ROAD_BRIGHT);
  paint(map, "highway_motorway_subtle", "line-opacity", 0.6);

  paint(map, "railway", "line-color", LAGOON);
  paint(map, "railway", "line-opacity", 0.16);
  paint(map, "railway_dashline", "line-color", INK);
  paint(map, "railway_transit", "line-color", LAGOON);
  paint(map, "railway_transit", "line-opacity", 0.12);
  paint(map, "railway_minor", "line-color", LAGOON);
  paint(map, "railway_minor", "line-opacity", 0.1);

  paint(map, "boundary_state", "line-opacity", 0);
  paint(map, "boundary_country_z0-4", "line-opacity", 0);
  paint(map, "boundary_country_z5-", "line-opacity", 0);

  paint(map, "road_oneway", "icon-opacity", 0);
  paint(map, "road_oneway_opposite", "icon-opacity", 0);

  stylePlace(map, "place_country_major", { size: sizeStops([0, 13, 4, 18]), minzoom: 0, maxzoom: 6 });
  stylePlace(map, "place_country_minor", { size: sizeStops([0, 12, 6, 15]), minzoom: 0, maxzoom: 8 });
  stylePlace(map, "place_country_other", { size: sizeStops([0, 11, 6, 14]), minzoom: 0, maxzoom: 8 });
  stylePlace(map, "place_state", { size: sizeStops([4, 12, 8, 15]), minzoom: 3, maxzoom: 10 });
  stylePlace(map, "place_city_large", { size: sizeStops([5, 14, 9, 18, 12, 16]), minzoom: 4, maxzoom: 13 });
  stylePlace(map, "place_city", { size: sizeStops([7, 13, 11, 16, 13, 15]), minzoom: 6, maxzoom: 14 });
  stylePlace(map, "place_town", { size: sizeStops([8, 12, 11, 14, 14, 15]), minzoom: 8, maxzoom: 15 });
  stylePlace(map, "place_suburb", { size: sizeStops([10, 12, 12, 14, 15, 15]), minzoom: 10, maxzoom: 16 });
  stylePlace(map, "place_village", { size: sizeStops([11, 12, 13, 13.5, 15, 14]), minzoom: 11, maxzoom: 15 });
  stylePlace(map, "place_other", {
    size: sizeStops([12.4, 11.5, 14, 13, 16, 14]),
    font: ROAD_FONT,
    minzoom: 12.4,
    maxzoom: 16,
    letter: 0.01,
  });

  for (const id of ["highway_name_other", "highway_name_motorway"] as const) {
    if (!map.getLayer(id)) continue;
    layout(map, id, "text-font", ROAD_FONT);
    layout(map, id, "text-size", sizeStops([13, 11, 16, 13]));
    layout(map, id, "text-transform", "none");
    layout(map, id, "text-letter-spacing", 0.04);
    paint(map, id, "text-color", "#c5e3f6");
    paint(map, id, "text-opacity", 0.82);
    paint(map, id, "text-halo-color", HALO);
    paint(map, id, "text-halo-width", 1.4);
    paint(map, id, "text-halo-blur", 0.2);
  }
  if (map.getLayer("highway_name_other")) {
    try {
      map.setLayerZoomRange("highway_name_other", 13, 24);
    } catch {
      /* skip */
    }
  }

  if (map.getLayer("water_name")) {
    layout(map, "water_name", "text-font", PLACE_FONT);
    layout(map, "water_name", "text-size", sizeStops([8, 11, 14, 13]));
    paint(map, "water_name", "text-color", LAGOON);
    paint(map, "water_name", "text-opacity", 0.9);
    paint(map, "water_name", "text-halo-color", HALO);
    paint(map, "water_name", "text-halo-width", 1.6);
  }

  if (map.getLayer("ne2_shaded")) {
    paint(map, "ne2_shaded", "raster-opacity", 0);
  }
}
