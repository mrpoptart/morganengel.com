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

export interface PhotoLocationInfo {
  gps: Gps | null;
  /** True if the image carried any EXIF metadata (camera make, timestamp…). */
  hasMetadata: boolean;
  /** True if the bytes couldn't be read at all (e.g. blocked cross-origin fetch). */
  unreadable: boolean;
}

/**
 * Inspect a photo for GPS and distinguish the "why" when it's missing:
 * - gps present            → use it
 * - hasMetadata, no gps    → the source app stripped location (e.g. Google Photos)
 * - no metadata at all     → a fully re-encoded / stripped copy
 * - unreadable             → bytes couldn't be fetched (URL fallback blocked)
 */
export async function inspectPhotoLocation(
  input: File | string
): Promise<PhotoLocationInfo> {
  let bytes: File | ArrayBuffer;
  if (typeof input === "string") {
    try {
      const res = await fetch(input);
      if (!res.ok) return { gps: null, hasMetadata: false, unreadable: true };
      bytes = await res.arrayBuffer();
    } catch {
      return { gps: null, hasMetadata: false, unreadable: true };
    }
  } else {
    bytes = input;
  }

  const [gpsRaw, meta] = await Promise.all([
    exifr.gps(bytes).catch(() => undefined),
    exifr.parse(bytes).catch(() => undefined),
  ]);

  return {
    gps: toGps(gpsRaw),
    hasMetadata: !!meta && Object.keys(meta).length > 0,
    unreadable: false,
  };
}
