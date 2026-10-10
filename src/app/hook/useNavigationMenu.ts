"use client";

import { useEffect } from "react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";

export function useNavigationMenu() {
  const isDesktop = useMediaQuery("(min-width: 80em)", false);
  const [opened, { toggle, close }] = useDisclosure(false);

  useEffect(() => {
    if (isDesktop) close();
  }, [isDesktop, close]);

  return { isDesktop, opened, toggle, close };
}
