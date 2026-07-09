import { describe, expect, it } from "vitest";
import { parseSeichiMapKml } from "../seichiMap";

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
});
