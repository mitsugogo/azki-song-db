import { describe, expect, it } from "vitest";
import {
  parseGsiMunicipalityNames,
  parseSeichiMapKml,
  updateSeichiMapLocationIdentityRegistry,
} from "../seichiMap";

describe("parseGsiMunicipalityNames", () => {
  it("国土地理院の自治体コード表を都道府県・市区町村の表示名へ変換する", () => {
    expect(
      parseGsiMunicipalityNames(
        "GSI.MUNI_ARRAY[\"12106\"] = '12,千葉県,12106,千葉市　美浜区';",
      ).get("12106"),
    ).toBe("千葉県千葉市美浜区");
  });
});

const createKml = ({
  folder,
  name,
  description = "",
  latitude,
  longitude,
}: {
  folder: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
}) => `
  <kml>
    <Document>
      <Folder>
        <name>${folder}</name>
        <Placemark>
          <name>${name}</name>
          <description><![CDATA[${description}]]></description>
          <Point><coordinates>${longitude},${latitude},0</coordinates></Point>
        </Placemark>
      </Folder>
    </Document>
  </kml>
`;

describe("parseSeichiMapKml", () => {
  it("parses folders and placemarks from Google My Maps KML", () => {
    const items = parseSeichiMapKml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <Folder>
            <name>開催中・予定のイベント</name>
            <Placemark>
              <name>イオンモール幕張新都心（hololive BASE）</name>
              <description><![CDATA[2026/9/4～13<br>https://example.com/event]]></description>
              <styleUrl>#icon-1899-C2185B</styleUrl>
              <Point>
                <coordinates>
                  140.0309562,35.654358,0
                </coordinates>
              </Point>
            </Placemark>
          </Folder>
        </Document>
      </kml>
    `);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      folder: "開催中・予定のイベント",
      name: "イオンモール幕張新都心（hololive BASE）",
      description: "2026/9/4～13<br>https://example.com/event",
      styleUrl: "#icon-1899-C2185B",
      latitude: 35.654358,
      longitude: 140.0309562,
    });
    expect(items[0].id).toMatch(/^[0-9a-f]{16}$/);
  });

  it("skips placemarks without valid point coordinates", () => {
    const items = parseSeichiMapKml(`
      <kml>
        <Document>
          <Folder>
            <name>レイヤー</name>
            <Placemark>
              <name>座標なし</name>
            </Placemark>
          </Folder>
        </Document>
      </kml>
    `);

    expect(items).toEqual([]);
  });

  it("keeps the existing ID when a pin moves to another layer", () => {
    const before = createKml({
      folder: "旧レイヤー",
      name: "地点A",
      latitude: 35.1,
      longitude: 139.1,
    });
    const identities = updateSeichiMapLocationIdentityRegistry(before, []);
    const existingId = parseSeichiMapKml(before, identities)[0].id;
    const after = createKml({
      folder: "新レイヤー",
      name: "地点A",
      latitude: 36.2,
      longitude: 140.2,
    });

    expect(parseSeichiMapKml(after, identities)[0]).toMatchObject({
      id: existingId,
      folder: "新レイヤー",
      latitude: 36.2,
      longitude: 140.2,
    });
  });

  it("keeps the existing ID when a location is renamed and moved to another layer", () => {
    const before = createKml({
      folder: "旧レイヤー",
      name: "旧地点名",
      latitude: 35.1,
      longitude: 139.1,
    });
    const identities = updateSeichiMapLocationIdentityRegistry(before, []);
    const existingId = parseSeichiMapKml(before, identities)[0].id;
    const after = createKml({
      folder: "新レイヤー",
      name: "新地点名",
      latitude: 35.1001,
      longitude: 139.1001,
    });

    expect(parseSeichiMapKml(after, identities)[0]).toMatchObject({
      id: existingId,
      folder: "新レイヤー",
      name: "新地点名",
    });
  });

  it("uses an unchanged description to follow simultaneous name, pin, and layer changes", () => {
    const description = "配信で訪れた場所 https://example.com/archive/123";
    const before = createKml({
      folder: "旧レイヤー",
      name: "旧地点名",
      description,
      latitude: 35.1,
      longitude: 139.1,
    });
    const identities = updateSeichiMapLocationIdentityRegistry(before, []);
    const existingId = parseSeichiMapKml(before, identities)[0].id;
    const after = createKml({
      folder: "新レイヤー",
      name: "新地点名",
      description,
      latitude: 43.1,
      longitude: 141.1,
    });

    expect(parseSeichiMapKml(after, identities)[0].id).toBe(existingId);
  });

  it("preserves previous names and positions when the registry is updated", () => {
    const before = createKml({
      folder: "旧レイヤー",
      name: "旧地点名",
      latitude: 35.1,
      longitude: 139.1,
    });
    const firstRegistry = updateSeichiMapLocationIdentityRegistry(before, []);
    const after = createKml({
      folder: "新レイヤー",
      name: "旧地点名",
      latitude: 36.2,
      longitude: 140.2,
    });
    const updatedRegistry = updateSeichiMapLocationIdentityRegistry(
      after,
      firstRegistry,
    );

    expect(updatedRegistry).toHaveLength(1);
    expect(updatedRegistry[0].names).toContain("旧地点名");
    expect(updatedRegistry[0].positions).toEqual(
      expect.arrayContaining([
        [35.1, 139.1],
        [36.2, 140.2],
      ]),
    );
  });

  it("uses the pre-suffix ID for AZKi Navi locations", () => {
    const oldKml = createKml({
      folder: "AZKiナビ 推しドラご当地ボイス",
      name: "ゴリラ公園",
      latitude: 35.5,
      longitude: 139.5,
    });
    const renamedKml = createKml({
      folder: "AZKiナビ 推しドラご当地ボイス",
      name: "ゴリラ公園（AZKiナビ）",
      latitude: 35.5,
      longitude: 139.5,
    });
    const oldId = parseSeichiMapKml(oldKml, [])[0].id;
    const renamedLocation = parseSeichiMapKml(renamedKml, [])[0];
    const registry = updateSeichiMapLocationIdentityRegistry(renamedKml, []);

    expect(renamedLocation).toMatchObject({
      id: oldId,
      name: "ゴリラ公園（AZKiナビ）",
    });
    expect(registry[0]).toMatchObject({
      id: oldId,
      names: expect.arrayContaining(["ゴリラ公園", "ゴリラ公園(azkiナビ)"]),
    });
    expect(registry[0].sourceIds).toHaveLength(2);
  });

  it("uses the pre-live-name ID for active venues in the live archive layer", () => {
    const oldKml = createKml({
      folder: "LiVE開催・出演会場、過去のコラボ情報アーカイブ",
      name: "ぴあアリーナMM",
      latitude: 35.5,
      longitude: 139.5,
    });
    const renamedKml = createKml({
      folder: "LiVE開催・出演会場、過去のコラボ情報アーカイブ",
      name: "ぴあアリーナMM（Departure）",
      latitude: 35.5,
      longitude: 139.5,
    });
    const oldId = parseSeichiMapKml(oldKml, [])[0].id;
    const renamedLocation = parseSeichiMapKml(renamedKml, [])[0];
    const registry = updateSeichiMapLocationIdentityRegistry(renamedKml, []);

    expect(renamedLocation).toMatchObject({
      id: oldId,
      name: "ぴあアリーナMM（Departure）",
    });
    expect(registry[0]).toMatchObject({
      id: oldId,
      names: expect.arrayContaining([
        "ぴあアリーナmm",
        "ぴあアリーナmm(departure)",
      ]),
    });
    expect(registry[0].sourceIds).toHaveLength(2);
  });

  it("uses the pre-prefix ID for locations in the holomember map layer", () => {
    const oldKml = createKml({
      folder: "ホロメンマップ",
      name: "香港飲茶 星街（星街すいせい）",
      latitude: 35.0063084,
      longitude: 135.7581479,
    });
    const renamedKml = createKml({
      folder: "ホロメンマップ",
      name: "香港飲茶 星街（ホロメンマップ／星街すいせい）",
      latitude: 35.0063084,
      longitude: 135.7581479,
    });
    const oldId = parseSeichiMapKml(oldKml, [])[0].id;

    expect(parseSeichiMapKml(renamedKml, [])[0]).toMatchObject({
      id: oldId,
      name: "香港飲茶 星街（ホロメンマップ／星街すいせい）",
    });
  });

  it("keeps IDs when nearby locations are renamed without moving their pins", () => {
    const before = `
      <kml><Document><Folder><name>ホロメンマップ</name>
        <Placemark>
          <name>香港飲茶 星街（星街すいせい）</name>
          <Point><coordinates>135.7581479,35.0063084,0</coordinates></Point>
        </Placemark>
        <Placemark>
          <name>HAIRWIN（リスのマーク）（アユンダ・リス）</name>
          <Point><coordinates>135.7580195,35.0062533,0</coordinates></Point>
        </Placemark>
      </Folder></Document></kml>
    `;
    const identities = updateSeichiMapLocationIdentityRegistry(before, []);
    const oldIds = parseSeichiMapKml(before, identities).map(({ id }) => id);
    const after = `
      <kml><Document><Folder><name>ホロメンマップ</name>
        <Placemark>
          <name>香港飲茶 星街（改名後）</name>
          <Point><coordinates>135.7581479,35.0063084,0</coordinates></Point>
        </Placemark>
        <Placemark>
          <name>HAIRWIN（リスのマーク）（改名後）</name>
          <Point><coordinates>135.7580195,35.0062533,0</coordinates></Point>
        </Placemark>
      </Folder></Document></kml>
    `;

    expect(parseSeichiMapKml(after, identities).map(({ id }) => id)).toEqual(
      oldIds,
    );
  });

  it("keeps IDs when nearby same-name locations move to renamed layers", () => {
    const before = `
      <kml><Document>
        <Folder><name>旧レイヤーA</name><Placemark>
          <name>同名地点</name>
          <Point><coordinates>135.7581479,35.0063084,0</coordinates></Point>
        </Placemark></Folder>
        <Folder><name>旧レイヤーB</name><Placemark>
          <name>同名地点</name>
          <Point><coordinates>135.7580195,35.0062533,0</coordinates></Point>
        </Placemark></Folder>
      </Document></kml>
    `;
    const identities = updateSeichiMapLocationIdentityRegistry(before, []);
    const oldIds = parseSeichiMapKml(before, identities).map(({ id }) => id);
    const after = `
      <kml><Document>
        <Folder><name>新レイヤーA</name><Placemark>
          <name>同名地点</name>
          <Point><coordinates>135.7581479,35.0063084,0</coordinates></Point>
        </Placemark></Folder>
        <Folder><name>新レイヤーB</name><Placemark>
          <name>同名地点</name>
          <Point><coordinates>135.7580195,35.0062533,0</coordinates></Point>
        </Placemark></Folder>
      </Document></kml>
    `;

    expect(parseSeichiMapKml(after, identities).map(({ id }) => id)).toEqual(
      oldIds,
    );
  });

  it("does not strip existing archive labels from ended collaboration locations", () => {
    const kml = createKml({
      folder: "LiVE開催・出演会場、過去のコラボ情報アーカイブ",
      name: "（終了）京王線 新宿駅（京王電鉄 コラボ）",
      latitude: 35.5,
      longitude: 139.5,
    });
    const location = parseSeichiMapKml(kml, [])[0];
    const registry = updateSeichiMapLocationIdentityRegistry(kml, []);

    expect(registry[0]).toMatchObject({
      id: location.id,
      names: ["(終了)京王線 新宿駅(京王電鉄 コラボ)"],
    });
    expect(registry[0].sourceIds).toHaveLength(1);
  });

  it("ignores volatile My Maps hosted image URLs in identity history", () => {
    const kml = createKml({
      folder: "レイヤー",
      name: "画像付き地点",
      description:
        '<img src="https://mymaps.usercontent.google.com/hostedimage/m/token-a?fife=s16383" />',
      latitude: 35.5,
      longitude: 139.5,
    });
    const registry = updateSeichiMapLocationIdentityRegistry(kml, []);

    expect(registry[0].descriptionKeys).toEqual([]);
  });
});
