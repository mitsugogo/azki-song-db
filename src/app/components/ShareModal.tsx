import { Song } from "../types/song";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Label,
} from "flowbite-react";
import { HiClipboardCopy } from "react-icons/hi";
import { FaDatabase, FaX, FaYoutube } from "react-icons/fa6";

// Propsの型定義
type ShareModalProps = {
  openShareModal: boolean;
  currentSongInfo: Song | null;
  baseUrl: string;
  showCopied: boolean;
  showCopiedYoutube: boolean;
  onClose: () => void;
  copyToClipboard: (text: string) => void;
  setShowCopied: (show: boolean) => void;
  setShowCopiedYoutube: (show: boolean) => void;
};

export default function ShareModal({
  openShareModal,
  currentSongInfo,
  baseUrl,
  showCopied,
  showCopiedYoutube,
  onClose,
  copyToClipboard,
  setShowCopied,
  setShowCopiedYoutube,
}: ShareModalProps) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;
  const databaseUrl = `${baseUrl}/?v=${currentSongInfo?.video_id}&t=${currentSongInfo?.start}s`;

  const handleCopyToClipboard = (
    textToCopy: string,
    setShowCopiedState: (show: boolean) => void
  ) => {
    copyToClipboard(textToCopy);
    setShowCopiedState(true);
    setTimeout(() => setShowCopiedState(false), 3000);
  };

  const handleShareToX = (isDatabaseUrl: boolean) => {
    const text = isDatabaseUrl
      ? `Now Playing♪ ${currentSongInfo?.title} - ${currentSongInfo?.artist} \n${currentSongInfo?.video_title} \n${databaseUrl}`
      : `${currentSongInfo?.video_title} \n${youtubeUrl}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`);
  };

  return (
    <Modal show={openShareModal} onClose={onClose} size="md">
      <ModalHeader className="bg-white dark:bg-gray-800 dark:text-white border-b-gray-300">
        シェア
      </ModalHeader>
      <ModalBody className="bg-white dark:bg-gray-800 dark:text-white">
        <p className="mb-4">AZKiさんの素敵な歌声をシェアしましょう！</p>
        {/* YouTube URL */}
        <div>
          <Label>
            <FaYoutube className="inline" />
            &nbsp;YouTube URL
          </Label>
          <div className="relative">
            <TextInput
              className="w-full"
              value={youtubeUrl}
              readOnly
              onClick={() =>
                handleCopyToClipboard(youtubeUrl, setShowCopiedYoutube)
              }
            />
            <button
              className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() =>
                handleCopyToClipboard(youtubeUrl, setShowCopiedYoutube)
              }
            >
              <HiClipboardCopy className="w-4 h-4" />
            </button>
            {showCopiedYoutube && (
              <div className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full text-white bg-gray-900 dark:bg-gray-800 text-sm font-bold">
                copied!
              </div>
            )}
          </div>
          <div className="mt-2">
            <Button
              size="xs"
              className="bg-black text-white dark:bg-black dark:text-white dark:hover:bg-gray-900 cursor-pointer"
              onClick={() => handleShareToX(false)}
            >
              <FaX className="w-4 h-4" />
            </Button>
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
              className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleCopyToClipboard(databaseUrl, setShowCopied)}
            >
              <HiClipboardCopy className="w-4 h-4" />
            </button>
            {showCopied && (
              <div className="absolute right-3 bottom-0 transform -translate-y-1/2 p-1 rounded-full text-white bg-gray-900 dark:bg-gray-800 text-sm font-bold">
                copied!
              </div>
            )}
          </div>
          <div className="mt-2">
            <Button
              size="xs"
              className="bg-black text-white dark:bg-black dark:text-white dark:hover:bg-gray-900 cursor-pointer"
              onClick={() => handleShareToX(true)}
            >
              <FaX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="bg-white dark:bg-gray-800 dark:text-white">
        <Button
          className="bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white transition text-sm cursor-pointer"
          onClick={onClose}
        >
          閉じる
        </Button>
      </ModalFooter>
    </Modal>
  );
}
