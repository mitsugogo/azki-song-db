"use client";

import { ActionIcon, Button, CopyButton, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";
import { LuCheck, LuChevronDown, LuChevronUp, LuLink } from "react-icons/lu";
import { Link } from "../../i18n/navigation";
import {
  getSongModeItemLabel,
  renderSongModeIcon,
  SONG_MODE_MENU_ITEMS,
  type SongMode,
} from "../components/songModeMenu";
import { baseUrl } from "../config/siteConfig";
import { showAppNotification } from "../lib/notifications";
import { buildWatchHref } from "../lib/watchUrl";

const FEATURED_SONG_MODES = [
  {
    mode: "original-songs",
    color: "tan",
    labelKey: "originalSongs",
  },
  {
    mode: "cover-songs",
    color: "gray",
    labelKey: "coverSongs",
  },
  {
    mode: "collaboration-songs",
    color: "gray",
    labelKey: "collaborationSongs",
  },
  {
    mode: "singing-stream",
    color: "gray",
    labelKey: "karaokeSongs",
  },
] as const;

const ADDITIONAL_SONG_MODES = [
  "spring-song",
  "summer-song",
  "winter-song",
  "ballad",
  "special-live",
  "collab-singing-stream",
  "song-introduction-shorts",
  "anime-songs",
  "hololive-songs",
  "vocaloid-songs",
] as const satisfies readonly Exclude<SongMode, "">[];

export const HomeSongModeButtons = memo(function HomeSongModeButtons() {
  const t = useTranslations("Home");
  const tSongMode = useTranslations("Watch.songMode");
  const [showAdditionalModes, setShowAdditionalModes] = useState(false);

  const renderModeButton = (
    mode: Exclude<SongMode, "">,
    label: string,
    color?: string,
  ) => {
    const menuItem =
      SONG_MODE_MENU_ITEMS.find((item) => item.mode === mode) ??
      SONG_MODE_MENU_ITEMS[0];
    const href = buildWatchHref({ searchTerm: menuItem.searchTerm });
    const shareUrl = new URL(href, baseUrl).toString();

    return (
      <div key={mode} className="group relative w-full">
        <Button
          component={Link}
          href={href}
          className="w-full min-w-0"
          leftSection={renderSongModeIcon(menuItem.icon, "h-4 w-4")}
          color={color ?? menuItem.color}
          variant="light"
        >
          {label}
        </Button>
        <CopyButton value={shareUrl}>
          {({ copied, copy }) => (
            <Tooltip withArrow arrowSize={8} label={t("shareLinkTooltip")}>
              <ActionIcon
                aria-label={t("shareLinkTooltip")}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 opacity-40 transition-opacity hover:opacity-70 focus:opacity-70 md:opacity-0 md:group-hover:opacity-70"
                color="gray.4"
                variant="subtle"
                onClick={() => {
                  copy();
                  showAppNotification({
                    title: t("copied"),
                    message: tSongMode("modeUrlCopied", { mode: label }),
                    type: "success",
                    autoClose: 5000,
                  });
                }}
              >
                {copied ? <LuCheck /> : <LuLink />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </div>
    );
  };

  return (
    <div className="mt-2 w-full">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {FEATURED_SONG_MODES.map((item) =>
          renderModeButton(item.mode, t(item.labelKey), item.color),
        )}
      </div>

      <button
        type="button"
        className="mx-auto mt-2 flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs text-gray-500/70 transition-colors hover:bg-gray-100/70 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:text-gray-400/60 dark:hover:bg-gray-800/60 dark:hover:text-gray-300"
        aria-expanded={showAdditionalModes}
        aria-controls="additional-song-modes"
        onClick={() => setShowAdditionalModes((current) => !current)}
      >
        {showAdditionalModes ? (
          <LuChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <LuChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>
          {showAdditionalModes
            ? t("showFewerSongModes")
            : t("showMoreSongModes")}
        </span>
      </button>

      {showAdditionalModes ? (
        <div
          id="additional-song-modes"
          className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          {ADDITIONAL_SONG_MODES.map((mode) => {
            const menuItem =
              SONG_MODE_MENU_ITEMS.find((item) => item.mode === mode) ??
              SONG_MODE_MENU_ITEMS[0];

            return renderModeButton(
              mode,
              getSongModeItemLabel(menuItem, tSongMode),
            );
          })}
        </div>
      ) : null}
    </div>
  );
});
