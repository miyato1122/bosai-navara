import ThreeView, {
  Color,
  type FeatureEvaluator,
  type Layer,
  type Source,
} from "@navaramap/three";
import type { DefaultDescriptions } from "@navaramap/three-default-plugin";
import { DEPTH_REPRESENTATIVE, WATER_COLORS } from "./flood-depth.ts";
import {
  scanFloodGrid,
  type FloodCell,
  type FloodScanProgress,
} from "./flood-grid.ts";

const WATER_SINK = 2;
const WATER_OPACITY = 0.5;
const SAMPLE_BATCH = 2000;

type View = ThreeView<DefaultDescriptions>;

interface WaterColumnFeature {
  type: "Feature";
  properties: {
    classIdx: number;
    height: number;
    extrudedHeight: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

interface WaterColumnCollection {
  type: "FeatureCollection";
  features: WaterColumnFeature[];
}

let geojson: WaterColumnCollection | null = null;
let layer: Layer | null = null;
let loading = false;

function cellToFeature(cell: FloodCell, terrainHeight: number): WaterColumnFeature {
  const depth = DEPTH_REPRESENTATIVE[cell.classIdx] ?? 0.3;
  return {
    type: "Feature",
    properties: {
      classIdx: cell.classIdx,
      height: terrainHeight - WATER_SINK,
      extrudedHeight: terrainHeight + depth,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [cell.west, cell.south],
          [cell.east, cell.south],
          [cell.east, cell.north],
          [cell.west, cell.north],
          [cell.west, cell.south],
        ],
      ],
    },
  };
}

async function buildGeojson(
  view: View,
  terrain: Source,
  onProgress?: FloodScanProgress,
): Promise<WaterColumnCollection | null> {
  if (geojson) return geojson;

  const cells = await scanFloodGrid(onProgress);
  if (cells.length === 0) return null;

  const features: WaterColumnFeature[] = [];
  for (let i = 0; i < cells.length; i += SAMPLE_BATCH) {
    const batch = cells.slice(i, i + SAMPLE_BATCH);
    const samples = await view.sampleTerrainMostDetailed(
      terrain,
      batch.map((cell) => ({
        lat: (cell.north + cell.south) / 2,
        lng: (cell.west + cell.east) / 2,
      })),
    );
    for (let j = 0; j < batch.length; j++) {
      const height = samples[j]?.height;
      if (height == null) continue;
      features.push(cellToFeature(batch[j]!, height));
    }
  }

  if (features.length === 0) return null;
  geojson = { type: "FeatureCollection", features };
  return geojson;
}

function applyWaterStyle(evaluator: FeatureEvaluator): void {
  evaluator.evaluate(
    ({ properties }) => {
      const classIdx = Number(properties?.["classIdx"]);
      const height = Number(properties?.["height"]);
      const extrudedHeight = Number(properties?.["extrudedHeight"]);
      const css = WATER_COLORS[classIdx] ?? WATER_COLORS[0];
      return {
        height,
        extrudedHeight,
        color: new Color().setStyle(css),
      };
    },
    { filters: ["classIdx", "height", "extrudedHeight"] },
  );
}

function addWaterLayer(view: View, data: WaterColumnCollection): void {
  const waterSource = view.addSource({ type: "geojson", data });
  layer = view.addLayer({
    type: "vector",
    source: waterSource,
    polygon: {
      color: new Color().setStyle(WATER_COLORS[2]),
      opacity: WATER_OPACITY,
      transparent: true,
      clampToGround: false,
      outline: false,
      show: true,
    },
  });
  layer.on("featureCreated", ({ evaluator }) => applyWaterStyle(evaluator));
  layer.on("featureUpdated", ({ evaluator }) => applyWaterStyle(evaluator));
}

/**
 * Show or hide extruded flood-depth columns.
 * First show scans hazard tiles and samples terrain (cached afterwards).
 * Returns false when there is nothing to draw.
 */
export async function setFloodWater3dVisible(
  view: View,
  terrain: Source,
  on: boolean,
  onProgress?: FloodScanProgress,
): Promise<boolean> {
  if (!on) {
    layer?.update({ polygon: { show: false } });
    return true;
  }
  if (layer) {
    layer.update({ polygon: { show: true } });
    return true;
  }
  if (loading) return false;
  loading = true;
  try {
    const data = await buildGeojson(view, terrain, onProgress);
    if (!data) return false;
    addWaterLayer(view, data);
    return true;
  } finally {
    loading = false;
  }
}
