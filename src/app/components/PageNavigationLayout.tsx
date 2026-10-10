"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LoadingOverlay, ScrollArea } from "@mantine/core";
import { usePathname } from "@/i18n/navigation";
import { useNavigationMenu } from "../hook/useNavigationMenu";
import { Header } from "./Header";
import DrawerMenu from "./DrawerMenu";
import { PageNavigationViewportContext } from "./PageNavigationLayoutContext";
import classes from "./PageNavigationLayout.module.css";

type PageNavigationLayoutProps = {
  children: ReactNode;
  loading?: boolean;
};

export default function PageNavigationLayout({
  children,
  loading = false,
}: PageNavigationLayoutProps) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const viewportRef = useMemo(() => ({ current: viewport }), [viewport]);
  const { isDesktop, opened, toggle, close } = useNavigationMenu();

  useLayoutEffect(() => {
    if (previousPathnameRef.current !== pathname && viewport) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
    previousPathnameRef.current = pathname;
  }, [pathname, viewport]);

  const navigation = { opened, onToggle: toggle };
  const menu = (
    <DrawerMenu
      opened={opened}
      onClose={close}
      variant={isDesktop ? "sidebar" : "drawer"}
    />
  );

  return (
    <PageNavigationViewportContext.Provider value={viewportRef}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <Header withDesktopNavigation navigation={navigation} />
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className={classes.sidebar}>{menu}</div>
          <div
            aria-busy={loading}
            className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          >
            <ScrollArea
              viewportRef={setViewport}
              className="min-h-0 min-w-0 flex-1"
              type="auto"
              scrollbarSize={8}
              offsetScrollbars="present"
              classNames={{ content: classes.scrollContent }}
            >
              {children}
            </ScrollArea>
            <LoadingOverlay
              visible={loading}
              zIndex={10}
              loaderProps={{ color: "pink", type: "bars" }}
              overlayProps={{ blur: 2 }}
            />
          </div>
        </div>
      </div>
    </PageNavigationViewportContext.Provider>
  );
}
