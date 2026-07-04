import { describe, expect, it } from "vitest";
import {
  getArchiveAnchorHref,
  getArchiveAnchorId,
  getArchiveAnchorUrl,
  getArchiveVideoIdFromHash,
} from "../archiveAnchors";

describe("archiveAnchors", () => {
  it("creates stable archive anchor ids and hrefs from video ids", () => {
    expect(getArchiveAnchorId("abc_123-xyz")).toBe("archive-abc_123-xyz");
    expect(getArchiveAnchorHref("abc_123-xyz")).toBe("#archive-abc_123-xyz");
  });

  it("extracts video ids from archive hashes", () => {
    expect(getArchiveVideoIdFromHash("#archive-abc_123-xyz")).toBe(
      "abc_123-xyz",
    );
    expect(getArchiveVideoIdFromHash("archive-abc_123-xyz")).toBe(
      "abc_123-xyz",
    );
  });

  it("creates shareable archive urls without current filters", () => {
    expect(
      getArchiveAnchorUrl(
        "https://example.com/stream-archives?keyword=azki&series=other",
        "abc_123-xyz",
      ),
    ).toBe("https://example.com/stream-archives#archive-abc_123-xyz");
  });

  it("ignores non archive hashes and malformed escape sequences", () => {
    expect(getArchiveVideoIdFromHash("#other-abc_123-xyz")).toBeNull();
    expect(getArchiveVideoIdFromHash("#archive-%E0%A4%A")).toBeNull();
  });
});
