"use client";

import { ActionIcon, Button, CopyButton, Menu, Tooltip } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { LuCheck, LuChevronDown, LuLink, LuSparkles } from "react-icons/lu";
import { routing } from "@/i18n/routing";
import { baseUrl } from "../config/siteConfig";
import usePlaylists from "../hook/usePlaylists";
import { buildWatchHref } from "../lib/watchUrl";
import {
  getSongModeGroupLabels,
  getSongModeItemLabel,
  getSongModeSearchTerm,
  renderSongModeIcon,
  SONG_MODE_MENU_ITEMS,
  type SongModeGroup,
  type SongModeMenuItem,
  type SongMode,
} from "./songModeMenu";

type SongModeControlsProps = {
  currentSongMode: SongMode;
  onSelectSongMode: (searchTerm: string) => void;
  onSurprise: () => void;
  onPlaylist: () => void;
  variant?: "desktop" | "mobile";
  sizeClassName?: string;
  songModeMenuItems?: SongModeMenuItem[];
};

export const buildSongModeShareUrl = (searchTerm: string, locale: string) => {
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const watchHref = buildWatchHref({ searchTerm });

  return new URL(`${localePrefix}${watchHref}`, baseUrl).toString();
};

export default function SongModeControls({
  currentSongMode,
  onSelectSongMode,
  onSurprise,
  onPlaylist,
  variant = "desktop",
  sizeClassName,
  songModeMenuItems = SONG_MODE_MENU_ITEMS,
}: SongModeControlsProps) {
  const t = useTranslations("Watch.searchAndSongList");
  const tSongMode = useTranslations("Watch.songMode");
  const locale = useLocale();
  const { isNowPlayingPlaylist, authenticated } = usePlaylists();
  const textClassName =
    sizeClassName ?? (variant === "mobile" ? "text-xs" : "text-sm");
  const rowMarginClassName = variant === "mobile" ? "mt-1" : "mt-2";
  const buttonBaseClassName =
    "px-3 py-1 h-8 cursor-pointer rounded transition shadow-md ring-0 focus:ring-0";
  const neutralButtonClassName =
    variant === "mobile"
      ? "bg-light-gray-200 hover:bg-light-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground dark:text-white"
      : "bg-light-gray-300 hover:bg-light-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground dark:text-white";
  const allSongModeItem =
    songModeMenuItems.find((item) => item.mode === "") ?? songModeMenuItems[0];
  const groupedSongModeMenuItems = songModeMenuItems.filter(
    (item) => item.mode !== "",
  );
  const songModeGroupedItems = {
    mode: groupedSongModeMenuItems.filter((item) => item.group === "mode"),
    theme: groupedSongModeMenuItems.filter((item) => item.group === "theme"),
    scene: groupedSongModeMenuItems.filter((item) => item.group === "scene"),
    genre: groupedSongModeMenuItems.filter((item) => item.group === "genre"),
  } as const;
  const songModeGroupLabels = getSongModeGroupLabels(tSongMode);
  const currentSongModeItem =
    songModeMenuItems.find((item) => item.mode === currentSongMode) ??
    allSongModeItem;
  const renderMenuItem = (item: SongModeMenuItem) => {
    const label = getSongModeItemLabel(item, tSongMode);
    const searchTerm = getSongModeSearchTerm(item.mode);
    const copyLabel = tSongMode("copyModeUrl", { mode: label });

    return (
      <div key={item.mode || "all"} className="group relative min-w-0">
        <Menu.Item
          className="pr-9"
          leftSection={renderSongModeIcon(item.icon, "h-4 w-4")}
          onClick={() => onSelectSongMode(searchTerm)}
        >
          {label}
        </Menu.Item>
        <CopyButton value={buildSongModeShareUrl(searchTerm, locale)}>
          {({ copied, copy }) => (
            <Tooltip
              withArrow
              arrowSize={8}
              label={
                copied ? tSongMode("modeUrlCopied", { mode: label }) : copyLabel
              }
            >
              <ActionIcon
                aria-label={copyLabel}
                className={`absolute right-1 top-1/2 z-10 -translate-y-1/2 transition-opacity focus:opacity-70 ${
                  variant === "mobile"
                    ? "opacity-40 hover:opacity-70"
                    : "opacity-0 group-hover:opacity-70"
                }`}
                color="gray.4"
                size="sm"
                variant="subtle"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  copy();
                }}
              >
                {copied ? (
                  <LuCheck className="h-3.5 w-3.5" />
                ) : (
                  <LuLink className="h-3.5 w-3.5" />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-1.25 ${rowMarginClassName}`}>
      <Menu
        withinPortal={false}
        width={variant === "mobile" ? "80vw" : 520}
        position="bottom-end"
        withArrow
        shadow="md"
      >
        <Menu.Target>
          <Button
            aria-label={`${tSongMode("selectMode")}: ${getSongModeItemLabel(currentSongModeItem, tSongMode)}`}
            className={`${buttonBaseClassName} w-full min-w-0 shadow-gray-400/20 dark:shadow-none ${textClassName}`}
            color={currentSongModeItem.color}
            leftSection={renderSongModeIcon(
              currentSongModeItem.icon,
              "h-4 w-4",
            )}
            rightSection={<LuChevronDown className="h-4 w-4" />}
            justify="space-between"
          >
            <span className="truncate">
              {getSongModeItemLabel(currentSongModeItem, tSongMode)}
            </span>
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          {renderMenuItem(allSongModeItem)}
          <Menu.Divider />
          {(Object.keys(songModeGroupedItems) as SongModeGroup[]).map(
            (group) => {
              const items = songModeGroupedItems[group];
              if (items.length === 0) {
                return null;
              }

              return (
                <div key={group}>
                  <Menu.Label>{songModeGroupLabels[group]}</Menu.Label>
                  <div className="grid grid-cols-2">
                    {items.map(renderMenuItem)}
                  </div>
                  {group !== "genre" &&
                  songModeGroupedItems.genre.length > 0 ? (
                    <Menu.Divider />
                  ) : null}
                </div>
              );
            },
          )}
        </Menu.Dropdown>
      </Menu>

      <div className="flex gap-1.25">
        <Tooltip label={t("surpriseTooltip")} withArrow position="bottom">
          <Button
            onClick={onSurprise}
            className={`${buttonBaseClassName} min-w-0 flex-1 bg-primary hover:bg-primary-600 dark:bg-primary-900 text-white shadow-black/20 dark:shadow-none ${textClassName}`}
          >
            <>
              <LuSparkles className="mr-1" />
              <span className="truncate">{t("randomOtherSong")}</span>
            </>
          </Button>
        </Tooltip>

        <Tooltip
          label={authenticated ? undefined : t("signInRequired")}
          disabled={authenticated}
          withArrow
          position="bottom"
        >
          <span className="min-w-0 flex-1">
            <Button
              disabled={!authenticated}
              className={`${buttonBaseClassName} w-full text-white shadow-gray-400/20 dark:shadow-none ${textClassName} ${
                isNowPlayingPlaylist()
                  ? "bg-green-400 hover:bg-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                  : neutralButtonClassName
              }`}
              onClick={onPlaylist}
            >
              <span className="truncate">{t("playlist")}</span>
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
