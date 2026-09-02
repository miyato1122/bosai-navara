import type ThreeView from "@navaramap/three";
import type { DefaultDescriptions } from "@navaramap/three-default-plugin";

const CLEAR_EXPOSURE = 3;
const STORM_EXPOSURE = 2.4;
const STORM_CLOUD_COVERAGE = 0.28;

/** Adds a visual storm (rain particles, lens drops, clouds). Not meteorological data. */
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
  const clouds = view.addEffect({
    clouds: {
      coverage: STORM_CLOUD_COVERAGE,
      absorptionCoefficient: 2,
      haze: true,
      qualityPreset: "medium",
    },
  });

  view.toneMappingExposure = STORM_EXPOSURE;

  return { rain, rainDrop, clouds };
}

export type Storm = ReturnType<typeof addStorm>;

export function setStormVisible(
  view: ThreeView<DefaultDescriptions>,
  storm: Storm,
  on: boolean,
): void {
  storm.rain.visible = on;
  storm.rainDrop.visible = on;
  storm.clouds.visible = on;
  // Official examples hide volumetric clouds with coverage: 0.
  storm.clouds.update({
    clouds: { coverage: on ? STORM_CLOUD_COVERAGE : 0 },
  } as Parameters<Storm["clouds"]["update"]>[0]);
  view.toneMappingExposure = on ? STORM_EXPOSURE : CLEAR_EXPOSURE;
}
