"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { TILE_URL, TILE_ATTRIBUTION } from "@/lib/mapPin";
import type { Map as LeafletMap } from "leaflet";

export interface RoutePoint {
  n: number;
  slug: string;
  title: string;
  lat: number;
  lng: number;
  label?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function TripRouteMap({
  points,
  className = "",
}: {
  points: RoutePoint[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [20, 0],
        zoom: 2,
        scrollWheelZoom: false,
      });
      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      const latlngs: [number, number][] = points.map((p) => [p.lat, p.lng]);

      // Connect the stops in order.
      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color: "#bd93f9",
          weight: 3,
          opacity: 0.7,
          dashArray: "6 8",
        }).addTo(map);
      }

      for (const p of points) {
        const icon = L.divIcon({
          className: "trip-route-pin",
          html: `<div style="width:28px;height:28px;border-radius:9999px;background:#bd93f9;color:#1a1b26;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;font-family:'JetBrains Mono',monospace;box-shadow:0 1px 4px rgba(0,0,0,0.5);border:2px solid #1a1b26;">${p.n}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        const label = p.label ? `<div>${escapeHtml(p.label)}</div>` : "";
        marker.bindPopup(
          `<a href="/journal/${encodeURIComponent(p.slug)}" style="font-weight:600;color:#8be9fd;">${escapeHtml(
            p.title
          )}</a>${label}`
        );
      }

      if (latlngs.length === 1) {
        map.setView(latlngs[0], 11);
      } else if (latlngs.length > 1) {
        map.fitBounds(latlngs, { padding: [48, 48] });
      }

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [points]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label="Map of the trip route"
    />
  );
}
