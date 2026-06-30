import { describe, expect, it } from "vitest";
import { isAzkiBirthday } from "../birthday";

describe("isAzkiBirthday", () => {
  it("JSTの7月1日ちょうどを誕生日として扱う", () => {
    expect(isAzkiBirthday(new Date("2026-07-01T00:00:00+09:00"))).toBe(true);
  });

  it("JSTの6月30日中は誕生日として扱わない", () => {
    expect(isAzkiBirthday(new Date("2026-06-30T23:59:59+09:00"))).toBe(false);
  });

  it("JSTの7月2日以降は誕生日として扱わない", () => {
    expect(isAzkiBirthday(new Date("2026-07-02T00:00:00+09:00"))).toBe(false);
  });

  it("UTC日時でもJST変換後の日付で判定する", () => {
    expect(isAzkiBirthday(new Date("2026-06-30T15:00:00.000Z"))).toBe(true);
    expect(isAzkiBirthday(new Date("2026-07-01T14:59:59.999Z"))).toBe(true);
    expect(isAzkiBirthday(new Date("2026-07-01T15:00:00.000Z"))).toBe(false);
  });
});
