import { Input, Modal } from "@mantine/core";
import { Button } from "flowbite-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import usePlaylists from "../hook/usePlaylists";

interface CreatePlaylistModalProps {
  onenModal: boolean;
  setOpenModal: (value: boolean) => void;
}

export default function CreatePlaylistModal({
  onenModal,
  setOpenModal,
}: CreatePlaylistModalProps) {
  const t = useTranslations("Watch.createPlaylistModal");
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // プレイリスト
  const { savePlaylist, isDuplicate } = usePlaylists();
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
            songs: [],
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
