import ThreeView, { Color } from "@navaramap/three";
import {
  DefaultPlugin,
  type DefaultDescriptions,
} from "@navaramap/three-default-plugin";

/** Idle quality: keep LOD2 detail. Larger maxSse = coarser tiles. */
const IDLE_BUILDING_MAX_SSE = 16;
const MOVING_BUILDING_MAX_SSE = 48;

const view = new ThreeView<DefaultDescriptions>({ shadow: true });

const defaultPlugin = new DefaultPlugin();
view.addPlugin(defaultPlugin);

await view.init();

const scene = defaultPlugin.addDefaultPhotorealScene();
view.atmosphere.date = new Date("2026-07-16T05:00:00Z");
view.toneMappingExposure = 3;
scene.sun.update({ sun: { castShadow: true, shadowFar: 4000 } });

const terrain = view.addSource({
  type: "quantized-mesh",
  url: "https://terrain.reearth.land/cesium-mesh/ellipsoid/{z}/{x}/{y}.terrain",
  maxZoom: 18,
  requestVertexNormals: true,
  requestWaterMask: true,
});
view.addLayer({
  type: "terrain",
  source: terrain,
  terrain: { castShadow: true, receiveShadow: true },
});

const imagery = view.addSource({
  type: "raster-tile",
  url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
  maxZoom: 18,
});
view.addLayer({ type: "raster", source: imagery });

const buildings = view.addSource({
  type: "3d-tiles",
  url: "https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/29343-bldg-lod2-latest/tileset.json",
});
const buildingsLayer = view.addLayer({
  type: "3d-tiles",
  source: buildings,
  model: {
    color: new Color().setHex(0xffffff),
    metalness: 0,
    roughness: 1,
    maxSse: IDLE_BUILDING_MAX_SSE,
  },
});

view.camera.on("movestart", () => {
  buildingsLayer.update({ model: { maxSse: MOVING_BUILDING_MAX_SSE } });
});

view.camera.on("moveend", () => {
  buildingsLayer.update({ model: { maxSse: IDLE_BUILDING_MAX_SSE } });
});

view.setCamera({
  lng: 135.681,
  lat: 34.601,
  distance: 2000,
  heading: 20,
  pitch: -35,
  roll: 0,
});

view.attribution?.add([
  {
    attribution:
      "3D City Model (Project PLATEAU) Sangō Town (FY2025) - MLIT PLATEAU",
    attributionUrl:
      "https://www.geospatial.jp/ckan/dataset/plateau-29343-sango-cho-2025",
  },
  {
    attribution: "© Re:Earth Terrain",
    attributionUrl: "https://terrain.reearth.land/",
  },
  {
    attribution: "国土地理院タイル（全国最新写真）",
    attributionUrl: "https://maps.gsi.go.jp/development/ichiran.html",
  },
]);
