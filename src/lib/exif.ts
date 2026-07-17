import exifr from "exifr";

export interface Gps {
  lat: number;
  lng: number;
}

function toGps(gps: { latitude?: number; longitude?: number } | undefined): Gps | null {
  if (
    gps &&
    typeof gps.latitude === "number" &&
    typeof gps.longitude === "number" &&
    !Number.isNaN(gps.latitude) &&
    !Number.isNaN(gps.longitude)
  ) {
    return { lat: gps.latitude, lng: gps.longitude };
  }
  return null;
}

/**
 * Read GPS coordinates embedded in a photo's EXIF metadata, if present.
 * Returns null when the file has no location data (common for screenshots,
 * edited images, or photos with location services disabled).
 */
export async function extractGpsFromImage(file: File): Promise<Gps | null> {
  try {
    return toGps(await exifr.gps(file));
  } catch {
    // Malformed or missing EXIF — treat as "no location".
    return null;
  }
}

/**
 * Read GPS from an already-uploaded image by fetching its bytes. Best-effort:
 * cross-origin fetches can be blocked, in which case this returns null.
 */
export async function extractGpsFromUrl(url: string): Promise<Gps | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return toGps(await exifr.gps(buf));
  } catch {
    return null;
  }
}
