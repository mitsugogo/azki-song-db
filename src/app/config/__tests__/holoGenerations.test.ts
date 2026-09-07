import { describe, expect, it } from "vitest";
import {
  holoGenerationGroupOrder,
  resolveHoloGenerationGroup,
  resolveHoloGenerationGroups,
} from "../holoGenerations";

describe("resolveHoloGenerationGroup", () => {
  it.each([
    ["JP", "0期生", "0期生"],
    ["JP", "1期生、ゲーマーズ", "1期生"],
    ["JP", "ゲーマーズ", "ホロライブゲーマーズ"],
    ["JP", "6期生、holoX、活動終了", "秘密結社holoX"],
    ["ID", "1期生", "AREA15"],
    ["ID", "2期生", "holoro"],
    ["ID", "3期生", "holoh3ro"],
    ["EN", "1期生、卒業生", "Myth"],
    ["EN", "1.5期生", "Project: HOPE"],
    ["EN", "2期生", "Council"],
    ["EN", "3期生", "Advent"],
    ["EN", "4期生", "Justice"],
    ["DEV_IS", "ReGLOSS", "ReGLOSS"],
    ["DEV_IS", "FLOW GLOW", "FLOW GLOW"],
    ["hololive", "Promise", "Promise"],
    ["hololive", "卒業生", "卒業生"],
    ["hololive", "holoAN", "holoAN"],
    ["hololive", "事務所スタッフ", "事務所スタッフ"],
  ])("maps %s / %s to the official %s group", (branch, generation, label) => {
    expect(resolveHoloGenerationGroup({ branch, generation }).label).toBe(
      label,
    );
  });

  it("falls back to その他 for non-hololive channels or missing channel data", () => {
    expect(
      resolveHoloGenerationGroup({ branch: "にじさんじ", generation: "" })
        .label,
    ).toBe("その他");
    expect(resolveHoloGenerationGroup(null).label).toBe("その他");
  });

  it("returns every matching official group in official order", () => {
    expect(
      resolveHoloGenerationGroups({
        branch: "JP",
        generation: "1期生、ゲーマーズ",
      }),
    ).toEqual([
      { key: "hololive-1", label: "1期生" },
      { key: "hololive-gamers", label: "ホロライブゲーマーズ" },
    ]);
    expect(
      resolveHoloGenerationGroups({
        branch: "hololive",
        generation: "Council、Promise",
      }),
    ).toEqual([
      { key: "council", label: "Council" },
      { key: "promise", label: "Promise" },
    ]);
  });

  it("keeps the official talent group order before supplementary groups", () => {
    expect(holoGenerationGroupOrder).toEqual([
      "hololive-0",
      "hololive-1",
      "hololive-2",
      "hololive-gamers",
      "hololive-3",
      "hololive-4",
      "hololive-5",
      "hololive-holox",
      "area15",
      "holoro",
      "holoh3ro",
      "myth",
      "project-hope",
      "council",
      "promise",
      "advent",
      "justice",
      "regloss",
      "flow-glow",
      "graduates",
      "holoan",
      "office-staff",
      "holostars",
      "official",
      "other",
    ]);
  });
});
