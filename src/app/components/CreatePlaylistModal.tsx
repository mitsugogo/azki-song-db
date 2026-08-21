import { Button, Input, Modal } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { PlaylistEntry } from "@/app/lib/playlistUrl";
import usePlaylists from "../hook/usePlaylists";

interface CreatePlaylistModalProps {
  onenModal: boolean;
  setOpenModal: (value: boolean) => void;
  initialName?: string;
  initialSongs?: PlaylistEntry[];
}

const EMPTY_SONGS: PlaylistEntry[] = [];

export default function CreatePlaylistModal({
  onenModal,
  setOpenModal,
  initialName = "",
  initialSongs = EMPTY_SONGS,
}: CreatePlaylistModalProps) {
  const t = useTranslations("Watch.createPlaylistModal");
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // プレイリスト
  const { savePlaylist, isDuplicate } = usePlaylists();
  useEffect(() => {
    if (onenModal) {
      setNewPlaylistName(initialName.slice(0, 200));
    }
  }, [initialName, onenModal]);

  useEffect(() => {
    const resume = (event: Event) => {
      if (
        (event as CustomEvent<{ type?: string }>).detail?.type ===
        "create-playlist"
      ) {
        setOpenModal(true);
      }
    };
    window.addEventListener("azki-library-action", resume);
    return () => window.removeEventListener("azki-library-action", resume);
  }, [setOpenModal]);
  return (
    <Modal
      opened={onenModal}
      onClose={() => setOpenModal(false)}
      title={t("title")}
      centered
    >
      <Input.Wrapper label={t("name")} required withAsterisk>
        <Input
          placeholder={t("placeholder")}
          value={newPlaylistName}
          onChange={(event) =>
            setNewPlaylistName(event.target.value.substring(0, 200))
          }
          maxLength={200}
          required
        />
      </Input.Wrapper>
      {isDuplicate(newPlaylistName) && (
        <p className="text-red-500 text-xs">{t("duplicate")}</p>
      )}
      <Button
        className="mt-4"
        disabled={!newPlaylistName || isDuplicate(newPlaylistName)}
        onClick={() => {
          savePlaylist({
            name: newPlaylistName,
            songs: initialSongs.map((song) => ({ ...song })),
          });
          setNewPlaylistName("");
          setOpenModal(false);
        }}
      >
        {t("create")}
      </Button>
    </Modal>
  );
}
