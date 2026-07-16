import exifr from "exifr";

/**
 * Read GPS coordinates embedded in a photo's EXIF metadata, if present.
 * Returns null when the file has no location data (common for screenshots,
 * edited images, or photos with location services disabled).
 */
export async function extractGpsFromImage(
  file: File
): Promise<{ lat: number; lng: number } | null> {
  try {
    const gps = await exifr.gps(file);
    if (
      gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number" &&
      !Number.isNaN(gps.latitude) &&
      !Number.isNaN(gps.longitude)
    ) {
      return { lat: gps.latitude, lng: gps.longitude };
    }
  } catch {
    // Malformed or missing EXIF — treat as "no location".
  }
  return null;
}
