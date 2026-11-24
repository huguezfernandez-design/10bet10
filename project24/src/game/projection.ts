// Simple equal-ish projection tuned for the Iberian Peninsula.
// Must stay in sync with scripts/build-geo.mjs.
export const WORLD_W = 1000;
export const WORLD_H = 760;
const LON0 = -10.2;
const LAT0 = 44.3;
const K = 80;
const COS = Math.cos((40 * Math.PI) / 180);
const PAD_X = 56;
const PAD_Y = 40;

export function project(lon: number, lat: number): { x: number; y: number } {
  return { x: PAD_X + (lon - LON0) * K * COS, y: PAD_Y + (LAT0 - lat) * K };
}
