import { describe, expect, it } from "vitest";
import {
  compareSeichiMapMarkerPresentations,
  getSeichiMapMarkerPresentation,
  SEICHI_MAP_EVERYONE_DARK_COLOR,
  SEICHI_MAP_EVERYONE_LIGHT_COLOR,
  SEICHI_MAP_EVERYONE_SINGLE_VISITOR_COLOR,
  SEICHI_MAP_SELF_VISITED_COLOR,
  SEICHI_MAP_UNVISITED_COLOR,
} from "../pointLayer";

describe("seichi map point layer", () => {
  it("自分レイヤーでは従来の訪問状態色を維持する", () => {
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "self",
        isVisited: false,
        uniqueVisitorCount: 20,
        maxUniqueVisitorCount: 20,
      }),
    ).toEqual({ color: SEICHI_MAP_UNVISITED_COLOR, priority: 0 });
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "self",
        isVisited: true,
        uniqueVisitorCount: 0,
        maxUniqueVisitorCount: 20,
      }),
    ).toEqual({ color: SEICHI_MAP_SELF_VISITED_COLOR, priority: 1 });
  });

  it("みんなレイヤーでは0人を青、1人を黄色、2人以上をピンクにする", () => {
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "everyone",
        isVisited: false,
        uniqueVisitorCount: 0,
        maxUniqueVisitorCount: 100,
      }).color,
    ).toBe(SEICHI_MAP_UNVISITED_COLOR);
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "everyone",
        isVisited: false,
        uniqueVisitorCount: 1,
        maxUniqueVisitorCount: 100,
      }).color,
    ).toBe(SEICHI_MAP_EVERYONE_SINGLE_VISITOR_COLOR);
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "everyone",
        isVisited: false,
        uniqueVisitorCount: 2,
        maxUniqueVisitorCount: 100,
      }).color,
    ).toBe(SEICHI_MAP_EVERYONE_LIGHT_COLOR);
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "everyone",
        isVisited: false,
        uniqueVisitorCount: 100,
        maxUniqueVisitorCount: 100,
      }).color,
    ).toBe(SEICHI_MAP_EVERYONE_DARK_COLOR);
  });

  it("2人を起点とする対数スケールで中間色を計算する", () => {
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "everyone",
        isVisited: false,
        uniqueVisitorCount: 20,
        maxUniqueVisitorCount: 200,
      }).color,
    ).toBe("#de648f");
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "everyone",
        isVisited: false,
        uniqueVisitorCount: 2,
        maxUniqueVisitorCount: 2,
      }).color,
    ).toBe(SEICHI_MAP_EVERYONE_LIGHT_COLOR);
    expect(
      getSeichiMapMarkerPresentation({
        pointLayer: "everyone",
        isVisited: false,
        uniqueVisitorCount: 1,
        maxUniqueVisitorCount: 1,
      }).color,
    ).toBe(SEICHI_MAP_EVERYONE_SINGLE_VISITOR_COLOR);
  });

  it("訪問者数の多い地点を後から描画する順序を返す", () => {
    const presentations = [10, 0, 1, 2].map((uniqueVisitorCount) =>
      getSeichiMapMarkerPresentation({
        pointLayer: "everyone",
        isVisited: false,
        uniqueVisitorCount,
        maxUniqueVisitorCount: 10,
      }),
    );

    expect(
      presentations
        .sort(compareSeichiMapMarkerPresentations)
        .map(({ priority }) => priority),
    ).toEqual([0, 1, 2, 10]);
  });
});
