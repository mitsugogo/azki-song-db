"use client";

import { Button, Table } from "@mantine/core";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import useSongs from "@/app/hook/useSongs";
import { encodePlaylistUrlParam, type Playlist } from "@/app/lib/playlistUrl";
import { pageClasses } from "@/app/theme";

export default function SharedPlaylistClient({
  playlist,
}: {
  playlist: Playlist;
}) {
  const t = useTranslations("Playlist.shared");
  const { allSongs } = useSongs();
  const rows = playlist.songs.map((entry) => ({
    entry,
    song: allSongs.find(
      (song) =>
        song.video_id === entry.videoId &&
        String(song.start) === String(entry.start),
    ),
  }));

  return (
    <div className={pageClasses.shellFlushBottom}>
      <h1 className={pageClasses.heading}>{playlist.name}</h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">
        {t("songCount", { count: playlist.songs.length })}
      </p>
      <Button
        component={Link}
        href={{
          pathname: "/",
          query: { playlist: encodePlaylistUrlParam(playlist) },
        }}
        color="pink"
        className="mb-5"
      >
        {t("play")}
      </Button>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>{t("song")}</Table.Th>
            <Table.Th>{t("artist")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map(({ entry, song }, index) => (
            <Table.Tr key={`${entry.videoId}-${entry.start}`}>
              <Table.Td>{index + 1}</Table.Td>
              <Table.Td>{song?.title ?? entry.videoId}</Table.Td>
              <Table.Td>{song?.artist ?? "-"}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
