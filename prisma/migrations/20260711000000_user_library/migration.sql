CREATE TABLE `UserPlaylist` (
  `id` CHAR(36) NOT NULL,
  `userId` VARCHAR(255) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UserPlaylist_user_name_key` (`userId`, `name`),
  INDEX `UserPlaylist_user_updated_idx` (`userId`, `updatedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserPlaylistEntry` (
  `id` CHAR(36) NOT NULL,
  `playlistId` CHAR(36) NOT NULL,
  `videoId` VARCHAR(100) NOT NULL,
  `start` VARCHAR(32) NOT NULL,
  `position` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UserPlaylistEntry_song_key` (`playlistId`, `videoId`, `start`),
  UNIQUE INDEX `UserPlaylistEntry_position_key` (`playlistId`, `position`),
  CONSTRAINT `UserPlaylistEntry_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `UserPlaylist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserFavorite` (
  `id` CHAR(36) NOT NULL,
  `userId` VARCHAR(255) NOT NULL,
  `videoId` VARCHAR(100) NOT NULL,
  `start` VARCHAR(32) NOT NULL,
  `position` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UserFavorite_song_key` (`userId`, `videoId`, `start`),
  UNIQUE INDEX `UserFavorite_position_key` (`userId`, `position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LegacyPlaylistImport` (
  `id` CHAR(36) NOT NULL,
  `userId` VARCHAR(255) NOT NULL,
  `fingerprint` CHAR(64) NOT NULL,
  `playlistId` CHAR(36) NULL,
  `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `LegacyPlaylistImport_user_fingerprint_key` (`userId`, `fingerprint`),
  INDEX `LegacyPlaylistImport_playlist_idx` (`playlistId`),
  CONSTRAINT `LegacyPlaylistImport_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `UserPlaylist` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
