"use client";

import { createContext, useContext } from "react";

export const PageNavigationHeaderHeightContext = createContext(0);

export function usePageNavigationHeaderHeight() {
  return useContext(PageNavigationHeaderHeightContext);
}
