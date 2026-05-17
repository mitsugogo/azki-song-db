import { describe, expect, it } from "vitest";
import { getDiscographyRepresentativeYear } from "../representativeDate";

describe("getDiscographyRepresentativeYear", () => {
  it("アルバム発売日が空なら配信年へフォールバックする", () => {
    expect(
      getDiscographyRepresentativeYear(
        {
          album_release_at: "",
          broadcast_at: "2025-04-01T12:00:00.000Z",
        },
        true,
      ),
    ).toBe(2025);
  });

  it("有効なアルバム発売日があればその年を優先する", () => {
    expect(
      getDiscographyRepresentativeYear(
        {
          album_release_at: "2024-11-06",
          broadcast_at: "2025-04-01T12:00:00.000Z",
        },
        true,
      ),
    ).toBe(2024);
  });

  it("アルバム単位でない場合は配信年を使う", () => {
    expect(
      getDiscographyRepresentativeYear(
        {
          album_release_at: "2024-11-06",
          broadcast_at: "2025-04-01T12:00:00.000Z",
        },
        false,
      ),
    ).toBe(2025);
  });
});
