import { describe, expect, it } from "vitest";
import { buildWatchCanonicalUrl, buildWatchHref } from "../watchUrl";

const baseUrl = "https://azki-song-db.vercel.app";

describe("buildWatchCanonicalUrl", () => {
  it.each([
    {
      input: { query: "year:2020" },
      expected: `${baseUrl}/watch?q=year%3A2020`,
    },
    {
      input: { videoId: "abc" },
      expected: `${baseUrl}/watch?v=abc`,
    },
    {
      input: { videoId: "abc", time: "100s" },
      expected: `${baseUrl}/watch?v=abc&t=100s`,
    },
    {
      input: { query: "year:2020", videoId: "abc" },
      expected: `${baseUrl}/watch?v=abc`,
    },
    {
      input: { query: "artist:AZKi", videoId: "abc", time: "100s" },
      expected: `${baseUrl}/watch?v=abc&t=100s`,
    },
    {
      input: { query: "foo", videoId: "abc", playlist: "xyz" },
      expected: `${baseUrl}/watch?v=abc&playlist=xyz`,
    },
    {
      input: {
        query: "foo",
        videoId: "abc",
        time: "100s",
        playlist: "xyz",
      },
      expected: `${baseUrl}/watch?v=abc&t=100s&playlist=xyz`,
    },
  ])("builds $expected", ({ input, expected }) => {
    expect(buildWatchCanonicalUrl({ baseUrl, ...input })).toBe(expected);
  });

  it("keeps playlist on search-only canonical URLs", () => {
    expect(
      buildWatchCanonicalUrl({
        baseUrl,
        query: "artist:AZKi",
        playlist: "xyz",
      }),
    ).toBe(`${baseUrl}/watch?q=artist%3AAZKi&playlist=xyz`);
  });
});

describe("buildWatchHref", () => {
  it("keeps the user-facing search term even when a video is selected", () => {
    expect(
      buildWatchHref({
        videoId: "abc",
        start: "100s",
        searchTerm: "year:2020",
      }),
    ).toBe("/watch?v=abc&t=100s&q=year%3A2020");
  });
});
