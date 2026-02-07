import { Input, Modal } from "@mantine/core";
import { Button } from "flowbite-react";
import { useState } from "react";
import usePlaylists from "../hook/usePlaylists";

interface CreatePlaylistModalProps {
  onenModal: boolean;
  setOpenModal: (value: boolean) => void;
}

export default function CreatePlaylistModal({
  onenModal,
  setOpenModal,
}: CreatePlaylistModalProps) {
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // プレイリスト
  const { savePlaylist, isDuplicate } = usePlaylists();
  return (
    <Modal
      opened={onenModal}
      onClose={() => setOpenModal(false)}
      title="新規プレイリストを作成"
      centered
    >
      <Input.Wrapper label="プレイリスト名" required withAsterisk>
        <Input
          placeholder="プレイリスト名を入力..."
          value={newPlaylistName}
          onChange={(event) =>
            setNewPlaylistName(event.target.value.substring(0, 200))
          }
          maxLength={200}
          required
        />
      </Input.Wrapper>
      {isDuplicate(newPlaylistName) && (
        <p className="text-red-500 text-xs">
          同じ名前のプレイリストは作成できません
        </p>
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
        作成
      </Button>
    </Modal>
  );
}
