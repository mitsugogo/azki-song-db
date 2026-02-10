import { useState, useEffect } from "react";
import { getGridCols } from "../utils/gridHelpers";

/**
 * ウィンドウサイズに応じてグリッドの列数を管理するカスタムフック
 */
export function useGridCols() {
  const [gridCols, setGridCols] = useState(getGridCols());

  useEffect(() => {
    const handleResize = () => {
      setGridCols(getGridCols());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return gridCols;
}
