import { Button, ToggleSwitch } from "flowbite-react";
import { useState, useRef, useEffect } from "react";
import { FaShare } from "react-icons/fa6";

interface PlayerSettingPropps {
  hideFutureSongs: boolean;
  setHideFutureSongs: (value: boolean) => void;
  setOpenShereModal: (value: boolean) => void;
}

export default function PlayerSettings({
  hideFutureSongs,
  setHideFutureSongs,
  setOpenShereModal,
}: PlayerSettingPropps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // 外部クリックを検出するロジック
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    }

    // イベントリスナーを追加
    document.addEventListener("mousedown", handleClickOutside);

    // クリーンアップ関数を返す
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsRef]);

  return (
    <div
      className="inline-grid relative text-right grid-cols-1 md:grid-cols-2 gap-1"
      ref={settingsRef}
    >
      <Button
        onClick={() => setOpenShereModal(true)}
        className="hidden md:inline-flex w-10 h-10 items-center justify-center p-2 text-sm font-medium text-center cursor-pointer text-gray-900 bg-white rounded-full hover:bg-gray-100 focus:ring-0 focus:outline-none dark:text-white dark:bg-gray-900 hover:dark:bg-gray-800"
      >
        <div className="inline-block w-5 h-5">
          <FaShare className="relative top-1 left-1" />
        </div>
      </Button>
      <Button
        className="text-baseline inline-flex w-10 h-10 items-center p-2 text-sm font-medium text-center cursor-pointer rounded-full text-gray-900 bg-white hover:bg-gray-100 focus:ring-0 focus:outline-none dark:text-white dark:bg-gray-900 hover:dark:bg-gray-800"
        type="button"
        onClick={(event) => {
          setIsSettingsOpen(!isSettingsOpen);
        }}
      >
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 3"
        >
          <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
      </Button>
      {isSettingsOpen && (
        <div className="absolute bottom-10 right-0 z-50 bg-white divide-y divide-gray-100 rounded-lg shadow-md w-80 dark:bg-gray-700 dark:divide-gray-600 text-left">
          <ul className="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200">
            <li>
              <div className="flex p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                <ToggleSwitch
                  checked={hideFutureSongs}
                  onChange={setHideFutureSongs}
                  label="セトリネタバレ防止モード"
                  className=""
                />
              </div>
            </li>
          </ul>
          <div className="py-2">
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
              onClick={() => setOpenShereModal(true)}
            >
              <FaShare className="inline mr-2" />
              現在の楽曲をシェア
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
