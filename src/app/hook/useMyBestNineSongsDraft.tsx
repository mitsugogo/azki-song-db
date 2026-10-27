import { useLocalStorage } from "@mantine/hooks";
import { MyBestNineSongs } from "./useMyBestNineSongs";
import { useEffect, useState } from "react";

/**
 * 「好きな曲9選」の編集中ドラフトを localStorage で管理
 */
const useMyBestNineSongsDraft = () => {
  const [isReady, setIsReady] = useState(false);
  const [draft, setDraft] = useLocalStorage<MyBestNineSongs>({
    key: "my-best-9-songs-draft",
    defaultValue: {
      title: "",
      author: undefined,
      songs: [],
    },
  });

  // useLocalStorage の初回 effect が保存値を読み込んでから復元する。
  useEffect(() => setIsReady(true), []);

  return {
    draft,
    isReady,
    saveDraft: setDraft,
    clearDraft: () =>
      setDraft({
        title: "",
        author: undefined,
        songs: [],
      }),
  };
};

export default useMyBestNineSongsDraft;
