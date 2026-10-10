"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import {
  ActionIcon,
  Button,
  Divider,
  Drawer,
  Modal,
  ScrollArea,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useHover, useMediaQuery } from "@mantine/hooks";
import { useTranslations, useLocale } from "next-intl";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { LiaExternalLinkAltSolid } from "react-icons/lia";
import { LuSearch } from "react-icons/lu";
import Acknowledgment from "./Acknowledgment";
import usePWAInstall from "../hook/usePWAInstall";
import useSongs from "../hook/useSongs";
import { formatDate } from "../lib/formatDate";
import { FaMapMarkerAlt } from "react-icons/fa";
import classes from "./DrawerMenu.module.css";

type DrawerMenuProps = {
  opened: boolean;
  onClose: () => void;
  variant?: "drawer" | "sidebar";
};

type BuildInfo = {
  buildDate?: string;
  version?: string;
};

interface PageItem {
  name: string;
  href: string;
  tooltip?: string;
}

interface PageCategory {
  category?: string;
  items: PageItem[];
}

export default function DrawerMenu({
  opened,
  onClose,
  variant = "drawer",
}: DrawerMenuProps) {
  const pathname = usePathname();
  const [buildDate, setBuildDate] = useState("N/A");
  const [appVersion, setAppVersion] = useState("N/A");
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const { hovered: isSidebarHovered, ref: sidebarScrollAreaRef } =
    useHover<HTMLDivElement>();
  const isMobile = useMediaQuery("(max-width: 50em)");
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { songsFetchedAt } = useSongs();
  const t = useTranslations("DrawerMenu");
  const locale = useLocale();

  const pageList: PageCategory[] = [
    {
      items: [
        { name: t("home"), href: "/" },
        { name: t("search"), href: "/search" },
      ],
    },
    {
      category: t("categoryActivity"),
      items: [
        { name: t("discography"), href: "/discography" },
        { name: t("units"), href: "/units" },
        { name: t("lives"), href: "/lives" },
        { name: t("activity"), href: "/activity" },
        { name: t("anniversaries"), href: "/anniversaries" },
        { name: t("seichiMapComplete"), href: "/seichi-map" },
      ],
    },
    {
      category: t("categoryArchive"),
      items: [
        { name: t("archives"), href: "/stream-archives" },
        { name: t("repertoire"), href: "/repertoire" },
        { name: t("statistics"), href: "/statistics" },
        { name: t("allData"), href: "/data" },
      ],
    },
    {
      category: t("categoryShare"),
      items: [
        { name: t("myBest9Songs"), href: "/share/my-best-9-songs" },
        {
          name: t("acrosticSetlist"),
          href: "/share/acrostic-setlist",
        },
        {
          name: t("whereMyAzkichiBegan"),
          href: "/share/where-my-azkichi-began",
        },
      ],
    },
  ];

  const isCurrentPage = (href: string) =>
    href === pathname || (href !== "/" && pathname?.startsWith(`${href}/`));
  const menuLinkClass = `${classes.linkTypography} ${variant === "sidebar" ? classes.link : ""}`;
  const menuSectionClass = `${classes.sectionTitleTypography} ${variant === "sidebar" ? classes.sectionTitle : ""}`;

  useEffect(() => {
    fetch("/build-info.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch build info: ${res.status}`);
        }
        return res.text().then((text) => {
          try {
            return JSON.parse(text);
          } catch {
            return {};
          }
        });
      })
      .then((data: BuildInfo) => {
        setBuildDate(data.buildDate ?? "N/A");
        setAppVersion(data.version ?? "N/A");
      })
      .catch((error) => {
        console.warn("Failed to fetch build info:", error);
        if (process.env.NODE_ENV === "development") {
          setBuildDate(new Date().toISOString());
          setAppVersion("dev");
        }
      });
  }, []);

  const menuLinks = (
    <>
      {pageList.map((category, categoryIndex) => (
        <div key={categoryIndex}>
          {category.category && (
            <Text
              c={variant === "sidebar" ? undefined : "dimmed"}
              size="xs"
              className={`ml-3 mt-6 mb-2 font-semibold uppercase ${menuSectionClass}`}
            >
              {category.category}
            </Text>
          )}
          {category.items.map((item) => {
            const isCurrent = isCurrentPage(item.href);
            const baseClasses =
              "block rounded-md px-3 py-1.5 text-base font-medium cursor-pointer";
            const activeClasses =
              "bg-primary-600 dark:bg-primary-800 text-white";
            const inactiveClasses =
              "hover:bg-primary-50 hover:text-primary dark:hover:bg-white/5 dark:hover:text-white";

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`${isCurrent ? activeClasses : inactiveClasses} ${baseClasses} ${menuLinkClass}`}
                onClick={onClose}
              >
                {item.href === "/search" ? (
                  <LuSearch
                    className="mr-1.5 inline-block size-3.5 align-[-0.125em]"
                    aria-hidden="true"
                  />
                ) : null}
                {item.name}
              </Link>
            );
          })}
        </div>
      ))}

      <div
        className={`ml-3 mt-6 mb-2 text-xs font-semibold text-light-gray-300 dark:text-gray-300 uppercase ${menuSectionClass}`}
      >
        {t("management")}
      </div>
      <Link
        href="/playlist"
        key="playlist"
        aria-current={isCurrentPage("/playlist") ? "page" : undefined}
        className={`block rounded-md px-3 py-1.5 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white ${menuLinkClass}`}
        onClick={onClose}
      >
        {t("playlist")}
      </Link>

      {isInstallable && !isInstalled && (
        <>
          <UnstyledButton
            key="install-pwa"
            className={`block w-full rounded-md px-3 py-1.5 text-left text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white ${menuLinkClass}`}
            onClick={() => {
              promptInstall();
              onClose();
            }}
          >
            {t("installApp")}
          </UnstyledButton>
          {variant === "drawer" && <Divider my="md" />}
        </>
      )}

      {variant === "sidebar" && <Divider my="md" />}

      <Link
        href="#"
        key="about"
        className={`block rounded-md px-3 py-1.5 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white ${menuLinkClass}`}
        onClick={() => {
          setShowAcknowledgment(true);
          onClose();
        }}
      >
        {t("about")}
      </Link>
      <hr className="my-6 border border-light-gray-200 dark:border-gray-600 md:hidden" />
    </>
  );

  const menuContent = (
    <nav
      aria-label={t("title")}
      className={`${classes.menuTypography} ${
        variant === "sidebar"
          ? `flex flex-1 flex-col px-3 pt-4 pb-[6px] ${classes.sidebarMenu}`
          : "flex flex-col h-full"
      }`}
    >
      {variant === "sidebar" ? (
        <div className="space-y-1">{menuLinks}</div>
      ) : (
        <ScrollArea
          className="flex-1 min-h-0"
          type="auto"
          scrollbars="y"
          scrollbarSize={8}
          offsetScrollbars="y"
          classNames={{ content: "space-y-1" }}
        >
          {menuLinks}
        </ScrollArea>
      )}

      <div
        className={`shrink-0 ${variant === "drawer" ? "pb-3" : ""} ${classes.footer}`}
      >
        <Link
          href="https://www.youtube.com/@AZKi"
          target="_blank"
          className={`rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white ${menuLinkClass} ${classes.externalLink}`}
          onClick={onClose}
        >
          <span>AZKi Channel</span>
          <LiaExternalLinkAltSolid
            className={classes.externalIcon}
            aria-hidden="true"
          />
        </Link>

        <Tooltip
          arrowOffset={10}
          arrowSize={4}
          label={t("soloLive")}
          withArrow
          position="top"
        >
          <Link
            href="https://departure.hololivepro.com/"
            target="_blank"
            className={`rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white ${menuLinkClass} ${classes.externalLink}`}
            onClick={onClose}
          >
            <div className={classes.externalLabel}>
              <span>AZKi SOLO LiVE 2025 &quot;Departure&quot;</span>
              <span className={classes.liveDetails}>
                <span>2025.11.19 (Wed.)</span>
                <span>PIA ARENA MM</span>
              </span>
            </div>
            <LiaExternalLinkAltSolid
              className={classes.externalIcon}
              aria-hidden="true"
            />
          </Link>
        </Tooltip>

        <div className={classes.footerInfo}>
          <Divider my="sm" />
          {buildDate && songsFetchedAt && (
            <dl className={classes.versionInfo}>
              <div>
                <dt>Version</dt>
                <dd>
                  <Link
                    href={
                      appVersion === "dev"
                        ? "https://github.com/mitsugogo/azki-song-db"
                        : `https://github.com/mitsugogo/azki-song-db/releases/tag/v${appVersion}`
                    }
                    target="_blank"
                    className={classes.utilityLink}
                    onClick={onClose}
                  >
                    {appVersion === "dev" ? "dev" : `v${appVersion}`}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Build</dt>
                <dd>{formatDate(buildDate, locale)}</dd>
              </div>
              <div>
                <dt>Songs</dt>
                <dd>{formatDate(songsFetchedAt, locale)}</dd>
              </div>
            </dl>
          )}

          <div className={classes.utilityLinks}>
            <Link
              href="https://github.com/mitsugogo/azki-song-db/blob/main/CHANGELOG.md"
              target="_blank"
              className={classes.utilityLink}
              onClick={onClose}
            >
              CHANGELOG
            </Link>
          </div>

          <div className={classes.authorRow}>
            <span className={classes.copyright}>© 2026 mitsugogo</span>
            <div className={classes.socialLinks}>
              <Tooltip label="X (mitsugogo)">
                <ActionIcon
                  color="gray"
                  variant="subtle"
                  size="sm"
                  component={Link}
                  target="_blank"
                  href="https://x.com/mitsugogo"
                  aria-label="X (mitsugogo)"
                  onClick={onClose}
                >
                  <FaXTwitter />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="GitHub (mitsugogo/azki-song-db)">
                <ActionIcon
                  color="gray"
                  variant="subtle"
                  size="sm"
                  component={Link}
                  target="_blank"
                  href="https://github.com/mitsugogo/azki-song-db"
                  aria-label="GitHub (mitsugogo/azki-song-db)"
                  onClick={onClose}
                >
                  <FaGithub />
                </ActionIcon>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {variant === "sidebar" ? (
        <aside className="hidden xl:block h-full w-72 shrink-0 overflow-hidden border-r border-light-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800/75">
          <ScrollArea
            ref={sidebarScrollAreaRef}
            h="100%"
            type={isSidebarHovered ? "auto" : "scroll"}
            scrollbars="y"
            scrollbarSize={8}
            offsetScrollbars="y"
            overscrollBehavior="contain"
            styles={{
              content: { display: "flex", minHeight: "100%" },
              thumb: { opacity: "calc(var(--thumb-opacity, 1) * 0.25)" },
            }}
          >
            {menuContent}
          </ScrollArea>
        </aside>
      ) : (
        <Drawer
          opened={opened}
          onClose={onClose}
          title={t("title")}
          overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
          classNames={{
            body: "flex flex-col overflow-hidden",
            title: classes.sectionTitleTypography,
          }}
          styles={{ body: { height: "calc(100% - 60px)" } }}
        >
          {menuContent}
        </Drawer>
      )}

      <Modal
        opened={showAcknowledgment}
        onClose={() => setShowAcknowledgment(false)}
        size="auto"
        title={t("about")}
        overlayProps={{ backgroundOpacity: 0.5, blur: 5 }}
        fullScreen={isMobile}
      >
        <Acknowledgment />
        <div className="mt-4 flex justify-end">
          <Button
            className="transition text-sm cursor-pointer"
            color="pink"
            onClick={() => setShowAcknowledgment(false)}
          >
            {t("close")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
