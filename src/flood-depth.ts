/** Official 重ねるハザードマップ flood-depth legend (RGB + labels). */
export const FLOOD_DEPTH_CLASSES = [
  { rgb: [247, 245, 169], css: "rgb(247, 245, 169)", label: "0.5m未満" },
  { rgb: [255, 216, 192], css: "rgb(255, 216, 192)", label: "0.5〜3.0m" },
  { rgb: [255, 183, 183], css: "rgb(255, 183, 183)", label: "3.0〜5.0m" },
  { rgb: [255, 145, 145], css: "rgb(255, 145, 145)", label: "5.0〜10.0m" },
  { rgb: [242, 133, 201], css: "rgb(242, 133, 201)", label: "10.0〜20.0m" },
  { rgb: [220, 122, 220], css: "rgb(220, 122, 220)", label: "20.0m以上" },
] as const;

/** Mid-class flood depths (m) used as 3D column heights. */
export const DEPTH_REPRESENTATIVE = [0.3, 1.5, 4, 7.5, 15, 22] as const;

/** Water-column colors, one per flood-depth class (not the official legend). */
export const WATER_COLORS = [
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9",
  "#0284c7",
  "#1d4ed8",
  "#312e81",
] as const;

export interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Web Mercator tile + pixel for a lon/lat. */
export function tileCoords(
  lon: number,
  lat: number,
  z: number,
  tileSize = 256,
): { x: number; y: number; px: number; py: number } {
  const n = 2 ** z;
  const xf = ((lon + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const yf = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return {
    x: Math.floor(xf),
    y: Math.floor(yf),
    px: Math.min(tileSize - 1, Math.floor((xf - Math.floor(xf)) * tileSize)),
    py: Math.min(tileSize - 1, Math.floor((yf - Math.floor(yf)) * tileSize)),
  };
}

/** Northwest corner of a Web Mercator tile. */
export function tileToLonLat(
  x: number,
  y: number,
  z: number,
): { lon: number; lat: number } {
  const n = 2 ** z;
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  return { lon, lat: (latRad * 180) / Math.PI };
}

/**
 * Pixel color → flood-depth class index.
 * Returns -1 when the pixel is empty or not close enough to a legend color.
 */
export function floodClassIndex(
  pixel: Pixel | null | undefined,
  tolerance = 60,
): number {
  if (!pixel || pixel.a === 0) return -1;
  let bestIdx = -1;
  let bestD = Number.POSITIVE_INFINITY;
  for (let i = 0; i < FLOOD_DEPTH_CLASSES.length; i++) {
    const cls = FLOOD_DEPTH_CLASSES[i];
    const d =
      Math.abs(cls.rgb[0] - pixel.r) +
      Math.abs(cls.rgb[1] - pixel.g) +
      Math.abs(cls.rgb[2] - pixel.b);
    if (d < bestD) {
      bestD = d;
      bestIdx = i;
    }
  }
  return bestD <= tolerance ? bestIdx : -1;
}
