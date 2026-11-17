"use client";
import { Button, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  bestNineLiveChoiceKey,
  type BestNineLiveChoice,
} from "@/app/lib/bestNineLive";
import type { Song } from "@/app/types/song";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { Link } from "@/i18n/navigation";
import { HiCheck, HiInformationCircle, HiPlus } from "react-icons/hi";
import styles from "./client.module.css";

export default function BestNineLiveSelector({
  choices,
  selectedKeys,
  canAdd,
  onSelect,
  recordings,
}: {
  choices: BestNineLiveChoice[];
  selectedKeys: Set<string>;
  canAdd: boolean;
  onSelect: (choice: BestNineLiveChoice, recording?: Song) => void;
  recordings: Map<string, Song>;
}) {
  const t = useTranslations("Share.myBest9.settings");
  const locale = useLocale();
  const [limit, setLimit] = useState(60);
  return (
    <Stack gap="sm">
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5">
        {choices.slice(0, limit).map((choice) => {
          const key = bestNineLiveChoiceKey(choice);
          const recording = recordings.get(key);
          const selected = selectedKeys.has(key);
          const title =
            locale === "en" ? choice.titleEn || choice.title : choice.title;
          const disabled = !selected && !canAdd;
          const performanceLabel = [
            choice.liveTitle,
            choice.performance,
            choice.date,
          ]
            .filter(Boolean)
            .join(" / ");
          return (
            <article
              key={key}
              className={`${styles.songCard} ${styles.liveSongCard}`}
              data-selected={selected || undefined}
              data-disabled={disabled || undefined}
            >
              <UnstyledButton
                type="button"
                className={styles.liveSongSelect}
                aria-label={t(selected ? "selectedLive" : "selectLive", {
                  title,
                })}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onSelect(choice, recording)}
              >
                <span className={styles.thumbnail}>
                  <YoutubeThumbnail
                    videoId={recording?.video_id ?? ""}
                    alt={title}
                  />
                  <span
                    aria-hidden="true"
                    className={`${styles.selectedCheck} ${styles.liveChoiceIndicator}`}
                    data-selected={selected || undefined}
                  >
                    {selected ? <HiCheck size={14} /> : <HiPlus size={14} />}
                  </span>
                </span>
                <span className={styles.songDetails}>
                  <Text
                    component="span"
                    className={styles.songTitle}
                    lineClamp={2}
                    title={title}
                  >
                    {choice.order ? `${choice.order}. ` : ""}
                    {title}
                  </Text>
                  <Text
                    component="span"
                    size="xs"
                    c="dimmed"
                    truncate
                    display="block"
                    title={choice.singers}
                  >
                    {choice.singers}
                  </Text>
                  <Text
                    component="span"
                    size="10px"
                    c="dimmed"
                    truncate
                    display="block"
                    pr={20}
                  >
                    {t(
                      recording
                        ? recording.tags.includes("オリ曲MV")
                          ? "originalMv"
                          : "artTrack"
                        : "videoPlaceholder",
                    )}
                  </Text>
                </span>
              </UnstyledButton>
              <Tooltip label={performanceLabel}>
                <Link
                  href={choice.path}
                  aria-label={t("performanceInfo", { title })}
                  className={styles.livePerformanceLink}
                >
                  <HiInformationCircle size={16} aria-hidden="true" />
                </Link>
              </Tooltip>
            </article>
          );
        })}
      </div>
      {!choices.length && (
        <Text size="sm" c="dimmed">
          {t("noLiveSongs")}
        </Text>
      )}
      {choices.length > limit && (
        <Button variant="subtle" onClick={() => setLimit(limit + 60)}>
          {t("showMore")}
        </Button>
      )}
    </Stack>
  );
}
