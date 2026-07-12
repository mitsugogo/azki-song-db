import { describe, expect, it } from "vitest";
import { canViewPlaylist } from "../playlistVisibility";

describe("canViewPlaylist", () => {
  it.each(["PUBLIC", "UNLISTED"] as const)(
    "%s は未ログインでも閲覧できる",
    (visibility) => {
      expect(canViewPlaylist(visibility, "owner", null)).toBe(true);
    },
  );

  it("PRIVATE は所有者だけ閲覧できる", () => {
    expect(canViewPlaylist("PRIVATE", "owner", "owner")).toBe(true);
    expect(canViewPlaylist("PRIVATE", "owner", "other")).toBe(false);
    expect(canViewPlaylist("PRIVATE", "owner", null)).toBe(false);
  });
});
