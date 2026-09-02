import type ThreeView from "@navaramap/three";
import type { DefaultDescriptions } from "@navaramap/three-default-plugin";

const CLEAR_EXPOSURE = 3;
const STORM_EXPOSURE = 2.4;

/** Adds visual rain. Not meteorological data. */
export function addStorm(view: ThreeView<DefaultDescriptions>) {
  view.animation = true;

  const rain = view.addMesh({
    rain: {
      particleCount: 8000,
      speed: 0.0025,
      opacity: 0.45,
      height: 60,
    },
  });
  const rainDrop = view.addEffect({
    rainDrop: {
      dropDensity: 0.7,
      opacity: 0.4,
      refractionStrength: 0.18,
    },
  });

  view.toneMappingExposure = STORM_EXPOSURE;

  return { rain, rainDrop };
}

export type Storm = ReturnType<typeof addStorm>;

export function setStormVisible(
  view: ThreeView<DefaultDescriptions>,
  storm: Storm,
  on: boolean,
): void {
  storm.rain.visible = on;
  storm.rainDrop.visible = on;
  view.toneMappingExposure = on ? STORM_EXPOSURE : CLEAR_EXPOSURE;
}
