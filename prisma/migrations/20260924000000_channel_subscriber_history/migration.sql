CREATE TABLE `channel_subscriber_history` (
  `channel_id` VARCHAR(64) NOT NULL,
  `snapshot_date` DATE NOT NULL,
  `subscriber_count` BIGINT UNSIGNED NOT NULL,
  `observed_at_utc` DATETIME(3) NOT NULL,
  `channel_name` VARCHAR(255) NOT NULL,

  PRIMARY KEY (`channel_id`, `snapshot_date`),
  INDEX `ChannelSubscriberHistory_snapshot_date_idx` (`snapshot_date`)
);
