import type L from "leaflet";

/** A themed teardrop marker, built as a divIcon so no image assets are needed. */
export function pinIcon(leaflet: typeof L): L.DivIcon {
  return leaflet.divIcon({
    className: "journal-pin",
    html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="#bd93f9"/>
      <circle cx="14" cy="14" r="5" fill="#1a1b26"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
  });
}

// Esri's "Dark Gray Canvas" basemap: a dark raster style that, unlike CARTO's
// old basemaps.cartocdn.com tiles, needs no API key. It comes in two layers —
// a base and a separate labels/reference overlay — so we add both.
export const TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
export const TILE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
export const TILE_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Add the dark basemap (tiles + place labels) to a Leaflet map. Esri serves
 * these up to zoom 16; maxNativeZoom lets Leaflet upscale beyond that instead
 * of showing blank tiles. Labels are added after the base so they sit on top of
 * it, but both are in the tile pane, below the marker pane, so pins stay above.
 */
export function addBasemap(leaflet: typeof L, map: L.Map): void {
  leaflet
    .tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxNativeZoom: 16,
      maxZoom: 19,
    })
    .addTo(map);
  leaflet
    .tileLayer(TILE_LABELS_URL, { maxNativeZoom: 16, maxZoom: 19 })
    .addTo(map);
}
