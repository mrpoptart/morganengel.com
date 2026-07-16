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

export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
