"use client";

import type { CSSProperties, ReactNode } from "react";
import { useResizeObserver } from "@mantine/hooks";
import DrawerMenu from "../components/DrawerMenu";
import { useNavigationMenu } from "../hook/useNavigationMenu";
import { HomeHeader } from "./HomeHeader";
import classes from "./HomeNavigationLayout.module.css";

export function HomeNavigationLayout({ children }: { children: ReactNode }) {
  const { isDesktop, opened, toggle, close } = useNavigationMenu();
  const [headerRef, headerRect] = useResizeObserver<HTMLDivElement>();

  return (
    <div
      className={classes.layout}
      style={
        {
          "--home-header-height": `${headerRect.height || 72}px`,
        } as CSSProperties
      }
    >
      <div ref={headerRef} className="sticky top-0 z-40 shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <HomeHeader
            drawerOpened={opened}
            onToggleDrawer={toggle}
            sidebarVisible={isDesktop}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-start">
        <div className={classes.sidebar}>
          <DrawerMenu
            opened={opened}
            onClose={close}
            variant={isDesktop ? "sidebar" : "drawer"}
          />
        </div>
        <div className="flex min-w-0 flex-1 self-stretch overflow-x-clip">
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-24 pt-0 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
