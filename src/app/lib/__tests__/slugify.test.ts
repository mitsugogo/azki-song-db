import { describe, it, expect } from "vitest";
import { slugifyV2 } from "../slugify";

describe("slugifyV2", () => {
  it("returns empty string for empty input", () => {
    expect(slugifyV2("")).toBe("");
  });

  it("produces ascii-only slug for Japanese input", () => {
    const out = slugifyV2("ありがとう");
    expect(out).toMatch(/^[a-z0-9-]+-[a-z0-9]+$/);
  });

  it("is stable for same input and differs for different input", () => {
    const a = slugifyV2("ありがとう");
    const b = slugifyV2("ありがとう");
    const c = slugifyV2("ありがと");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("handles mixed scripts (ASCII + Japanese + numbers)", () => {
    const out = slugifyV2("Song 名称 2020");
    expect(out).toMatch(/^[a-z0-9-]+-[a-z0-9]+$/);
  });

  it("記号が入ってても大丈夫", () => {
    const out = slugifyV2("曲名！＠＃＄％＾＆＊（）");
    expect(out).toMatch(/^[a-z0-9-]+-[a-z0-9]+$/);

    const out2 = slugifyV2("愛♡スクリ～ム！");
    expect(out2).toMatch(/^[a-z0-9-]+-[a-z0-9]+$/);
  });
});
