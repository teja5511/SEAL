import type { StyleSpecification } from "maplibre-gl";

/** Free dark vector style — no API key. Carto raster tiles now watermark "API KEY REQUIRED". */
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
      paint: { "background-color": "#07080a" },
    },
  ],
};
