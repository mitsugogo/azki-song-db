import { useEffect } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { FaLaptop } from "react-icons/fa6";
import { BsSquareHalf } from "react-icons/bs";

// 折りたたみモードの状態の型
type FoldableMode = "default" | "foldable";

const FoldableToggle = () => {
  // 'foldable-mode'というキーでlocalStorageに保存される状態を定義
  // デフォルト値は 'default'
  const [foldableMode, setFoldableMode] = useLocalStorage<FoldableMode>({
    key: "foldable-mode",
    defaultValue: "default",
  });

  // foldableModeに応じて <html> タグに 'foldable' クラスを適用/削除
  useEffect(() => {
    if (foldableMode === "foldable") {
      document.documentElement.classList.add("foldable");
    } else {
      document.documentElement.classList.remove("foldable");
    }
  }, [foldableMode]);

  const handleClick = () => {
    // トグル処理: default -> foldable -> default
    setFoldableMode((currentMode) =>
      currentMode === "default" ? "foldable" : "default"
    );
  };

  const getFoldableIcon = () => {
    // 現在のモードに応じたアイコンを返す
    if (foldableMode === "foldable") {
      // 折りたたみモード
      return <BsSquareHalf />;
    }
    // デフォルトモード
    return <FaLaptop />;
  };

  return (
    <button
      type="button"
      className="outline-none cursor-pointer ml-2 hover:bg-primary-600 dark:hover:bg-primary-800 p-2 rounded-md"
      onClick={handleClick}
      title={
        foldableMode === "foldable"
          ? "折りたたみモード: ON"
          : "折りたたみモード: OFF"
      }
    >
      {getFoldableIcon()}
    </button>
  );
};

export default FoldableToggle;
