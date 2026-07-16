"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { pinIcon, TILE_URL, TILE_ATTRIBUTION } from "@/lib/mapPin";
import type { Map as LeafletMap } from "leaflet";

interface LocationMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  /** When false (the default), the map is a static, non-interactive preview. */
  interactive?: boolean;
  className?: string;
}

/**
 * Read-only map showing a single pin. Leaflet only touches the DOM inside
 * useEffect, so this renders as an empty container during SSR and hydrates
 * on the client — no `ssr: false` dynamic import needed.
 */
export function LocationMap({
  lat,
  lng,
  zoom = 11,
  interactive = false,
  className = "",
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        touchZoom: interactive,
        attributionControl: true,
      });

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng], { icon: pinIcon(L), keyboard: false }).addTo(map);

      mapRef.current = map;
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, zoom, interactive]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label="Map showing the location of this journal entry"
    />
  );
}
