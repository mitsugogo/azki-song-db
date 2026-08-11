"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscographyViewMode } from "../components/DiscographyControls";

export const DISCOGRAPHY_VIEW_MODE_STORAGE_KEY = "azki-discography:view-mode";

function isDiscographyViewMode(
  value: string | null,
): value is DiscographyViewMode {
  return value === "tile" || value === "list" || value === "originalMv";
}

export function usePersistedDiscographyViewMode(allowOriginalMv: boolean) {
  const [viewMode, setViewMode] = useState<DiscographyViewMode>("tile");

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem(
        DISCOGRAPHY_VIEW_MODE_STORAGE_KEY,
      );
      const restoredMode = isDiscographyViewMode(storedMode)
        ? storedMode
        : "tile";

      setViewMode(
        restoredMode === "originalMv" && !allowOriginalMv
          ? "tile"
          : restoredMode,
      );
    } catch {
      setViewMode("tile");
    }
  }, [allowOriginalMv]);

  const updateViewMode = useCallback((mode: DiscographyViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(DISCOGRAPHY_VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage が利用できない環境でも表示切り替えは継続する
    }
  }, []);

  return [viewMode, updateViewMode] as const;
}
