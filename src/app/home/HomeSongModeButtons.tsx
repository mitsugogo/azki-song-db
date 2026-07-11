"use client";

import { Button, CopyButton, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { LuCopy, LuCopyCheck } from "react-icons/lu";
import { Link } from "../../i18n/navigation";
import { SONG_MODE_MENU_ITEMS } from "../components/songModeMenu";
import { baseUrl } from "../config/siteConfig";
import { showAppNotification } from "../lib/notifications";

const SONG_MODES = [
  {
    mode: "original-songs",
    href: "/watch?q=original-songs",
    shareUrl: new URL("/watch?q=original-songs", baseUrl).toString(),
    color: "tan",
    labelKey: "originalSongs",
    copiedKey: "originalSongsLinkCopied",
  },
  {
    mode: "cover-songs",
    href: "/watch?q=cover-songs",
    shareUrl: new URL("/watch?q=cover-songs", baseUrl).toString(),
    color: "gray",
    labelKey: "coverSongs",
    copiedKey: "coverSongsLinkCopied",
  },
  {
    mode: "collaboration-songs",
    href: "/watch?q=collaboration-songs",
    shareUrl: new URL("/watch?q=collaboration-songs", baseUrl).toString(),
    color: "gray",
    labelKey: "collaborationSongs",
    copiedKey: "collaborationSongsLinkCopied",
  },
  {
    mode: "tag:歌枠",
    href: "/watch?q=tag:歌枠",
    shareUrl: new URL("/watch?q=tag:%E6%AD%8C%E6%9E%A0", baseUrl).toString(),
    color: "gray",
    labelKey: "karaokeSongs",
    copiedKey: "karaokeSongsLinkCopied",
  },
] as const;

export const HomeSongModeButtons = memo(function HomeSongModeButtons() {
  const t = useTranslations("Home");

  return (
    <div className="mt-2 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
      {SONG_MODES.map((item) => {
        const menuItem =
          SONG_MODE_MENU_ITEMS.find(({ mode }) => mode === item.mode) ??
          SONG_MODE_MENU_ITEMS[0];
        const Icon = menuItem.icon;

        return (
          <Button.Group key={item.mode} className="w-full">
            <Button
              component={Link}
              href={item.href}
              className="min-w-0 flex-1"
              leftSection={<Icon className="h-4 w-4" />}
              color={item.color}
              variant="light"
            >
              {t(item.labelKey)}
            </Button>
            <CopyButton value={item.shareUrl}>
              {({ copied, copy }) => (
                <Tooltip withArrow arrowSize={8} label={t("shareLinkTooltip")}>
                  <Button
                    aria-label={t("shareLinkTooltip")}
                    className="shrink-0"
                    color={item.color}
                    variant="light"
                    onClick={() => {
                      copy();
                      showAppNotification({
                        title: t("copied"),
                        message: t(item.copiedKey),
                        type: "success",
                        autoClose: 5000,
                      });
                    }}
                  >
                    {copied ? <LuCopyCheck /> : <LuCopy />}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
          </Button.Group>
        );
      })}
    </div>
  );
});
