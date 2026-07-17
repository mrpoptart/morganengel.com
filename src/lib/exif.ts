import exifr from "exifr";

export interface Gps {
  lat: number;
  lng: number;
}

function num(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

/**
 * Convert a GPS coordinate to signed decimal degrees. exifr may expose it
 * already-computed (a number) or as a raw [deg, min, sec] array, with the
 * hemisphere in a separate *Ref tag ("N"/"S"/"E"/"W").
 */
function toDecimal(value: unknown, ref: unknown): number | null {
  let dec: number | null = null;
  if (typeof value === "number") {
    dec = value;
  } else if (Array.isArray(value)) {
    const d = Number(value[0]) || 0;
    const m = Number(value[1]) || 0;
    const s = Number(value[2]) || 0;
    dec = d + m / 60 + s / 3600;
  }
  if (dec === null || Number.isNaN(dec)) return null;
  const r = typeof ref === "string" ? ref.trim().toUpperCase() : "";
  if (r === "S" || r === "W") dec = -Math.abs(dec);
  return dec;
}

/**
 * Pull coordinates out of a parsed EXIF object. Prefers exifr's merged
 * `latitude`/`longitude` decimals, then falls back to computing them from the
 * raw GPSLatitude/GPSLongitude (+ Ref) tags — which survive even when the
 * convenience fields don't (e.g. large Samsung/Google HDR+ JPEGs).
 */
function pickGps(meta: Record<string, unknown> | undefined): Gps | null {
  if (!meta) return null;
  const lat =
    num(meta.latitude) ?? toDecimal(meta.GPSLatitude, meta.GPSLatitudeRef);
  const lng =
    num(meta.longitude) ?? toDecimal(meta.GPSLongitude, meta.GPSLongitudeRef);
  if (lat === null || lng === null) return null;
  if (lat === 0 && lng === 0) return null; // null island — treat as no fix
  return { lat, lng };
}

async function parseFull(
  bytes: File | ArrayBuffer
): Promise<Record<string, unknown> | undefined> {
  // A full parse reads the whole file, so GPS is found even when it sits past
  // the first chunk (behind big ICC profiles / XMP / maker notes). The
  // `exifr.gps()` shortcut only reads the head and misses those.
  return (await exifr.parse(bytes, true).catch(() => undefined)) as
    | Record<string, unknown>
    | undefined;
}

export interface PhotoLocationInfo {
  gps: Gps | null;
  /** True if the image carried any EXIF metadata (camera make, timestamp…). */
  hasMetadata: boolean;
  /** True if the bytes couldn't be read at all (e.g. blocked cross-origin fetch). */
  unreadable: boolean;
  /** Names of the EXIF tags found — for diagnosing missing GPS. */
  metaKeys: string[];
}

/**
 * Inspect a photo for GPS and distinguish the "why" when it's missing:
 * - gps present            → use it
 * - hasMetadata, no gps    → EXIF exists but carries no location
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
      if (!res.ok)
        return { gps: null, hasMetadata: false, unreadable: true, metaKeys: [] };
      bytes = await res.arrayBuffer();
    } catch {
      return { gps: null, hasMetadata: false, unreadable: true, metaKeys: [] };
    }
  } else {
    bytes = input;
  }

  const meta = await parseFull(bytes);
  const metaKeys = meta ? Object.keys(meta) : [];

  return {
    gps: pickGps(meta),
    hasMetadata: metaKeys.length > 0,
    unreadable: false,
    metaKeys,
  };
}
