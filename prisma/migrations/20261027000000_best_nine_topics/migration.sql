-- CreateTable
CREATE TABLE `BestNineTopic` (
    `id` CHAR(36) NOT NULL,
    `ownerId` VARCHAR(255) NOT NULL,
    `currentVersion` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BestNineTopic_ownerId_updatedAt_idx`(`ownerId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BestNineTopicRevision` (
    `id` CHAR(36) NOT NULL,
    `topicId` CHAR(36) NOT NULL,
    `version` INTEGER NOT NULL,
    `title` VARCHAR(50) NOT NULL,
    `themes` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BestNineTopicRevision_topicId_version_key`(`topicId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BestNineResponse` (
    `id` VARCHAR(20) NOT NULL,
    `revisionId` CHAR(36) NULL,
    `respondentKey` CHAR(64) NOT NULL,
    `userId` VARCHAR(255) NULL,
    `selection` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BestNineResponse_revisionId_userId_idx`(`revisionId`, `userId`),
    UNIQUE INDEX `BestNineResponse_revisionId_respondentKey_key`(`revisionId`, `respondentKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BestNineResponseEntry` (
    `responseId` VARCHAR(20) NOT NULL,
    `slot` INTEGER NOT NULL,
    `videoId` VARCHAR(100) NOT NULL,
    `start` VARCHAR(32) NOT NULL,
    `songKey` CHAR(64) NOT NULL,
    `performanceKey` CHAR(64) NOT NULL,
    `videoTitle` VARCHAR(500) NOT NULL,
    `broadcastAt` VARCHAR(64) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `artist` VARCHAR(500) NOT NULL,

    INDEX `BestNineResponseEntry_songKey_idx`(`songKey`),
    PRIMARY KEY (`responseId`, `slot`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BestNineTopicRevision` ADD CONSTRAINT `BestNineTopicRevision_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `BestNineTopic`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BestNineResponse` ADD CONSTRAINT `BestNineResponse_revisionId_fkey` FOREIGN KEY (`revisionId`) REFERENCES `BestNineTopicRevision`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BestNineResponseEntry` ADD CONSTRAINT `BestNineResponseEntry_responseId_fkey` FOREIGN KEY (`responseId`) REFERENCES `BestNineResponse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
