import ThreeView, { Color, type Layer } from "@navaramap/three";
import {
  DefaultPlugin,
  type DefaultDescriptions,
} from "@navaramap/three-default-plugin";
import { BuildingSelection } from "./building-selection.ts";
import { AttributeCard } from "./ui/attribute-card.ts";
import { LayerCard } from "./ui/layer-card.ts";
import borderData from "./data/29343_sango-cho_city_2025_border.json" with { type: "json" };

const FLOOD_OPACITY = 0.7;

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

const flood = view.addSource({
  type: "raster-tile",
  url: "https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png",
  maxZoom: 17,
});
const addFloodLayer = (): Layer =>
  view.addLayer({
    type: "raster",
    source: flood,
    raster: { opacity: FLOOD_OPACITY },
  });
let floodLayer: Layer | null = addFloodLayer();

const buildings = view.addSource({
  type: "3d-tiles",
  url: "https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/29343-bldg-lod2-latest/tileset.json",
});
const buildingsLayer = view.addLayer({
  type: "3d-tiles",
  source: buildings,
  model: { color: new Color().setHex(0xffffff), metalness: 0, roughness: 1 },
});

const border = view.addSource({
  type: "geojson",
  data: borderData,
});
const addBorderLayer = (): Layer =>
  view.addLayer({
    type: "vector",
    source: border,
    polyline: {
      color: new Color().setHex(0xff0000),
      width: 3,
      clampToGround: true,
      geometryTypes: ["line", "polygon"],
    },
  });
let borderLayer = addBorderLayer();

const layerCard = new LayerCard(document.body);
layerCard.onToggle((on) => {
  if (on) {
    if (floodLayer) return;
    // Render order = add order. Recreate the border after flood so the
    // town outline stays on top of the inundation overlay.
    borderLayer.delete();
    floodLayer = addFloodLayer();
    borderLayer = addBorderLayer();
    return;
  }
  floodLayer?.delete();
  floodLayer = null;
});

const card = new AttributeCard(document.body);
const selection = new BuildingSelection(buildingsLayer);

view.on("featureClick", (info) => {
  if (!info || info.layerId !== buildingsLayer.id) {
    selection.clear();
    card.hide();
    return;
  }
  const properties = info.properties ?? {};
  const gmlId =
    typeof properties["gml_id"] === "string" ? properties["gml_id"] : "";
  if (gmlId) selection.select(gmlId);
  else selection.clear();
  card.show(gmlId, properties);
});

card.onClose(() => {
  selection.clear();
  card.hide();
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
  {
    attribution: "重ねるハザードマップ（洪水浸水想定） / 国土地理院",
    attributionUrl: "https://disaportal.gsi.go.jp/",
  },
]);
