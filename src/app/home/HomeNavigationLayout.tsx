"use client";

import { useState, type ReactNode } from "react";
import { ScrollArea } from "@mantine/core";
import DrawerMenu from "../components/DrawerMenu";
import { useNavigationMenu } from "../hook/useNavigationMenu";
import { HomeHeader } from "./HomeHeader";
import classes from "./HomeNavigationLayout.module.css";

export function HomeNavigationLayout({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { isDesktop, opened, toggle, close } = useNavigationMenu();
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <div className={classes.layout}>
      <div className="relative z-40 shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <HomeHeader
            drawerOpened={opened}
            onToggleDrawer={toggle}
            sidebarVisible={isDesktop}
            isScrolled={isScrolled}
          />
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className={classes.sidebar}>
          <DrawerMenu
            opened={opened}
            onClose={close}
            variant={isDesktop ? "sidebar" : "drawer"}
          />
        </div>
        <ScrollArea
          className="min-h-0 min-w-0 flex-1"
          type="auto"
          scrollbars="y"
          scrollbarSize={8}
          offsetScrollbars="present"
          onScrollPositionChange={({ y }) => setIsScrolled(y > 12)}
          classNames={{ content: classes.scrollContent }}
        >
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-24 pt-0 sm:px-6 lg:px-8">
            {children}
          </div>
        </ScrollArea>
      </div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
