CREATE TABLE `SeichiMapProfile` (
  `userId` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(40) NOT NULL,
  `showNicknameInRanking` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `SeichiMapProfile` (
  `userId`,
  `nickname`,
  `showNicknameInRanking`,
  `createdAt`,
  `updatedAt`
)
SELECT
  currentShare.`userId`,
  currentShare.`nickname`,
  true,
  currentShare.`createdAt`,
  currentShare.`updatedAt`
FROM `SeichiMapShare` AS currentShare
LEFT JOIN `SeichiMapShare` AS newerShare
  ON newerShare.`userId` = currentShare.`userId`
  AND (
    newerShare.`updatedAt` > currentShare.`updatedAt`
    OR (
      newerShare.`updatedAt` = currentShare.`updatedAt`
      AND newerShare.`shareId` > currentShare.`shareId`
    )
  )
WHERE newerShare.`shareId` IS NULL;
