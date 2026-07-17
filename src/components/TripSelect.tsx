"use client";

import { useEffect, useState } from "react";
import { getAllTrips } from "@/lib/trips";
import type { Trip } from "@/types/trip";

interface TripSelectProps {
  value: string;
  onChange: (tripId: string) => void;
  className?: string;
}

export function TripSelect({ value, onChange, className }: TripSelectProps) {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    getAllTrips()
      .then(setTrips)
      .catch((error) => console.error("Failed to load trips:", error));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "select select-bordered select-sm font-mono w-full max-w-xs"}
    >
      <option value="">No trip</option>
      {trips.map((t) => (
        <option key={t.id} value={t.id}>
          {t.title}
          {t.status === "draft" ? " (draft)" : ""}
        </option>
      ))}
    </select>
  );
}
