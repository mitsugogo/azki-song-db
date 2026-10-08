"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { ScrollArea } from "@mantine/core";
import { useDisclosure, useElementSize, useMediaQuery } from "@mantine/hooks";
import { Header } from "./Header";
import DrawerMenu from "./DrawerMenu";
import { PageNavigationHeaderHeightContext } from "./PageNavigationLayoutContext";
import classes from "./PageNavigationLayout.module.css";

type PageNavigationLayoutProps = {
  children: ReactNode;
  scrollMode?: "contained" | "scroll-area" | "window";
};

export default function PageNavigationLayout({
  children,
  scrollMode = "contained",
}: PageNavigationLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 80em)", false);
  const [opened, { toggle, close }] = useDisclosure(false);
  const { ref: headerRef, height: measuredHeaderHeight } = useElementSize();
  const isWindowScroll = scrollMode === "window";
  const stickyHeaderHeight =
    isWindowScroll && isDesktop ? measuredHeaderHeight || 64 : 0;

  useEffect(() => {
    if (isDesktop) close();
  }, [isDesktop, close]);

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
          {isWindowScroll && isDesktop ? (
            <div className={classes.windowSidebar}>{menu}</div>
          ) : (
            menu
          )}
          {scrollMode === "scroll-area" ? (
            <ScrollArea
              className="min-h-0 min-w-0 flex-1"
              type="auto"
              scrollbarSize={8}
              offsetScrollbars="present"
              classNames={{ content: classes.scrollContent }}
            >
              {children}
            </ScrollArea>
          ) : (
            <div
              className={
                isWindowScroll
                  ? `min-w-0 flex-1 ${classes.windowContent}`
                  : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row"
              }
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </PageNavigationHeaderHeightContext.Provider>
  );
}
