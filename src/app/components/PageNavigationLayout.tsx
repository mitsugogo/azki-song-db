"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { LoadingOverlay, ScrollArea } from "@mantine/core";
import { useDisclosure, useElementSize, useMediaQuery } from "@mantine/hooks";
import { usePathname } from "@/i18n/navigation";
import { Header } from "./Header";
import DrawerMenu from "./DrawerMenu";
import { PageNavigationHeaderHeightContext } from "./PageNavigationLayoutContext";
import classes from "./PageNavigationLayout.module.css";

export type PageNavigationScrollMode = "contained" | "scroll-area" | "window";

type PageNavigationLayoutProps = {
  children: ReactNode;
  scrollMode?: PageNavigationScrollMode;
  loading?: boolean;
};

export default function PageNavigationLayout({
  children,
  scrollMode = "contained",
  loading = false,
}: PageNavigationLayoutProps) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 80em)", false);
  const [opened, { toggle, close }] = useDisclosure(false);
  const { ref: headerRef, height: measuredHeaderHeight } = useElementSize();
  const isWindowScroll = scrollMode === "window";
  const stickyHeaderHeight =
    isWindowScroll && isDesktop ? measuredHeaderHeight || 64 : 0;

  useEffect(() => {
    if (isDesktop) close();
  }, [isDesktop, close]);

  useLayoutEffect(() => {
    if (previousPathnameRef.current !== pathname && viewportRef.current) {
      viewportRef.current.scrollTop = 0;
      viewportRef.current.scrollLeft = 0;
    }
    previousPathnameRef.current = pathname;
  }, [pathname]);

  const navigation = { opened, onToggle: toggle };
  const menu = (
    <DrawerMenu
      opened={opened}
      onClose={close}
      variant={isDesktop ? "sidebar" : "drawer"}
    />
  );

  return (
    <PageNavigationHeaderHeightContext.Provider value={stickyHeaderHeight}>
      <div
        className={`flex flex-1 flex-col ${isWindowScroll ? "" : "min-h-0"}`}
        style={
          {
            "--navigation-header-height": `${stickyHeaderHeight}px`,
          } as CSSProperties
        }
      >
        <div
          ref={headerRef}
          className={`shrink-0 ${
            isWindowScroll ? "xl:sticky xl:top-0 xl:z-30" : ""
          }`}
        >
          <Header withDesktopNavigation navigation={navigation} />
        </div>
        <div
          className={`flex flex-1 ${isWindowScroll ? "" : "min-h-0 overflow-hidden"}`}
        >
          <div
            className={
              isWindowScroll && isDesktop
                ? classes.windowSidebar
                : classes.sidebar
            }
          >
            {menu}
          </div>
          <div
            aria-busy={loading}
            className={
              isWindowScroll
                ? `relative min-w-0 flex-1 ${classes.windowContent}`
                : "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row"
            }
          >
            {scrollMode === "scroll-area" ? (
              <ScrollArea
                viewportRef={viewportRef}
                className="min-h-0 min-w-0 flex-1"
                type="auto"
                scrollbarSize={8}
                offsetScrollbars="present"
                classNames={{ content: classes.scrollContent }}
              >
                {children}
              </ScrollArea>
            ) : (
              children
            )}
            <LoadingOverlay
              visible={loading}
              zIndex={10}
              loaderProps={{ color: "pink", type: "bars" }}
              overlayProps={{ blur: 2 }}
            />
          </div>
        </div>
      </div>
    </PageNavigationHeaderHeightContext.Provider>
  );
}
