import { describe, expect, it } from "vitest";
import { getLocalizedUnitText, getUnitBySlug, units } from "../units";

describe("units", () => {
  it("defines the requested AZKi units in display order", () => {
    expect(units.map((unit) => unit.slug)).toEqual([
      "aziro",
      "kozmy",
      "as-tar",
      "soraz",
    ]);
  });

  it.each([
    {
      slug: "kozmy",
      name: "KoZMy",
      formedAt: "2025-08-03",
      members: ["AZKi", "博衣こより", "雪花ラミィ"],
      tags: ["KoZMy"],
      videoId: "lvgC3pW-LVA",
    },
    {
      slug: "as-tar",
      name: "AS_tar",
      formedAt: "2024-06-02",
      members: ["AZKi", "星街すいせい"],
      tags: ["AS_tar"],
      videoId: "fVS8qkHfBOg",
    },
    {
      slug: "soraz",
      name: "SorAZ",
      formedAt: "2019-07-21",
      members: ["ときのそら", "AZKi"],
      tags: ["SorAZ"],
      videoId: "_ARIWfZ3HFs",
    },
  ])(
    "defines $name members, anniversary, tags, and formation history",
    ({ slug, name, formedAt, members, tags, videoId }) => {
      const unit = getUnitBySlug(slug);

      expect(unit).not.toBeNull();
      expect(getLocalizedUnitText(unit!.name, "ja")).toBe(name);
      expect(getLocalizedUnitText(unit!.name, "en")).toBe(name);
      expect(unit!.formedAt).toBe(formedAt);
      expect(unit!.anniversary).toEqual({
        month: Number(formedAt.slice(5, 7)),
        day: Number(formedAt.slice(8, 10)),
      });
      expect(unit!.members.map((member) => member.name.ja)).toEqual(members);
      expect(unit!.tags).toEqual(tags);
      expect(unit!.highlights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            date: formedAt,
            type: "formation",
            videoId,
          }),
        ]),
      );
    },
  );

  it("defines the INNK roots only for AS_tar", () => {
    expect(getUnitBySlug("as-tar")?.legacy).toEqual({
      name: { ja: "イノナカ組", en: "INNK duo" },
      startedAt: "2019-05-19",
      endedAt: "2019-12-01",
    });
    expect(
      units
        .filter((unit) => unit.slug !== "as-tar")
        .every((unit) => unit.legacy === undefined),
    ).toBe(true);
  });

  it("uses a curated event-focused history only for SorAZ", () => {
    expect(getUnitBySlug("soraz")?.includeWorksInHistory).toBe(false);
    expect(
      units
        .filter((unit) => unit.slug !== "soraz")
        .every((unit) => unit.includeWorksInHistory === undefined),
    ).toBe(true);
  });
});
