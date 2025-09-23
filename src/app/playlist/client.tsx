"use client";

import { useEffect, useState } from "react";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import { MdPlaylistAdd } from "react-icons/md";
import {
  Anchor,
  Breadcrumbs,
  Button,
  Checkbox,
  CopyButton,
  Notification,
  Table,
} from "@mantine/core";
import usePlaylists from "../hook/usePlaylists";
import Link from "next/link";
import { FaCheck, FaPlay } from "react-icons/fa6";

export default function PlaylistPage() {
  const [openCreatePlaylistModal, setOpenCreatePlaylistModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Modal
  const [showDeletePlaylistToast, setShowDeletePlaylistToast] = useState(false);
  const [showCopylinkToast, setShowCopylinkToast] = useState(false);

  // showになってから3秒たったらトーストを消す
  useEffect(() => {
    if (showDeletePlaylistToast) {
      setTimeout(() => {
        setShowDeletePlaylistToast(false);
      }, 3000);
    }
  }, [showDeletePlaylistToast]);

  useEffect(() => {
    if (showCopylinkToast) {
      setTimeout(() => {
        setShowCopylinkToast(false);
      }, 3000);
    }
  }, [showCopylinkToast]);

  const { playlists, deletePlaylist, encodePlaylistUrlParam, getMaxLimit } =
    usePlaylists();

  const breadcrumbs = [{ title: "プレイリスト", href: "/playlist" }].map(
    (item, index) => (
      <Anchor href={item.href} key={index} underline="hover" c="pink" size="sm">
        {item.title}
      </Anchor>
    )
  );

  return (
    <div className="flex-grow p-2 pt-5 lg:p-6 lg:pb-0">
      <Breadcrumbs>{breadcrumbs}</Breadcrumbs>

      <h1 className="font-extrabold text-2xl p-3">プレイリストの管理</h1>

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
          新規プレイリスト作成
        </Button>
        <Button
          color="red"
          className="mt-3 lg:mt-0 lg:ml-3"
          disabled={selectedRows.length === 0}
          onClick={() => {
            if (
              !confirm(
                `選択した${selectedRows.length}個のプレイリストを削除します。よろしいですか?`
              )
            ) {
              return;
            }
            selectedRows.forEach((id) => {
              const playlist = playlists.find((p) => p.id === id);
              if (!playlist) return;
              deletePlaylist(playlist);
            });
            setSelectedRows([]);
          }}
        >
          選択したプレイリストを削除
        </Button>
      </div>

      {/* モバイル用カードリスト（デフォルト表示） */}
      <div className="mt-6 p-2 space-y-4 lg:hidden">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="p-4 border border-gray-200 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  aria-label="Select playlist"
                  checked={selectedRows.includes(playlist.id || "")}
                  onChange={(event) =>
                    setSelectedRows(
                      event.currentTarget.checked
                        ? [...selectedRows, playlist.id || ""]
                        : selectedRows.filter(
                            (position) => position !== playlist.id
                          )
                    )
                  }
                />
                <Link
                  href={`/playlist/detail?id=${playlist.id}`}
                  className="ml-3 font-semibold text-lg hover:underline"
                >
                  {playlist.name}
                </Link>
              </div>
              <Link
                href={`/?playlist=${encodePlaylistUrlParam(playlist)}`}
                className="text-primary hover:text-primary-600 dark:hover:text-primary-500"
              >
                <FaPlay size={20} />
              </Link>
            </div>
            <div className="mt-2 text-sm text-gray-300">
              <p>
                曲数: {playlist.songs.length} / {getMaxLimit()}
              </p>
              <p>
                更新日:{" "}
                {new Date(playlist.updatedAt as string).toLocaleString()}
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              {playlist.songs.length > 0 && (
                <CopyButton
                  value={
                    window.location.origin +
                    "?playlist=" +
                    encodePlaylistUrlParam(playlist)
                  }
                  timeout={3000}
                >
                  {({ copied, copy }) => (
                    <Button
                      size="xs"
                      variant="outline"
                      color={copied ? "teal" : "blue"}
                      onClick={() => {
                        copy();
                        setShowCopylinkToast(true);
                      }}
                    >
                      {copied ? "コピーしました" : "共有用URLコピー"}
                    </Button>
                  )}
                </CopyButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* デスクトップ用テーブル（モバイルでは非表示） */}
      <div className="hidden lg:block w-full">
        <Table striped highlightOnHover withColumnBorders className="mt-6">
          <Table.Thead>
            <Table.Tr>
              <Table.Th></Table.Th>
              <Table.Th>再生</Table.Th>
              <Table.Th>#</Table.Th>
              <Table.Th>プレイリスト名</Table.Th>
              <Table.Th>曲数</Table.Th>
              <Table.Th>作成日</Table.Th>
              <Table.Th>最終更新</Table.Th>
              <Table.Th>共有URL</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {playlists.map((playlist) => (
              <Table.Tr
                key={playlist.id}
                bg={`${
                  selectedRows.includes(playlist.id || "")
                    ? "var(--mantine-color-blue-light)"
                    : ""
                }`}
              >
                <Table.Td>
                  <Checkbox
                    aria-label="Select row"
                    checked={selectedRows.includes(playlist.id || "")}
                    onChange={(event) =>
                      setSelectedRows(
                        event.currentTarget.checked
                          ? [...selectedRows, playlist.id || ""]
                          : selectedRows.filter(
                              (position) => position !== playlist.id
                            )
                      )
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <Link
                    href={`/?playlist=${encodePlaylistUrlParam(playlist)}`}
                    className="text-primary hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-500 hover:underline"
                  >
                    <Button size="xs" color="gray" radius={"sm"}>
                      <FaPlay className="mr-1" />
                      再生
                    </Button>
                  </Link>
                </Table.Td>
                <Table.Td>
                  <Link
                    href={`/playlist/detail?id=${playlist.id}`}
                    className="text-primary hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-500 hover:underline"
                  >
                    {playlist.id}
                  </Link>
                </Table.Td>
                <Table.Td className="font-semibold">
                  <Link
                    href={`/playlist/detail?id=${playlist.id}`}
                    className="text-primary hover:text-primary-600 dark:text-primary-600 dark:hover:text-primary-500 hover:underline"
                  >
                    {playlist.name}
                  </Link>
                </Table.Td>
                <Table.Td>
                  {playlist.songs.length} / {getMaxLimit()}
                </Table.Td>
                <Table.Td>
                  {new Date(playlist.createdAt as string).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  {new Date(playlist.updatedAt as string).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  {playlist.songs.length > 0 && (
                    <CopyButton
                      value={
                        window.location.origin +
                        "?playlist=" +
                        encodePlaylistUrlParam(playlist)
                      }
                      timeout={3000}
                    >
                      {({ copied, copy }) => (
                        <Button
                          variant="outline"
                          size="xs"
                          color={copied ? "teal" : "blue"}
                          onClick={() => {
                            copy();
                            setShowCopylinkToast(true);
                          }}
                        >
                          {copied ? "コピーしました" : "共有用URLコピー"}
                        </Button>
                      )}
                    </CopyButton>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      {showDeletePlaylistToast && (
        <div className="fixed top-[80px] right-4">
          <Notification
            title="プレイリストを削除しました"
            icon={<FaCheck />}
            color="green"
            onClose={() => setShowDeletePlaylistToast(false)}
            withCloseButton
          />
        </div>
      )}

      {showCopylinkToast && (
        <div className="fixed top-[80px] right-4">
          <Notification
            title="共有用URLをコピーしました"
            icon={<FaCheck />}
            color="green"
            onClose={() => setShowCopylinkToast(false)}
            withCloseButton
          />
        </div>
      )}
    </div>
  );
}
