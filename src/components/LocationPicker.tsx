"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { pinIcon, TILE_URL, TILE_ATTRIBUTION } from "@/lib/mapPin";
import { searchPlaces, reverseGeocode, type GeocodeResult } from "@/lib/geocode";
import type { GeoLocation } from "@/types/journal";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

interface LocationPickerProps {
  value: GeoLocation | null;
  onChange: (loc: GeoLocation | null) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  // Latest props/handlers for use inside map event callbacks without re-init.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref-indirection breaks the moveMarker <-> setFromCoords cycle so neither
  // needs the other in its dependency array.
  const setFromCoordsRef = useRef<(lat: number, lng: number) => void>(() => {});

  const moveMarker = useCallback((lat: number, lng: number) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon: pinIcon(L),
        draggable: true,
      }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setFromCoordsRef.current(p.lat, p.lng);
      });
      markerRef.current = marker;
    }
  }, []);

  // Place a pin at coordinates, then resolve a human-readable label.
  const setFromCoords = useCallback(
    async (lat: number, lng: number) => {
      moveMarker(lat, lng);
      onChangeRef.current({ lat, lng, label: valueRef.current?.label });
      setResolving(true);
      const label = await reverseGeocode(lat, lng);
      setResolving(false);
      onChangeRef.current({ lat, lng, label: label ?? undefined });
    },
    [moveMarker]
  );
  setFromCoordsRef.current = setFromCoords;

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const start = valueRef.current;
      const map = L.map(containerRef.current, {
        center: start ? [start.lat, start.lng] : [20, 0],
        zoom: start ? 12 : 2,
        scrollWheelZoom: true,
      });
      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
      map.on("click", (e) => {
        void setFromCoords(e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
      if (start) moveMarker(start.lat, start.lng);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [setFromCoords, moveMarker]);

  // Keep the map in sync when the value changes from outside (GPS, photo, search).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (value) {
      moveMarker(value.lat, value.lng);
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 13));
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value, moveMarker]);

  function useMyLocation() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocation isn't available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        await setFromCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Couldn't get your location."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onSearchChange(q: string) {
    setSearchQuery(q);
    setShowResults(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const r = await searchPlaces(q);
      setResults(r);
      setSearching(false);
    }, 400);
  }

  function selectResult(r: GeocodeResult) {
    onChange({ lat: r.lat, lng: r.lng, label: r.label });
    setSearchQuery("");
    setResults([]);
    setShowResults(false);
  }

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  return (
    <div className="border border-base-content/10 rounded-xl bg-base-200/30 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="btn btn-outline btn-sm gap-1"
        >
          {locating ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <circle cx="12" cy="11" r="3" strokeWidth={2} />
            </svg>
          )}
          Use my location
        </button>

        <div className="relative flex-1 min-w-[12rem]">
          <input
            type="text"
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="input input-sm input-bordered w-full font-mono text-sm"
          />
          {showResults && (searching || results.length > 0) && (
            <ul className="absolute z-[500] top-full left-0 right-0 mt-1 bg-base-200 rounded-lg shadow-lg border border-base-300 max-h-56 overflow-y-auto">
              {searching && (
                <li className="px-3 py-2 text-sm text-base-content/50">
                  Searching…
                </li>
              )}
              {results.map((r, i) => (
                <li
                  key={`${r.lat},${r.lng},${i}`}
                  onMouseDown={() => selectResult(r)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-base-300 transition-colors"
                >
                  {r.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-64 w-full rounded-lg overflow-hidden border border-base-content/10 z-0"
      />

      <p className="text-xs text-base-content/40 font-mono">
        Tap the map or drag the pin to fine-tune.
      </p>

      {error && <p className="text-xs text-error font-mono">{error}</p>}

      {value ? (
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={value.label ?? ""}
              onChange={(e) =>
                onChange({ ...value, label: e.target.value || undefined })
              }
              placeholder={resolving ? "Finding place name…" : "Place name"}
              className="input input-ghost input-sm w-full px-0 font-mono text-sm focus:outline-none"
            />
            <p className="text-xs text-base-content/40 font-mono">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="btn btn-ghost btn-xs text-error"
          >
            Clear
          </button>
        </div>
      ) : (
        <p className="text-xs text-base-content/40 font-mono">
          No location set.
        </p>
      )}
    </div>
  );
}
