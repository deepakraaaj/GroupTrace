// Geospatial math utilities — all pure functions, no side effects

const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance in metres between two lat/lng points */
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** Arithmetic centre of an array of lat/lng points */
export function centerPoint(
  points: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/**
 * Initial bearing (degrees, 0 = North, clockwise) from point A to point B.
 * Useful for convoy missed-turn detection.
 */
export function bearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Signed angular difference between two bearings.
 * Returns value in [-180, 180]. Positive = clockwise deviation.
 */
export function bearingDelta(b1: number, b2: number): number {
  let d = ((b2 - b1) % 360 + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

/** ETA in minutes given distance in metres and speed in m/s */
export function etaMinutes(distanceMeters: number, speedMs: number): number | null {
  if (speedMs <= 0) return null;
  return distanceMeters / speedMs / 60;
}

/** Convert m/s to km/h */
export function msToKmh(ms: number): number {
  return ms * 3.6;
}

/** Convert km/h to m/s */
export function kmhToMs(kmh: number): number {
  return kmh / 3.6;
}

/** Format metres as human-readable string */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Format seconds as mm:ss or h:mm */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Destination point given origin, bearing (deg), and distance (metres).
 * Used to project "safe zone" circles on the map.
 */
export function destinationPoint(
  lat: number, lng: number,
  bearingDeg: number, distanceMeters: number
): { lat: number; lng: number } {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const d = distanceMeters / EARTH_RADIUS_M;
  const b = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { lat: toDeg(lat2), lng: toDeg(lng2) };
}

/** Seconds elapsed since a ms-epoch timestamp */
export function secondsSince(epochMs: number): number {
  return (Date.now() - epochMs) / 1000;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
