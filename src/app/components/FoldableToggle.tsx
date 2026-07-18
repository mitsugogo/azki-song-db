import { useEffect, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import { FaLaptop } from "react-icons/fa6";
import { BsSquareHalf } from "react-icons/bs";
import { useTranslations } from "next-intl";

// 折りたたみモードの状態の型
type FoldableMode = "default" | "foldable";

type FoldableToggleProps = {
  floating?: boolean;
  forceVisible?: boolean;
};

const FoldableToggle = ({
  floating = false,
  forceVisible = false,
}: FoldableToggleProps) => {
  const t = useTranslations("FoldableToggle");
  const [supportsDevicePosture, setSupportsDevicePosture] = useState(true);
  // 'foldable-mode'というキーでlocalStorageに保存される状態を定義
  // デフォルト値は 'default'
  const [foldableMode, setFoldableMode] = useLocalStorage<FoldableMode>({
    key: "foldable-mode",
    defaultValue: "default",
  });

  useEffect(() => {
    setSupportsDevicePosture(Boolean(navigator.devicePosture));
  }, []);

  const handleClick = () => {
    // トグル処理: default -> foldable -> default
    setFoldableMode((currentMode) =>
      currentMode === "default" ? "foldable" : "default",
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

  if (supportsDevicePosture && !forceVisible) return null;

  const label = floating
    ? t("exit")
    : foldableMode === "foldable"
      ? t("on")
      : t("off");

  return (
    <button
      type="button"
      className={
        floating
          ? "fixed right-4 bottom-4 z-[100] flex cursor-pointer items-center gap-2 rounded-full border border-white/30 bg-gray-900/90 px-4 py-2 text-white shadow-lg outline-none hover:bg-gray-800"
          : "outline-none cursor-pointer ml-2 hover:bg-primary-600 dark:hover:bg-primary-900/50 p-2 rounded-md"
      }
      onClick={handleClick}
      title={label}
      aria-label={label}
      data-testid={floating ? "floating-foldable-toggle" : undefined}
    >
      {getFoldableIcon()}
      {floating && <span className="text-sm font-semibold">{label}</span>}
    </button>
  );
};

export default FoldableToggle;
