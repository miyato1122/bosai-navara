import type ThreeView from "@navaramap/three";
import type { DefaultDescriptions } from "@navaramap/three-default-plugin";

const CLEAR_EXPOSURE = 3;
const STORM_EXPOSURE = 1.6;

export type Storm = {
  rain: ReturnType<ThreeView<DefaultDescriptions>["addMesh"]>;
  rainDrop: ReturnType<ThreeView<DefaultDescriptions>["addEffect"]>;
  clouds: ReturnType<ThreeView<DefaultDescriptions>["addEffect"]>;
};

/** Adds a visual storm (rain particles, lens drops, clouds). Not meteorological data. */
export function addStorm(view: ThreeView<DefaultDescriptions>): Storm {
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
      coverage: 0.45,
      absorptionCoefficient: 5,
      haze: true,
      qualityPreset: "medium",
    },
  });

  view.toneMappingExposure = STORM_EXPOSURE;

  return { rain, rainDrop, clouds };
}

export function setStormVisible(
  view: ThreeView<DefaultDescriptions>,
  storm: Storm,
  on: boolean,
): void {
  storm.rain.visible = on;
  storm.rainDrop.visible = on;
  storm.clouds.visible = on;
  view.toneMappingExposure = on ? STORM_EXPOSURE : CLEAR_EXPOSURE;
}
