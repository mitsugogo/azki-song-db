"use client";

import { createContext, useContext, type RefObject } from "react";

export const PageNavigationViewportContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function usePageNavigationViewport() {
  return useContext(PageNavigationViewportContext);
}
