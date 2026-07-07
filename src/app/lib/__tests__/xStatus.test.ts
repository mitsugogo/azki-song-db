import { describe, expect, it } from "vitest";
import { parseXStatusDateFromUrl, parseXStatusSnowflakeId } from "../xStatus";

describe("parseXStatusSnowflakeId", () => {
  it("extracts the status ID from an X URL", () => {
    expect(
      parseXStatusSnowflakeId(
        "https://x.com/mitsugogo/status/1629295908591480832",
      ),
    ).toBe("1629295908591480832");
  });

  it("extracts the status ID from a mobile Twitter URL", () => {
    expect(
      parseXStatusSnowflakeId(
        "https://mobile.twitter.com/mitsugogo/status/1629295908591480832",
      ),
    ).toBe("1629295908591480832");
  });

  it("returns null for non-status URLs", () => {
    expect(parseXStatusSnowflakeId("https://x.com/mitsugogo")).toBeNull();
  });
});

describe("parseXStatusDateFromUrl", () => {
  it("returns JST date for a valid status URL", () => {
    expect(
      parseXStatusDateFromUrl(
        "https://x.com/mitsugogo/status/1629295908591480832",
      ),
    ).toBe("2023-02-25");
  });

  it("returns null for an invalid status ID", () => {
    expect(
      parseXStatusDateFromUrl("https://x.com/mitsugogo/status/abcd"),
    ).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(parseXStatusDateFromUrl("not a url")).toBeNull();
  });
});
