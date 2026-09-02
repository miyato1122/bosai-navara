export type AttributeRow = {
  label: string;
  value: string;
};

export type AttributeGroup = {
  title: string;
  rows: AttributeRow[];
};

export type AttributeSection = {
  title: string;
  rows: AttributeRow[];
  groups: AttributeGroup[];
};

export type FormattedBuildingAttributes = {
  title: string;
  sections: AttributeSection[];
};

const EXCLUDED_KEYS = new Set([
  "attributes",
  "_x",
  "_y",
  "_xmin",
  "_xmax",
  "_ymin",
  "_ymax",
  "_zmin",
  "_zmax",
  "_lod",
  "_lod_type",
  "meshcode",
  "city_code",
]);

const BASIC_KEYS = [
  "gml:name",
  "gml_id",
  "bldg:class",
  "bldg:usage",
  "bldg:measuredHeight",
  "bldg:storeysAboveGround",
  "core:creationDate",
  "city_name",
  "feature_type",
] as const;

const DETAIL_EXTRA_KEYS = [
  "uro:geometrySrcDescLod1",
  "uro:lodType",
  "uro:lod1HeightType",
] as const;

const LABELS: Record<string, string> = {
  "gml:name": "名称",
  gml_id: "GML ID",
  "bldg:class": "建物分類",
  "bldg:usage": "用途",
  "bldg:measuredHeight": "計測高さ",
  "bldg:storeysAboveGround": "地上階数",
  "core:creationDate": "作成日",
  city_name: "市区町村",
  feature_type: "地物種別",
  "uro:BuildingIDAttribute_uro:buildingID": "建物ID",
  "uro:BuildingIDAttribute_uro:prefecture": "都道府県",
  "uro:BuildingIDAttribute_uro:city": "市区町村",
  "uro:BuildingDetailAttribute_uro:siteArea": "敷地面積",
  "uro:BuildingDetailAttribute_uro:totalFloorArea": "延べ面積",
  "uro:BuildingDetailAttribute_uro:buildingFootprintArea": "建築面積",
  "uro:BuildingDetailAttribute_uro:buildingStructureType": "構造種別",
  "uro:BuildingDetailAttribute_uro:urbanPlanType": "都市計画区域",
  "uro:BuildingDetailAttribute_uro:areaClassificationType": "区域区分",
  "uro:BuildingDetailAttribute_uro:districtsAndZonesType": "地域地区",
  "uro:BuildingDetailAttribute_uro:surveyYear": "調査年",
  "uro:geometrySrcDescLod1": "LOD1幾何データ出典",
  "uro:lodType": "LOD種別",
  "uro:lod1HeightType": "LOD1高さ取得方法",
};

const FLOOD_KEY =
  /^(.+)_(L[12]（[^）]+）)_(.+)$/;
const SEDIMENT_KEY = /^土砂災害リスク_(.+)_(.+)$/;

const BUILDING_ID_PREFIX = "uro:BuildingIDAttribute_";
const BUILDING_DETAIL_PREFIX = "uro:BuildingDetailAttribute_";

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (value === "") return true;
  if (value === 9999) return true;
  if (value === "0001") return true;
  return false;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString("ja-JP", { maximumFractionDigits: 3 });
}

function formatValue(key: string, value: unknown): string {
  if (typeof value === "number") {
    if (key.includes("measuredHeight") || key.endsWith("浸水深")) {
      return `${formatNumber(value)} m`;
    }
    if (
      key.includes("siteArea") ||
      key.includes("FloorArea") ||
      key.includes("FootprintArea")
    ) {
      return `${formatNumber(value)} m²`;
    }
    if (key.endsWith("浸水継続時間")) {
      return `${formatNumber(value)} h`;
    }
    return formatNumber(value);
  }
  return String(value);
}

function labelFor(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const uro = key.match(/_uro:(.+)$/);
  if (uro) return uro[1];
  const colon = key.lastIndexOf(":");
  if (colon >= 0 && colon < key.length - 1) return key.slice(colon + 1);
  return key;
}

function hasCodeSibling(
  key: string,
  properties: Record<string, unknown>,
): boolean {
  if (!key.endsWith("コード")) return false;
  return !isEmpty(properties[key.slice(0, -"コード".length)]);
}

function row(key: string, value: unknown): AttributeRow {
  return { label: labelFor(key), value: formatValue(key, value) };
}

function take(
  keys: readonly string[],
  remaining: Map<string, unknown>,
): AttributeRow[] {
  const rows: AttributeRow[] = [];
  for (const key of keys) {
    const value = remaining.get(key);
    if (value === undefined) continue;
    remaining.delete(key);
    rows.push(row(key, value));
  }
  return rows;
}

function takePrefix(
  prefix: string,
  remaining: Map<string, unknown>,
): AttributeRow[] {
  const rows: AttributeRow[] = [];
  for (const [key, value] of [...remaining]) {
    if (!key.startsWith(prefix)) continue;
    remaining.delete(key);
    rows.push(row(key, value));
  }
  return rows;
}

function collectDisasterGroups(
  remaining: Map<string, unknown>,
): AttributeGroup[] {
  const grouped = new Map<string, AttributeRow[]>();

  for (const [key, value] of [...remaining]) {
    const flood = key.match(FLOOD_KEY);
    if (flood) {
      remaining.delete(key);
      const title = `${flood[1]} / ${flood[2]}`;
      const rows = grouped.get(title) ?? [];
      rows.push({ label: flood[3], value: formatValue(key, value) });
      grouped.set(title, rows);
      continue;
    }
    const sediment = key.match(SEDIMENT_KEY);
    if (sediment) {
      remaining.delete(key);
      const title = `土砂災害リスク / ${sediment[1]}`;
      const rows = grouped.get(title) ?? [];
      rows.push({
        label: sediment[2],
        value: formatValue(key, value),
      });
      grouped.set(title, rows);
    }
  }

  return [...grouped].map(([title, rows]) => ({ title, rows }));
}

function buildingTitle(properties: Record<string, unknown>): string {
  const name = properties["gml:name"];
  if (typeof name === "string" && name.trim()) return name.trim();
  const buildingId = properties["uro:BuildingIDAttribute_uro:buildingID"];
  if (typeof buildingId === "string" && buildingId.trim()) {
    return buildingId.trim();
  }
  const gmlId = properties["gml_id"];
  if (typeof gmlId === "string" && gmlId.trim()) return gmlId.trim();
  return "建物";
}

/**
 * Thins PLATEAU 3D Tiles batch-table properties into labeled sections
 * suitable for the attribute card.
 */
export function formatPlateauAttributes(
  properties: Record<string, unknown>,
): FormattedBuildingAttributes {
  const remaining = new Map<string, unknown>();

  for (const [key, value] of Object.entries(properties)) {
    if (EXCLUDED_KEYS.has(key)) continue;
    if (isEmpty(value)) continue;
    if (hasCodeSibling(key, properties)) continue;
    remaining.set(key, value);
  }

  const sections: AttributeSection[] = [];

  const basic = take(BASIC_KEYS, remaining);
  if (basic.length > 0) {
    sections.push({ title: "基本情報", rows: basic, groups: [] });
  }

  const ids = takePrefix(BUILDING_ID_PREFIX, remaining);
  if (ids.length > 0) {
    sections.push({ title: "建物ID", rows: ids, groups: [] });
  }

  const detail = [
    ...takePrefix(BUILDING_DETAIL_PREFIX, remaining),
    ...take(DETAIL_EXTRA_KEYS, remaining),
  ];
  if (detail.length > 0) {
    sections.push({ title: "詳細属性", rows: detail, groups: [] });
  }

  const disaster = collectDisasterGroups(remaining);
  if (disaster.length > 0) {
    sections.push({ title: "災害リスク", rows: [], groups: disaster });
  }

  if (remaining.size > 0) {
    const other: AttributeRow[] = [];
    for (const [key, value] of remaining) {
      other.push(row(key, value));
    }
    sections.push({ title: "その他", rows: other, groups: [] });
  }

  return { title: buildingTitle(properties), sections };
}
