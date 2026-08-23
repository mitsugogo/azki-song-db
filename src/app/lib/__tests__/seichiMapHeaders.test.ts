import { describe, expect, it } from "vitest";
import { parseSeichiMapUserCount } from "../seichiMapHeaders";

describe("parseSeichiMapUserCount", () => {
  it("0以上の整数を利用者数として受け取る", () => {
    expect(parseSeichiMapUserCount("0")).toBe(0);
    expect(parseSeichiMapUserCount("12")).toBe(12);
  });

  it("欠損値や不正な値は表示対象にしない", () => {
    expect(parseSeichiMapUserCount(null)).toBeNull();
    expect(parseSeichiMapUserCount("")).toBeNull();
    expect(parseSeichiMapUserCount("-1")).toBeNull();
    expect(parseSeichiMapUserCount("1.5")).toBeNull();
    expect(parseSeichiMapUserCount("invalid")).toBeNull();
  });
});
