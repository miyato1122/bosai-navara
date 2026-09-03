import {
  floodClassIndex,
  tileCoords,
  tileToLonLat,
  type Pixel,
} from "./flood-depth.ts";

export const CITY_BBOX = {
  west: 135.65,
  south: 34.565,
  east: 135.73,
  north: 34.625,
};

export const FLOOD_TILE_URL =
  "https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png";

const FLOOD_Z = 15;
const BLOCK = 16;
const TILE_SIZE = 256;

export interface FloodCell {
  west: number;
  east: number;
  north: number;
  south: number;
  classIdx: number;
}

export type FloodScanProgress = (done: number, total: number) => void;

type Bbox = typeof CITY_BBOX;

function tileRange(bbox: Bbox, z: number) {
  const a = tileCoords(bbox.west, bbox.north, z);
  const b = tileCoords(bbox.east, bbox.south, z);
  return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
}

function loadTileData(url: string): Promise<Uint8ClampedArray | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = TILE_SIZE;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function tileUrl(z: number, x: number, y: number): string {
  return FLOOD_TILE_URL.replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

let scanPromise: Promise<FloodCell[]> | null = null;

/** Scan town-wide flood tiles into ~63 m cells. Successful non-empty results are cached. */
export function scanFloodGrid(onProgress?: FloodScanProgress): Promise<FloodCell[]> {
  if (scanPromise) return scanPromise;

  scanPromise = (async () => {
    const bbox = CITY_BBOX;
    const { x0, y0, x1, y1 } = tileRange(bbox, FLOOD_Z);
    const total = (x1 - x0 + 1) * (y1 - y0 + 1);
    let done = 0;
    const cells: FloodCell[] = [];
    const cellDeg = 360 / 2 ** FLOOD_Z / (TILE_SIZE / BLOCK);

    const jobs: Array<Promise<void>> = [];
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        jobs.push(
          loadTileData(tileUrl(FLOOD_Z, tx, ty)).then((data) => {
            done += 1;
            onProgress?.(done, total);
            if (!data) return;
            const nw = tileToLonLat(tx, ty, FLOOD_Z);
            const se = tileToLonLat(tx + 1, ty + 1, FLOOD_Z);
            const blocks = TILE_SIZE / BLOCK;
            for (let by = 0; by < blocks; by++) {
              for (let bx = 0; bx < blocks; bx++) {
                let maxIdx = -1;
                for (let py = by * BLOCK; py < (by + 1) * BLOCK; py++) {
                  for (let px = bx * BLOCK; px < (bx + 1) * BLOCK; px++) {
                    const i = (py * TILE_SIZE + px) * 4;
                    if (data[i + 3] === 0) continue;
                    const pixel: Pixel = {
                      r: data[i]!,
                      g: data[i + 1]!,
                      b: data[i + 2]!,
                      a: 255,
                    };
                    const idx = floodClassIndex(pixel);
                    if (idx > maxIdx) maxIdx = idx;
                  }
                }
                if (maxIdx >= 0) {
                  const west = nw.lon + bx * cellDeg;
                  const north =
                    nw.lat - (by * (nw.lat - se.lat) * BLOCK) / TILE_SIZE;
                  const south =
                    nw.lat - ((by + 1) * (nw.lat - se.lat) * BLOCK) / TILE_SIZE;
                  cells.push({
                    west,
                    east: west + cellDeg,
                    north,
                    south,
                    classIdx: maxIdx,
                  });
                }
              }
            }
          }),
        );
      }
    }

    await Promise.all(jobs);
    return cells;
  })();

  void scanPromise
    .then((cells) => {
      if (cells.length === 0) scanPromise = null;
      return cells;
    })
    .catch(() => {
      scanPromise = null;
    });

  return scanPromise;
}
