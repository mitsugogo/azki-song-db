import { describe, expect, it } from "vitest";
import {
  holoGenerationGroupOrder,
  resolveHoloGenerationGroup,
} from "../holoGenerations";

describe("resolveHoloGenerationGroup", () => {
  it("groups JP branch channels by numbered generation", () => {
    expect(
      resolveHoloGenerationGroup({ branch: "JP", generation: "0期生" }).label,
    ).toBe("0期生");
    expect(
      resolveHoloGenerationGroup({
        branch: "JP",
        generation: "1期生、ゲーマーズ",
      }).label,
    ).toBe("1期生");
    expect(
      resolveHoloGenerationGroup({ branch: "JP", generation: "ゲーマーズ" })
        .label,
    ).toBe("ゲーマーズ");
    expect(
      resolveHoloGenerationGroup({
        branch: "JP",
        generation: "6期生、holoX、活動終了",
      }).label,
    ).toBe("holoX(6期生)");
  });

  it("groups ID/EN branch channels with a branch-prefixed label", () => {
    expect(
      resolveHoloGenerationGroup({ branch: "ID", generation: "2期生" }).label,
    ).toBe("ID2期生");
    expect(
      resolveHoloGenerationGroup({ branch: "EN", generation: "1期生、卒業生" })
        .label,
    ).toBe("EN1期生");
  });

  it("groups DEV_IS units by unit name", () => {
    expect(
      resolveHoloGenerationGroup({ branch: "DEV_IS", generation: "ReGLOSS" })
        .label,
    ).toBe("ReGLOSS");
    expect(
      resolveHoloGenerationGroup({ branch: "DEV_IS", generation: "FLOW GLOW" })
        .label,
    ).toBe("FLOW GLOW");
  });

  it("falls back to その他 for non-hololive channels or missing channel data", () => {
    expect(
      resolveHoloGenerationGroup({ branch: "にじさんじ", generation: "" })
        .label,
    ).toBe("その他");
    expect(resolveHoloGenerationGroup(null).label).toBe("その他");
  });

  it("orders debut generations before その他", () => {
    expect(holoGenerationGroupOrder.at(-1)).toBe("other");
    expect(holoGenerationGroupOrder.indexOf("jp-0")).toBeLessThan(
      holoGenerationGroupOrder.indexOf("jp-1"),
    );
    expect(holoGenerationGroupOrder.indexOf("jp-6")).toBeLessThan(
      holoGenerationGroupOrder.indexOf("en-2"),
    );
  });
});
