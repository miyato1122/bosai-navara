import type ThreeView from "@navaramap/three";
import type { DefaultDescriptions } from "@navaramap/three-default-plugin";

const CLEAR_EXPOSURE = 3;
const STORM_EXPOSURE = 1.6;
const STORM_CLOUD_COVERAGE = 0.45;

/** Adds a visual storm (rain particles, lens drops, clouds). Not meteorological data. */
export function addStorm(view: ThreeView<DefaultDescriptions>) {
  view.animation = true;

  const rain = view.addMesh({
    rain: {
      particleCount: 20000,
      speed: 0.004,
      opacity: 0.8,
      height: 90,
    },
  });
  const rainDrop = view.addEffect({
    rainDrop: {
      dropDensity: 2.5,
      opacity: 0.85,
    },
  });
  const clouds = view.addEffect({
    clouds: {
      coverage: STORM_CLOUD_COVERAGE,
      absorptionCoefficient: 5,
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
