import { Color, type FeatureEvaluator, type Layer } from "@navaramap/three";

const SELECTED_COLOR = new Color().setHex(0xff2a2a);
const DEFAULT_COLOR = new Color().setHex(0xffffff);

/**
 * Tracks the clicked 3D Tiles building and restyles it red via FeatureEvaluator.
 * Call {@link select} / {@link clear} after updating state; both trigger
 * `layer.forceUpdate()` so resident tiles re-evaluate immediately.
 */
export class BuildingSelection {
  private readonly layer: Layer;
  private selectedGmlId: string | null = null;

  constructor(layer: Layer) {
    this.layer = layer;

    const apply = ({ evaluator }: { evaluator: FeatureEvaluator }) => {
      const selected = this.selectedGmlId;
      evaluator.evaluate(
        ({ properties }) => ({
          color:
            selected !== null && properties?.["gml_id"] === selected
              ? SELECTED_COLOR.clone()
              : DEFAULT_COLOR.clone(),
        }),
        { filters: ["gml_id"] },
      );
    };

    this.layer.on("featureCreated", apply);
    this.layer.on("featureUpdated", apply);
  }

  select(gmlId: string): void {
    this.selectedGmlId = gmlId;
    this.layer.forceUpdate();
  }

  clear(): void {
    if (this.selectedGmlId === null) return;
    this.selectedGmlId = null;
    this.layer.forceUpdate();
  }
}
