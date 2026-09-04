# bousai-navara

[Navara](https://navara.world/docs/)（`@navaramap/three`）の検証用アプリケーションです。奈良県生駒郡三郷町を対象に、PLATEAU の建物 3D タイルと国土地理院の洪水浸水想定を重ねて表示します。

初期視点は三郷町役場付近です。建物をクリックすると属性を確認でき、浸水想定は 2D オーバーレイと 3D 水柱のどちらでも表示できます。

## セットアップ

### 必要なもの

- [Node.js](https://nodejs.org/) 20.19 以降、または 22.12 以降（Vite 8 の要件）
- [pnpm](https://pnpm.io/)

pnpm が未導入の場合:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### 手順

```bash
git clone https://github.com/miyato1122/bosai-navara.git
cd bosai-navara
pnpm install
pnpm dev
```

開発サーバー起動後、ブラウザで http://localhost:5173 を開きます。

建物・地形・浸水タイルはいずれも公開 API から取得するため、インターネット接続が必要です。

### その他のコマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバーを起動する |
| `pnpm build` | 型チェック後に本番ビルドする |
| `pnpm preview` | ビルド結果をローカルで確認する |
| `pnpm test` | 単体テストを実行する |

## 構成

Vite + TypeScript のシングルページアプリです。エントリは `index.html` → `src/main.ts` です。

```
src/
  main.ts                 ThreeView の初期化、データソース／レイヤ登録
  building-selection.ts   クリックした建物のハイライト
  plateau-attributes.ts   PLATEAU 属性の表示用整形
  flood-depth.ts          浸水深クラス（凡例色）の判定
  flood-grid.ts           浸水タイルのスキャン
  flood-water-3d.ts       浸水深の 3D 水柱表示
  storm.ts                浸水レイヤ連動の雨演出
  data/                   三郷町の行政界 GeoJSON
  ui/                     HUD（レイヤカード・属性カード）
tests/                    浸水深判定などの単体テスト
public/                   静的アセット
```

`src/main.ts` で次のレイヤを重ねています。

- 地形: Re:Earth quantized-mesh
- 航空写真: 国土地理院 全国最新写真
- 洪水浸水想定: 重ねるハザードマップ（L2 浸水深）
- 建物: PLATEAU 三郷町 LOD2 3D Tiles
- 行政界: `src/data/29343_sango-cho_city_2025_border.json`

## データ出典

- [3D都市モデル（Project PLATEAU）三郷町（令和7年度）](https://www.geospatial.jp/ckan/dataset/plateau-29343-sango-cho-2025)
- [国土地理院タイル（全国最新写真）](https://maps.gsi.go.jp/development/ichiran.html)
- [重ねるハザードマップ（洪水浸水想定）](https://disaportal.gsi.go.jp/)
- [Re:Earth Terrain](https://terrain.reearth.land/)

## ライセンス

MIT
