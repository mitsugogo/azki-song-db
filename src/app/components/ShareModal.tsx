"use client";

import { Song } from "../types/song";
import { Modal, TextInput, Button, Divider, Alert } from "@mantine/core";
import {
  HiClipboardCopy,
  HiExclamation,
  HiInformationCircle,
} from "react-icons/hi";
import { FaDatabase, FaShare, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { siteConfig } from "../config/siteConfig";
import { QRCodeSVG } from "qrcode.react";

// Propsの型定義
type ShareModalProps = {
  openShareModal: boolean;
  currentSong: Song | null;
  baseUrl: string;
  onClose: () => void;
};

export default function ShareModal({
  openShareModal,
  currentSong,
  baseUrl,
  onClose,
}: ShareModalProps) {
  const t = useTranslations("ShareModal");
  const [showCopiedYoutube, setShowCopiedYoutube] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrTarget, setQrTarget] = useState<"youtube" | "database">("database");

  const locale = useLocale();
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  const youtubeUrl = `https://www.youtube.com/watch?v=${currentSong?.video_id}${
    currentSong && Number(currentSong.start) > 0
      ? `&t=${currentSong.start}s`
      : ""
  }`;

  const databaseUrl = `${baseUrl}${localePrefix}/watch?v=${currentSong?.video_id}${
    currentSong && Number(currentSong.start) > 0
      ? `&t=${currentSong.start}`
      : ""
  }`;

  const qrValue = qrTarget === "youtube" ? youtubeUrl : databaseUrl;
  const hasCurrentSong = Boolean(currentSong?.video_id);

  const handleShareToX = (isDatabaseUrl: boolean) => {
    const text = isDatabaseUrl
      ? `${currentSong?.title} / ${currentSong?.artist} \n${currentSong?.video_title} #AZSongDB \n${databaseUrl}`
      : `${currentSong?.video_title} \n${youtubeUrl} #AZSongDB`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`);
  };

  const handleCopyToClipboard = (
    textToCopy: string,
    setShowCopiedState: (show: boolean) => void,
  ) => {
    navigator.clipboard.writeText(textToCopy);
    setShowCopiedState(true);
    setTimeout(() => setShowCopiedState(false), 3000);
  };

  return (
    <Modal
      opened={openShareModal}
      onClose={onClose}
      title={t("title")}
      overlayProps={{ opacity: 0.76, blur: 4 }}
    >
      <div className="">
        <p className="mb-4">{t("description")}</p>

        {/* メンバー限定動画の場合は注意 */}
        {currentSong?.is_members_only && (
          <Alert
            className="mb-4"
            color="red"
            title={t("membersOnlyAlertTitle")}
            icon={<HiExclamation />}
          >
            {t("membersOnlyAlert")}
          </Alert>
        )}

        {/* YouTube URL */}
        <div>
          <div className="mb-1 text-sm font-medium">
            <FaYoutube className="inline" color="red" />
            &nbsp;{t("youtubeUrl")}
          </div>
          <div className="relative">
            <TextInput className="w-full" value={youtubeUrl} readOnly />
            <button
              className="absolute right-3 -bottom-1.25 transform -translate-y-1/2 p-1 rounded-full bg-light-gray-200 dark:bg-gray-800 hover:bg-light-gray-300 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() =>
                handleCopyToClipboard(youtubeUrl, setShowCopiedYoutube)
              }
            >
              <HiClipboardCopy className="w-4 h-4" />
            </button>
            {showCopiedYoutube && (
              <div className="absolute right-3 -bottom-2 transform -translate-y-1/2 p-1 rounded-full text-white bg-light-gray-700 dark:bg-gray-800 text-sm font-bold">
                {t("copied")}
              </div>
            )}
          </div>
          <div className="mt-2">
            <div className="flex items-center">
              <Button
                variant="filled"
                color="dark"
                size="xs"
                className="mr-2"
                onClick={() => handleShareToX(false)}
              >
                <FaXTwitter className="w-4 h-4" />
              </Button>
              <Button
                variant="filled"
                color="dark"
                size="xs"
                onClick={() => {
                  const shareData = {
                    title: currentSong?.video_title,
                    text: currentSong?.video_title,
                    url: youtubeUrl,
                  };
                  navigator.share(shareData);
                }}
              >
                <FaShare className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        {/* AZKi Song Database URL */}
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium">
            ⚒️&nbsp;{siteConfig.siteName}
          </div>
          <div className="relative">
            <TextInput
              className="w-full"
              value={databaseUrl}
              readOnly
              onClick={() => handleCopyToClipboard(databaseUrl, setShowCopied)}
            />
            <button
              className="absolute right-3 -bottom-1.25 transform -translate-y-1/2 p-1 rounded-full bg-light-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleCopyToClipboard(databaseUrl, setShowCopied)}
            >
              <HiClipboardCopy className="w-4 h-4" />
            </button>
            {showCopied && (
              <div className="absolute right-3 -bottom-2 transform -translate-y-1/2 p-1 rounded-full text-white bg-light-gray-900 dark:bg-gray-800 text-sm font-bold">
                {t("copied")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="filled"
              color="dark"
              size="xs"
              onClick={() => handleShareToX(true)}
            >
              <FaXTwitter className="w-4 h-4" />
            </Button>
            <Button
              variant="filled"
              color="dark"
              size="xs"
              onClick={() => {
                const shareData = {
                  title: `${currentSong?.title} - ${currentSong?.artist}`,
                  text: `${currentSong?.title} - ${currentSong?.artist}`,
                  url: databaseUrl,
                };
                navigator.share(shareData);
              }}
            >
              <FaShare className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <Divider className="my-4" />
        <div>
          <button
            type="button"
            className="w-full flex items-center justify-between rounded-md border border-light-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-semibold hover:bg-light-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => setIsQrOpen((prev) => !prev)}
            aria-expanded={isQrOpen}
            aria-controls="share-modal-qr-panel"
          >
            <span>{t("qrSectionTitle")}</span>
            <span>{isQrOpen ? t("qrCollapse") : t("qrExpand")}</span>
          </button>
          {isQrOpen && (
            <div id="share-modal-qr-panel" className="mt-3">
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant={qrTarget === "youtube" ? "filled" : "light"}
                  color="dark"
                  size="xs"
                  onClick={() => setQrTarget("youtube")}
                  aria-pressed={qrTarget === "youtube"}
                >
                  {t("youtubeUrl")}
                </Button>
                <Button
                  variant={qrTarget === "database" ? "filled" : "light"}
                  color="dark"
                  size="xs"
                  onClick={() => setQrTarget("database")}
                  aria-pressed={qrTarget === "database"}
                >
                  {siteConfig.siteName}
                </Button>
              </div>
              {hasCurrentSong && (
                <div className="flex justify-center rounded-md border border-light-gray-300 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
                  <div className="relative inline-flex">
                    <QRCodeSVG
                      value={qrValue}
                      size={220}
                      level="H"
                      role="img"
                      aria-label={t("qrAlt", {
                        target:
                          qrTarget === "youtube"
                            ? t("youtubeUrl")
                            : siteConfig.siteName,
                      })}
                      includeMargin
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-600 shadow-sm ring-1 ring-gray-200 dark:bg-gray-950 dark:ring-gray-700">
                        {qrTarget === "youtube" ? (
                          <FaYoutube className="h-7 w-7" />
                        ) : (
                          <img
                            src="/icon512_rounded.png"
                            alt=""
                            className="h-10 w-12 rounded-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
            {t("qrTrademark")}
          </p>
        </div>
        <Divider className="my-4" />
        <div className="flex justify-end">
          <Button variant="filled" color="dark" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
