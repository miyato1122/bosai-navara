import type ThreeView from "@navaramap/three";
import type { DefaultDescriptions } from "@navaramap/three-default-plugin";

const CLEAR_EXPOSURE = 3;
const STORM_EXPOSURE = 2.15;

/** Adds visual rain. Not meteorological data. */
export function addStorm(view: ThreeView<DefaultDescriptions>) {
  view.animation = true;

  const rain = view.addMesh({
    rain: {
      particleCount: 14000,
      speed: 0.0032,
      opacity: 0.62,
      height: 75,
    },
  });
  const rainDrop = view.addEffect({
    rainDrop: {
      dropDensity: 1.1,
      opacity: 0.55,
      refractionStrength: 0.22,
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
