CREATE TABLE `SeichiMapIdentityRegistry` (
  `key` VARCHAR(32) NOT NULL,
  `identities` JSON NOT NULL,
  `version` INTEGER NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  `updatedBy` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
