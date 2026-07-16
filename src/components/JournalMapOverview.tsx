"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { pinIcon, TILE_URL, TILE_ATTRIBUTION } from "@/lib/mapPin";
import type { Map as LeafletMap } from "leaflet";

export interface JournalPoint {
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

export function JournalMapOverview({
  points,
  className = "",
}: {
  points: JournalPoint[];
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

      const latlngs: [number, number][] = [];
      for (const p of points) {
        const marker = L.marker([p.lat, p.lng], { icon: pinIcon(L) }).addTo(map);
        const label = p.label ? `<div>${escapeHtml(p.label)}</div>` : "";
        marker.bindPopup(
          `<a href="/journal/${encodeURIComponent(p.slug)}" style="font-weight:600;color:#8be9fd;">${escapeHtml(
            p.title
          )}</a>${label}`
        );
        latlngs.push([p.lat, p.lng]);
      }

      if (latlngs.length === 1) {
        map.setView(latlngs[0], 10);
      } else if (latlngs.length > 1) {
        map.fitBounds(latlngs, { padding: [40, 40] });
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
      aria-label="Map of all journal entry locations"
    />
  );
}
