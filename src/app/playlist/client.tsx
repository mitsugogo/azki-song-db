"use client";

import { useState } from "react";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import { MdPlaylistAdd } from "react-icons/md";
import {
  Breadcrumbs,
  Button,
  Checkbox,
  CopyButton,
  Select,
  Table,
} from "@mantine/core";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses, pageClasses } from "../theme";
import usePlaylists from "../hook/usePlaylists";
import useFavorites from "../hook/useFavorites";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { FaCheck, FaPlay, FaStar } from "react-icons/fa6";
import { showAppNotification } from "@/app/lib/notifications";
import SignedInOnly from "../components/SignedInOnly";

export default function PlaylistPage() {
  return (
    <SignedInOnly>
      <PlaylistPageContent />
    </SignedInOnly>
  );
}

function PlaylistPageContent() {
  const t = useTranslations("Playlist");
  const g = useTranslations("DrawerMenu");

  const locale = useLocale();

  const buildShareUrl = (playlistId: string) => {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    return (
      (typeof window !== "undefined" ? window.location.origin : "") +
      `${prefix}/playlist/shared/${encodeURIComponent(playlistId)}`
    );
  };

  const [openCreatePlaylistModal, setOpenCreatePlaylistModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const {
    playlists,
    deletePlaylist,
    updatePlaylist,
    encodePlaylistUrlParam,
    getMaxLimit,
  } = usePlaylists();

  const { favorites } = useFavorites();

  // お気に入りを仮想プレイリストとして作成
  const favoritesPlaylist = {
    id: "system-favorites",
    name: t("favoritesName"),
    songs: favorites,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visibility: "PRIVATE" as const,
  };

  // お気に入りを最上段に配置
  const allPlaylists =
    favorites.length > 0 ? [favoritesPlaylist, ...playlists] : playlists;

  // Mantine Breadcrumbs を利用

  return (
    <div className={pageClasses.shellFlushBottom}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {g("home")}
        </Link>
        <Link href="/playlist" className={breadcrumbClasses.link}>
          {t("title")}
        </Link>
      </Breadcrumbs>

      <h1 className={pageClasses.heading}>{t("manageTitle")}</h1>

      <CreatePlaylistModal
        onenModal={openCreatePlaylistModal}
        setOpenModal={setOpenCreatePlaylistModal}
      />

      <div className="flex flex-col lg:flex-row">
        <Button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setOpenCreatePlaylistModal(true)}
          leftSection={<MdPlaylistAdd className="w-6 h-6" />}
        >
          {t("createNew")}
        </Button>
        <Button
          color="red"
          className="mt-3 lg:mt-0 lg:ml-3"
          disabled={selectedRows.length === 0}
          onClick={() => {
            if (!confirm(t("confirmDelete", { count: selectedRows.length }))) {
              return;
            }
            selectedRows.forEach((id) => {
              const playlist = playlists.find((p) => p.id === id);
              if (!playlist) return;
              deletePlaylist(playlist);
            });
            setSelectedRows([]);
            showAppNotification({
              title: t("deletedTitle"),
              message: t("deletedTitle"),
              type: "success",
              icon: <FaCheck />,
            });
          }}
        >
          {t("deleteSelected")}
        </Button>
      </div>

      {/* モバイル用カードリスト（デフォルト表示） */}
      <div className="mt-6 space-y-4 lg:hidden">
        {allPlaylists.map((playlist) => {
          const isFavorites = playlist.id === "system-favorites";
          return (
            <div
              key={playlist.id}
              className={`p-4 border rounded-lg shadow-md ${
                isFavorites
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {!isFavorites && (
                    <Checkbox
                      aria-label={t("aria.selectPlaylist")}
                      checked={selectedRows.includes(playlist.id || "")}
                      onChange={(event) =>
                        setSelectedRows(
                          event.currentTarget.checked
                            ? [...selectedRows, playlist.id || ""]
                            : selectedRows.filter(
                                (position) => position !== playlist.id,
                              ),
                        )
                      }
                    />
                  )}
                  {isFavorites ? (
                    <Link
                      href={`/playlist/detail?id=system-favorites`}
                      className="flex items-center hover:underline"
                    >
                      <FaStar className="text-yellow-500 mr-2" size={20} />
                      <span className="font-semibold text-lg">
                        {playlist.name}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href={`/playlist/detail?id=${playlist.id}`}
                      className="ml-3 font-semibold text-lg hover:underline"
                    >
                      {playlist.name}
                    </Link>
                  )}
                </div>
                <Link
                  href={{
                    pathname: "/",
                    query: { playlist: encodePlaylistUrlParam(playlist) },
                  }}
                  className="text-primary hover:text-primary-600 dark:hover:text-primary-500"
                >
                  <FaPlay size={20} />
                </Link>
              </div>
              <div className="mt-2 text-sm text-gray-300">
                <p>
                  {t("songsLabel")} {playlist.songs.length}
                  {!isFavorites && ` / ${getMaxLimit()}`}
                </p>
                {!isFavorites && (
                  <p>
                    {t("updatedLabel")}{" "}
                    {new Date(playlist.updatedAt as string).toLocaleString()}
                  </p>
                )}
              </div>
              {!isFavorites && (
                <div className="mt-4 flex flex-col items-end gap-2">
                  <Select
                    aria-label={t("visibility.label")}
                    size="xs"
                    value={playlist.visibility ?? "PRIVATE"}
                    data={[
                      { value: "PUBLIC", label: t("visibility.public") },
                      { value: "UNLISTED", label: t("visibility.unlisted") },
                      { value: "PRIVATE", label: t("visibility.private") },
                    ]}
                    onChange={(visibility) => {
                      if (visibility)
                        updatePlaylist({
                          ...playlist,
                          visibility: visibility as
                            "PUBLIC" | "UNLISTED" | "PRIVATE",
                        });
                    }}
                  />
                  {playlist.songs.length > 0 &&
                    playlist.visibility !== "PRIVATE" &&
                    playlist.id && (
                      <CopyButton
                        value={buildShareUrl(playlist.id)}
                        timeout={3000}
                      >
                        {({ copied, copy }) => (
                          <Button
                            size="xs"
                            variant="outline"
                            color={copied ? "teal" : "blue"}
                            onClick={() => {
                              copy();
                              showAppNotification({
                                title: t("urlCopiedTitle"),
                                message: t("urlCopiedTitle"),
                                type: "success",
                                icon: <FaCheck />,
                              });
                            }}
                          >
                            {copied ? t("copied") : t("copyUrl")}
                          </Button>
                        )}
                      </CopyButton>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* デスクトップ用テーブル（モバイルでは非表示） */}
      <div className="hidden lg:block w-full">
        <Table striped highlightOnHover withColumnBorders className="mt-6">
          <Table.Thead>
            <Table.Tr>
              <Table.Th></Table.Th>
              <Table.Th>{t("head.play")}</Table.Th>
              <Table.Th>{t("head.index")}</Table.Th>
              <Table.Th>{t("head.name")}</Table.Th>
              <Table.Th>{t("head.songs")}</Table.Th>
              <Table.Th>{t("head.createdAt")}</Table.Th>
              <Table.Th>{t("head.updatedAt")}</Table.Th>
              <Table.Th>{t("head.shareUrl")}</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {allPlaylists.map((playlist) => {
              const isFavorites = playlist.id === "system-favorites";
              return (
                <Table.Tr
                  key={playlist.id}
                  bg={`${
                    isFavorites
                      ? "var(--mantine-color-yellow-light)"
                      : selectedRows.includes(playlist.id || "")
                        ? "var(--mantine-color-blue-light)"
                        : ""
                  }`}
                >
                  <Table.Td>
                    {!isFavorites && (
                      <Checkbox
                        aria-label={t("aria.selectRow")}
                        checked={selectedRows.includes(playlist.id || "")}
                        onChange={(event) =>
                          setSelectedRows(
                            event.currentTarget.checked
                              ? [...selectedRows, playlist.id || ""]
                              : selectedRows.filter(
                                  (position) => position !== playlist.id,
                                ),
                          )
                        }
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Link
                      href={{
                        pathname: "/",
                        query: { playlist: encodePlaylistUrlParam(playlist) },
                      }}
                      className="text-primary hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-500 hover:underline"
                    >
                      <Button size="xs" color="gray" radius={"sm"}>
                        <FaPlay className="mr-1" />
                        {t("head.play")}
                      </Button>
                    </Link>
                  </Table.Td>
                  <Table.Td>
                    {isFavorites ? (
                      <Link
                        href={`/playlist/detail?id=system-favorites`}
                        className="text-yellow-500 hover:text-yellow-600 hover:underline"
                      >
                        <FaStar className="inline" />
                      </Link>
                    ) : (
                      <Link
                        href={`/playlist/detail?id=${playlist.id}`}
                        className="text-primary hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-500 hover:underline"
                      >
                        {playlist.id}
                      </Link>
                    )}
                  </Table.Td>
                  <Table.Td className="font-semibold">
                    {isFavorites ? (
                      <Link
                        href={`/playlist/detail?id=system-favorites`}
                        className="flex items-center gap-2 text-primary hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-500 hover:underline"
                      >
                        <FaStar className="text-yellow-500" />
                        {playlist.name}
                      </Link>
                    ) : (
                      <Link
                        href={`/playlist/detail?id=${playlist.id}`}
                        className="text-primary hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-500 hover:underline"
                      >
                        {playlist.name}
                      </Link>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {playlist.songs.length}
                    {!isFavorites && ` / ${getMaxLimit()}`}
                  </Table.Td>
                  <Table.Td>
                    {!isFavorites &&
                      new Date(playlist.createdAt as string).toLocaleString()}
                  </Table.Td>
                  <Table.Td>
                    {!isFavorites &&
                      new Date(playlist.updatedAt as string).toLocaleString()}
                  </Table.Td>
                  <Table.Td>
                    {!isFavorites && (
                      <div className="flex min-w-44 flex-col gap-2">
                        <Select
                          aria-label={t("visibility.label")}
                          size="xs"
                          value={playlist.visibility ?? "PRIVATE"}
                          data={[
                            { value: "PUBLIC", label: t("visibility.public") },
                            {
                              value: "UNLISTED",
                              label: t("visibility.unlisted"),
                            },
                            {
                              value: "PRIVATE",
                              label: t("visibility.private"),
                            },
                          ]}
                          onChange={(visibility) => {
                            if (visibility)
                              updatePlaylist({
                                ...playlist,
                                visibility: visibility as
                                  "PUBLIC" | "UNLISTED" | "PRIVATE",
                              });
                          }}
                        />
                        {playlist.songs.length > 0 &&
                          playlist.visibility !== "PRIVATE" &&
                          playlist.id && (
                            <CopyButton
                              value={buildShareUrl(playlist.id)}
                              timeout={3000}
                            >
                              {({ copied, copy }) => (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  color={copied ? "teal" : "blue"}
                                  onClick={() => {
                                    copy();
                                    showAppNotification({
                                      title: t("urlCopiedTitle"),
                                      message: t("urlCopiedTitle"),
                                      type: "success",
                                      icon: <FaCheck />,
                                    });
                                  }}
                                >
                                  {copied ? t("copied") : t("copyUrl")}
                                </Button>
                              )}
                            </CopyButton>
                          )}
                      </div>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
