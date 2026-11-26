-- AlterTable
ALTER TABLE `SeichiMapAchievementTier` ADD COLUMN `rarity` ENUM('N', 'R', 'SR', 'SSR', 'UR') NOT NULL DEFAULT 'N';

-- CreateTable
CREATE TABLE `SeichiMapUserTitle` (
    `userId` VARCHAR(255) NOT NULL,
    `achievementId` VARCHAR(64) NOT NULL,
    `level` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `SeichiMapUserAchievement_tier_idx` ON `SeichiMapUserAchievement`(`achievementId`, `level`);


-- SeedData

UPDATE `SeichiMapAchievementTier` SET `rarity` = 'R'
WHERE (`achievementId`, `level`) IN (
  ('real-guess-beginner', 3),
  ('real-guess-veteran', 1),
  ('azloc-1', 2),
  ('azloc-1', 3),
  ('azloc-2', 2),
  ('azloc-2', 3),
  ('kanaken-trip', 2),
  ('kanaken-trip', 3),
  ('azloc-3', 2),
  ('azloc-3', 3),
  ('azloc-4', 2),
  ('azloc-4', 3),
  ('azloc-5', 2),
  ('azloc-5', 3),
  ('azloc-6', 2),
  ('azloc-6', 3),
  ('azloc-7', 2),
  ('azloc-7', 3),
  ('azki-music', 2),
  ('azki-music', 3),
  ('collab-event', 2),
  ('collab-event', 3)
);

UPDATE `SeichiMapAchievementTier` SET `rarity` = 'SR'
WHERE (`achievementId`, `level`) IN (
  ('real-guess-veteran', 2),
  ('real-guess-veteran', 3),
  ('real-guess-pioneer', 1),
  ('real-guess-pioneer', 2),
  ('holomen-map-explorer', 1),
  ('holomen-map-explorer', 2),
  ('azloc-all', 2),
  ('azloc-all', 3),
  ('azloc-1', 4),
  ('azloc-2', 4),
  ('kanaken-trip', 4),
  ('azloc-3', 4),
  ('azloc-4', 4),
  ('azloc-5', 4),
  ('azloc-6', 4),
  ('azloc-7', 4),
  ('azki-music', 4),
  ('holomen-outing', 2),
  ('holomen-outing', 3),
  ('traffic-sister', 2),
  ('traffic-sister', 3),
  ('blue-sign', 2),
  ('blue-sign', 3),
  ('rail', 2),
  ('rail', 3),
  ('guess-100', 2),
  ('guess-100', 3),
  ('oshidora', 2),
  ('oshidora', 3),
  ('prefectures', 2),
  ('prefectures', 3),
  ('overseas', 2),
  ('overseas', 3),
  ('real-live', 2),
  ('real-live', 3),
  ('collab-event', 4)
);

UPDATE `SeichiMapAchievementTier` SET `rarity` = 'SSR'
WHERE (`achievementId`, `level`) IN (
  ('real-guess-pioneer', 3),
  ('real-guess-pioneer', 4),
  ('holomen-map-explorer', 3),
  ('azloc-all', 4),
  ('azloc-1', 5),
  ('azloc-1', 6),
  ('azloc-2', 5),
  ('azloc-2', 6),
  ('kanaken-trip', 5),
  ('kanaken-trip', 6),
  ('azloc-3', 5),
  ('azloc-3', 6),
  ('azloc-4', 5),
  ('azloc-4', 6),
  ('azloc-5', 5),
  ('azloc-5', 6),
  ('azloc-6', 5),
  ('azloc-6', 6),
  ('azloc-7', 5),
  ('azloc-7', 6),
  ('azki-music', 5),
  ('azki-music', 6),
  ('holomen-outing', 4),
  ('traffic-sister', 4),
  ('blue-sign', 4),
  ('rail', 4),
  ('guess-100', 4),
  ('oshidora', 4),
  ('prefectures', 4),
  ('overseas', 4),
  ('real-live', 4),
  ('collab-event', 5),
  ('collab-event', 6)
);

UPDATE `SeichiMapAchievementTier` SET `rarity` = 'UR'
WHERE (`achievementId`, `level`) IN (
  ('real-guess-pioneer', 5),
  ('real-guess-pioneer', 6),
  ('holomen-map-explorer', 4),
  ('holomen-map-explorer', 5),
  ('azloc-all', 5),
  ('azloc-all', 6),
  ('holomen-outing', 5),
  ('holomen-outing', 6),
  ('traffic-sister', 5),
  ('traffic-sister', 6),
  ('blue-sign', 5),
  ('blue-sign', 6),
  ('rail', 5),
  ('rail', 6),
  ('guess-100', 5),
  ('guess-100', 6),
  ('oshidora', 5),
  ('oshidora', 6),
  ('prefectures', 5),
  ('prefectures', 6),
  ('overseas', 5),
  ('overseas', 6),
  ('real-live', 5),
  ('real-live', 6)
);

