import { describe, expect, it } from "vitest";
import { floodClassIndex, FLOOD_DEPTH_CLASSES } from "../src/flood-depth.ts";

describe("floodClassIndex", () => {
  it("matches official legend colors", () => {
    for (const [i, cls] of FLOOD_DEPTH_CLASSES.entries()) {
      expect(
        floodClassIndex({
          r: cls.rgb[0],
          g: cls.rgb[1],
          b: cls.rgb[2],
          a: 255,
        }),
      ).toBe(i);
    }
  });

  it("accepts colors within the matching tolerance", () => {
    expect(
      floodClassIndex({ r: 247, g: 245, b: 169 + 20, a: 255 }),
    ).toBe(0);
  });

  it("returns -1 for transparent pixels", () => {
    expect(floodClassIndex({ r: 247, g: 245, b: 169, a: 0 })).toBe(-1);
    expect(floodClassIndex(null)).toBe(-1);
    expect(floodClassIndex(undefined)).toBe(-1);
  });

  it("returns -1 for colors far from the legend", () => {
    expect(floodClassIndex({ r: 0, g: 0, b: 0, a: 255 })).toBe(-1);
    expect(floodClassIndex({ r: 16, g: 140, b: 70, a: 255 })).toBe(-1);
  });
});
