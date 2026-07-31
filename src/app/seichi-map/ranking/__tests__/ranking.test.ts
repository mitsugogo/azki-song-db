import { describe, expect, it } from "vitest";
import { addCompetitionRanks } from "../ranking";

describe("addCompetitionRanks", () => {
  it("同数を同順位にし、次の順位を繰り上げない", () => {
    expect(
      addCompetitionRanks([
        { name: "地点A", count: 10 },
        { name: "地点B", count: 10 },
        { name: "地点C", count: 8 },
        { name: "地点D", count: 4 },
        { name: "地点E", count: 4 },
      ]),
    ).toEqual([
      { name: "地点A", count: 10, rank: 1 },
      { name: "地点B", count: 10, rank: 1 },
      { name: "地点C", count: 8, rank: 3 },
      { name: "地点D", count: 4, rank: 4 },
      { name: "地点E", count: 4, rank: 4 },
    ]);
  });
});
