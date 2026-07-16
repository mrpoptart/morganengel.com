// Lightweight geocoding via OpenStreetMap's Nominatim service.
// No API key required. Called client-side and kept low-volume (per-keystroke
// calls are debounced by the caller) to stay within Nominatim's usage policy.

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";

export async function searchPlaces(queryText: string): Promise<GeocodeResult[]> {
  const q = queryText.trim();
  if (!q) return [];
  const url = `${NOMINATIM}/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: Array<{ lat: string; lon: string; display_name: string }> =
      await res.json();
    return data.map((d) => ({
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      label: d.display_name,
    }));
  } catch {
    return [];
  }
}

/** Turn coordinates into a short human-readable place name. */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const url = `${NOMINATIM}/reverse?format=jsonv2&zoom=14&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data: {
      display_name?: string;
      address?: Record<string, string>;
    } = await res.json();
    return shortLabel(data) ?? data.display_name ?? null;
  } catch {
    return null;
  }
}

/** Prefer a concise "City, Country" style label over the full display name. */
function shortLabel(data: {
  address?: Record<string, string>;
}): string | null {
  const a = data.address;
  if (!a) return null;
  const place =
    a.city ||
    a.town ||
    a.village ||
    a.hamlet ||
    a.suburb ||
    a.county ||
    a.state;
  const parts = [place, a.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
