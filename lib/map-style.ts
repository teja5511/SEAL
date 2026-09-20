import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

/** Free dark vector tiles — no API key. Carto raster currently watermarks "API KEY REQUIRED". */
export const OPEN_FREE_MAP_DARK = "https://tiles.openfreemap.org/styles/dark";

/** Last-resort ink so pins still render if tile CDNs are blocked. */
export const INK_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  name: "Ink fallback",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#061018" },
    },
  ],
};

const INK = "#061018";
const WATER = "#0a2433";
const PARK = "#0b1e1c";
const BUILDING = "#0c1822";
const BUILDING_EDGE = "#1a3344";
const ROAD_MINOR = "#12202c";
const ROAD_MAJOR = "#1a3348";
const ROAD_CASE = "#0d1a24";
const MOTORWAY = "#1c3f4a";
const LABEL = "#8aa0b5";
const LABEL_HALO = "#061018";

function paint(map: MapLibreMap, id: string, prop: string, value: unknown) {
  if (!map.getLayer(id)) return;
  try {
    map.setPaintProperty(id, prop, value);
  } catch {
    /* layer exists but property does not — skip */
  }
}

/** Recolor OpenFreeMap dark (or any OFM-like style) into SEAL ink / lagoon ops. */
export function applySealOpsPaint(map: MapLibreMap) {
  paint(map, "background", "background-color", INK);
  paint(map, "water", "fill-color", WATER);
  paint(map, "waterway", "line-color", WATER);
  paint(map, "water_name", "text-color", "rgba(122, 212, 255, 0.55)");
  paint(map, "water_name", "text-halo-color", INK);

  paint(map, "landcover_ice_shelf", "fill-color", INK);
  paint(map, "landcover_glacier", "fill-color", INK);
  paint(map, "landuse_residential", "fill-color", "#07141c");
  paint(map, "landcover_wood", "fill-color", PARK);
  paint(map, "landcover_wood", "fill-pattern", undefined);
  paint(map, "landuse_park", "fill-color", PARK);

  paint(map, "building", "fill-color", BUILDING);
  paint(map, "building", "fill-outline-color", BUILDING_EDGE);
  paint(map, "building", "fill-opacity", 0.85);

  paint(map, "highway_path", "line-color", ROAD_MINOR);
  paint(map, "highway_minor", "line-color", ROAD_MINOR);
  paint(map, "highway_major_casing", "line-color", ROAD_CASE);
  paint(map, "highway_major_inner", "line-color", ROAD_MAJOR);
  paint(map, "highway_major_subtle", "line-color", ROAD_MAJOR);
  paint(map, "highway_motorway_casing", "line-color", ROAD_CASE);
  paint(map, "highway_motorway_inner", "line-color", MOTORWAY);
  paint(map, "highway_motorway_subtle", "line-color", MOTORWAY);

  paint(map, "railway", "line-color", "#1a3344");
  paint(map, "railway_dashline", "line-color", INK);
  paint(map, "railway_transit", "line-color", "#1a3344");
  paint(map, "railway_minor", "line-color", "#1a3344");

  paint(map, "boundary_state", "line-color", "#1a3344");
  paint(map, "boundary_country_z0-4", "line-color", "#1a3344");
  paint(map, "boundary_country_z5-", "line-color", "#1a3344");

  const labelLayers = [
    "highway_name_other",
    "highway_name_motorway",
    "place_other",
    "place_suburb",
    "place_village",
    "place_town",
    "place_city",
    "place_city_large",
    "place_state",
    "place_country_other",
    "place_country_minor",
    "place_country_major",
  ];
  for (const id of labelLayers) {
    paint(map, id, "text-color", LABEL);
    paint(map, id, "text-halo-color", LABEL_HALO);
    paint(map, id, "text-opacity", id.startsWith("place_country") || id === "place_city_large" ? 0.85 : 0.55);
  }

  if (map.getLayer("ne2_shaded")) {
    paint(map, "ne2_shaded", "raster-opacity", 0);
  }
}
