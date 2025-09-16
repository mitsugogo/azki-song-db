import { Song } from "../types/song";
import { Modal, TextInput, Button, Divider } from "@mantine/core";
import { HiClipboardCopy } from "react-icons/hi";
import { FaDatabase, FaShare, FaX, FaYoutube } from "react-icons/fa6";
import { Label } from "flowbite-react";
import { useState } from "react";

// Propsの型定義
type ShareModalProps = {
  openShareModal: boolean;
  currentSongInfo: Song | null;
  baseUrl: string;
  onClose: () => void;
};

export default function ShareModal({
  openShareModal,
  currentSongInfo,
  baseUrl,
  onClose,
}: ShareModalProps) {
  const [showCopiedYoutube, setShowCopiedYoutube] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const youtubeUrl = `https://www.youtube.com/watch?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;
  const databaseUrl = `${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;

  const handleShareToX = (isDatabaseUrl: boolean) => {
    const text = isDatabaseUrl
      ? `♪${currentSongInfo?.title} / ${currentSongInfo?.artist} \n${currentSongInfo?.video_title} \n${databaseUrl}`
      : `${currentSongInfo?.video_title} \n${youtubeUrl}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`);
  };

  const handleCopyToClipboard = (
    textToCopy: string,
    setShowCopiedState: (show: boolean) => void
  ) => {
    navigator.clipboard.writeText(textToCopy);
    setShowCopiedState(true);
    setTimeout(() => setShowCopiedState(false), 3000);
  };

  return (
    <Modal
      opened={openShareModal}
      onClose={onClose}
      title="シェア"
      overlayProps={{ opacity: 0.5, blur: 4 }}
    >
      <div className="">
        <p className="mb-4">AZKiさんの素敵な歌声をシェアしましょう！</p>
        {/* YouTube URL */}
        <div>
          <Label>
            <FaYoutube className="inline" />
            &nbsp;YouTube URL
          </Label>
          <div className="relative">
            <TextInput className="w-full" value={youtubeUrl} readOnly />
            <button
              className="absolute right-3 bottom-[-5px] transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() =>
                handleCopyToClipboard(youtubeUrl, setShowCopiedYoutube)
              }
            >
              <HiClipboardCopy className="w-4 h-4" />
            </button>
            {showCopiedYoutube && (
              <div className="absolute right-3 bottom-[-8px] transform -translate-y-1/2 p-1 rounded-full text-white bg-gray-900 dark:bg-gray-800 text-sm font-bold">
                copied!
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
                <FaX className="w-4 h-4" />
              </Button>
              <Button
                variant="filled"
                color="dark"
                size="xs"
                onClick={() => {
                  const shareData = {
                    title: currentSongInfo?.video_title,
                    text: currentSongInfo?.video_title,
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
          <Label>
            <FaDatabase className="inline" />
            &nbsp;AZKi Song Database
          </Label>
          <div className="relative">
            <TextInput
              className="w-full"
              value={databaseUrl}
              readOnly
              onClick={() => handleCopyToClipboard(databaseUrl, setShowCopied)}
            />
            <button
              className="absolute right-3 bottom-[-5px] transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleCopyToClipboard(databaseUrl, setShowCopied)}
            >
              <HiClipboardCopy className="w-4 h-4" />
            </button>
            {showCopied && (
              <div className="absolute right-3 bottom-[-8px] transform -translate-y-1/2 p-1 rounded-full text-white bg-gray-900 dark:bg-gray-800 text-sm font-bold">
                copied!
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
              <FaX className="w-4 h-4" />
            </Button>
            <Button
              variant="filled"
              color="dark"
              size="xs"
              onClick={() => {
                const shareData = {
                  title: `${currentSongInfo?.title} - ${currentSongInfo?.artist}`,
                  text: `${currentSongInfo?.title} - ${currentSongInfo?.artist}`,
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
        <div className="flex justify-end">
          <Button variant="filled" color="dark" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Modal>
  );
}
