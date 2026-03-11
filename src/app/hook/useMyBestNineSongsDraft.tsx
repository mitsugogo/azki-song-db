import { useLocalStorage } from "@mantine/hooks";
import { MyBestNineSongs } from "./useMyBestNineSongs";

/**
 * 「好きな曲9選」の編集中ドラフトを localStorage で管理
 */
const useMyBestNineSongsDraft = () => {
  const [draft, setDraft] = useLocalStorage<MyBestNineSongs>({
    key: "my-best-9-songs-draft",
    defaultValue: {
      title: "",
      author: undefined,
      songs: [],
    },
  });

  return {
    draft,
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
