import { describe, expect, it } from "vitest";
import {
  cycleSeichiMapSheetSnap,
  getSeichiMapSheetSnapAfterDrag,
  SEICHI_MAP_SHEET_DRAG_THRESHOLD,
} from "../sheetSnap";

describe("seichi map bottom sheet snap", () => {
  it("タップで peek → half → full → peek と循環する", () => {
    expect(cycleSeichiMapSheetSnap("peek")).toBe("half");
    expect(cycleSeichiMapSheetSnap("half")).toBe("full");
    expect(cycleSeichiMapSheetSnap("full")).toBe("peek");
  });

  it("上向きのドラッグで1段階開き、下向きで1段階閉じる", () => {
    expect(getSeichiMapSheetSnapAfterDrag("peek", -80)).toBe("half");
    expect(getSeichiMapSheetSnapAfterDrag("half", -80)).toBe("full");
    expect(getSeichiMapSheetSnapAfterDrag("full", 80)).toBe("half");
    expect(getSeichiMapSheetSnapAfterDrag("half", 80)).toBe("peek");
  });

  it("端ではそれ以上動かない", () => {
    expect(getSeichiMapSheetSnapAfterDrag("full", -200)).toBe("full");
    expect(getSeichiMapSheetSnapAfterDrag("peek", 200)).toBe("peek");
  });

  it("しきい値未満の移動はタップ扱いで段階を変えない", () => {
    const small = SEICHI_MAP_SHEET_DRAG_THRESHOLD - 1;
    expect(getSeichiMapSheetSnapAfterDrag("half", -small)).toBe("half");
    expect(getSeichiMapSheetSnapAfterDrag("half", small)).toBe("half");
    expect(
      getSeichiMapSheetSnapAfterDrag("half", -SEICHI_MAP_SHEET_DRAG_THRESHOLD),
    ).toBe("full");
  });
});
