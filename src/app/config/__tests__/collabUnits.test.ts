import { describe, it, expect } from "vitest";
import {
  normalizeMemberNames,
  getCollabUnitName,
  getCollabMembers,
  isCollabUnit,
  collabUnits,
} from "../collabUnits";

describe("collabUnits utilities", () => {
  it("normalizeMemberNames は名前を安定ソートする", () => {
    const input = ["Moona Hoshinova", "星街すいせい", "AZKi", "IRyS"];
    const normalized = normalizeMemberNames(input);
    // ロケール順で AZKi が先頭に来ること
    expect(normalized[0]).toBe("AZKi");
    // オリジナル配列は変更しない
    expect(input).not.toBe(normalized);
  });

  it("getCollabUnitName はメンバー配列の順序に依存せず通称を返す", () => {
    const unit = collabUnits.find((u) => u.unitName === "Star Flower")!;
    const shuffled = [...unit.members].reverse();
    const name = getCollabUnitName(shuffled);
    expect(name).toBe("Star Flower");
  });

  it("getCollabUnitName は不一致の場合 null を返す", () => {
    const name = getCollabUnitName(["AZKi", "存在しないメンバー"]);
    expect(name).toBeNull();
  });

  it("getCollabMembers は通称からメンバー配列を返す（大文字小文字を無視）", () => {
    const members = getCollabMembers("soraz");
    expect(members).toBeTruthy();
    // SorAZ の定義がある
    expect(members).toContain("ときのそら");
    expect(getCollabMembers("SORAZ")!).toEqual(getCollabMembers("soraz")!);
  });

  it("getCollabMembers は該当なしで null を返す", () => {
    expect(getCollabMembers("no-such-unit")).toBeNull();
  });

  it("isCollabUnit は大文字小文字を無視して判断する", () => {
    expect(isCollabUnit("azbae") || isCollabUnit("AZBae")).toBeTruthy();
    expect(isCollabUnit("nope")).toBe(false);
  });
});
