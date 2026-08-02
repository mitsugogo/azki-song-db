import { describe, expect, it } from "vitest";
import {
  compareActivityImportanceDesc,
  getActivityImportanceTextClassName,
  getHigherActivityImportance,
  normalizeActivityImportance,
} from "../activityImportance";

describe("activity importance", () => {
  it("normalizes numeric and named values to the shared levels", () => {
    expect(normalizeActivityImportance(1)).toBe("normal");
    expect(normalizeActivityImportance("2")).toBe("high");
    expect(normalizeActivityImportance(3)).toBe("extra_high");
    expect(normalizeActivityImportance("extra_high")).toBe("extra_high");
  });

  it("uses normal for empty and invalid values", () => {
    expect(normalizeActivityImportance("")).toBe("normal");
    expect(normalizeActivityImportance(undefined)).toBe("normal");
    expect(normalizeActivityImportance("unknown")).toBe("normal");
  });

  it("compares and merges higher importance first", () => {
    expect(compareActivityImportanceDesc("extra_high", "high")).toBeLessThan(0);
    expect(getHigherActivityImportance("normal", "high")).toBe("high");
    expect(getHigherActivityImportance("extra_high", "normal")).toBe(
      "extra_high",
    );
  });

  it("changes only the importance title text size", () => {
    expect(getActivityImportanceTextClassName("normal")).toBe("");
    expect(getActivityImportanceTextClassName("high")).toBe(
      "text-base leading-6",
    );
    expect(getActivityImportanceTextClassName("extra_high")).toBe(
      "text-lg leading-7",
    );
  });
});
