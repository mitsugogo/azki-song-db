import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SEICHI_MAP_ACHIEVEMENT_DEFAULTS,
  toSeichiMapAchievementRaritySeedSql,
  toSeichiMapAchievementSeedSql,
} from "../seichiMapAchievementDefaults";
import { parseSeichiMapAchievementCriteria } from "../seichiMapAchievementRules";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../../prisma/migrations");

const readMigration = (name: string) =>
  readFileSync(
    path.join(MIGRATIONS_DIR, name, "migration.sql"),
    "utf8",
  ).replace(/\r\n/g, "\n");

const migrationSql = readMigration("20261126000000_seichi_map_achievements");
const raritySql = readMigration(
  "20261127000000_seichi_map_achievement_rarity_titles",
);

describe("seichi map achievement defaults", () => {
  it("シートの27バッジを一意のIDで定義する", () => {
    expect(SEICHI_MAP_ACHIEVEMENT_DEFAULTS).toHaveLength(27);
    expect(
      new Set(SEICHI_MAP_ACHIEVEMENT_DEFAULTS.map(({ id }) => id)).size,
    ).toBe(27);
  });

  it("criteria とグレードが DB の検証を通る", () => {
    for (const achievement of SEICHI_MAP_ACHIEVEMENT_DEFAULTS) {
      expect(
        parseSeichiMapAchievementCriteria(
          JSON.parse(JSON.stringify(achievement.criteria)),
        ),
      ).toEqual(achievement.criteria);
      expect(achievement.tiers.map(({ level }) => level)).toEqual(
        achievement.tiers.map((_, index) => index + 1),
      );
      for (const tier of achievement.tiers) {
        expect(tier.thresholdValue).toBeGreaterThan(0);
        if (tier.thresholdType === "PERCENT") {
          expect(tier.thresholdValue).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("migration の初期データが定義と一致する", () => {
    expect(migrationSql).toContain(toSeichiMapAchievementSeedSql());
    expect(
      readMigration("20261128000000_seichi_map_achievement_rarity_rebalance"),
    ).toContain(toSeichiMapAchievementRaritySeedSql());
  });

  it("適用済みの最初の migration にはレア度と称号を含めない", () => {
    // 適用済みの migration を書き換えても DB には反映されないため、追加分は別の migration に分ける。
    expect(migrationSql).not.toContain("rarity");
    expect(migrationSql).not.toContain("SeichiMapUserTitle");
    expect(raritySql).toContain("ADD COLUMN `rarity`");
  });

  it("migration を順に適用した結果のレア度が定義と一致する", () => {
    // 列の既定値 N から始め、全 migration の UPDATE を順に当てる。
    const rarityByTier = new Map<string, string>();
    for (const achievement of SEICHI_MAP_ACHIEVEMENT_DEFAULTS) {
      for (const tier of achievement.tiers) {
        rarityByTier.set(`${achievement.id}/${tier.level}`, "N");
      }
    }
    const migrations = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    for (const name of migrations) {
      const sql = readMigration(name);
      for (const match of sql.matchAll(
        /UPDATE `SeichiMapAchievementTier` SET `rarity` = '(\w+)'\nWHERE \(`achievementId`, `level`\) IN \(\n([\s\S]*?)\n\);/g,
      )) {
        for (const row of match[2].matchAll(/\('([^']+)', (\d+)\)/g)) {
          rarityByTier.set(`${row[1]}/${row[2]}`, match[1]);
        }
      }
    }
    for (const achievement of SEICHI_MAP_ACHIEVEMENT_DEFAULTS) {
      for (const tier of achievement.tiers) {
        expect(rarityByTier.get(`${achievement.id}/${tier.level}`)).toBe(
          tier.rarity,
        );
      }
    }
  });

  it("UR は各バッジの最上位グレードだけにし、上のグレードほどレア度を下げない", () => {
    const order = ["N", "R", "SR", "SSR", "UR"];
    for (const achievement of SEICHI_MAP_ACHIEVEMENT_DEFAULTS) {
      const ranks = achievement.tiers.map(({ rarity }) =>
        order.indexOf(rarity),
      );
      const urLevels = achievement.tiers
        .filter(({ rarity }) => rarity === "UR")
        .map(({ level }) => level);
      expect(urLevels.length, achievement.id).toBeLessThanOrEqual(1);
      if (urLevels.length === 1) {
        expect(urLevels[0], achievement.id).toBe(achievement.tiers.length);
      }
      expect(ranks, achievement.id).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it("旅路の開拓者は R から始まり、1000箇所だけが UR", () => {
    const pioneer = SEICHI_MAP_ACHIEVEMENT_DEFAULTS.find(
      ({ id }) => id === "real-guess-pioneer",
    )!;
    expect(pioneer.tiers.map(({ rarity }) => rarity)).toEqual([
      "R",
      "SR",
      "SR",
      "SSR",
      "SSR",
      "UR",
    ]);
  });
});
