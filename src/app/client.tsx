"use client";

import { Link } from "../i18n/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text } from "@mantine/core";
import { useDisclosure, useSessionStorage } from "@mantine/hooks";
import { useLocale, useTranslations } from "next-intl";
import { AnalyticsWrapper } from "./components/AnalyticsWrapper";
import DrawerMenu from "./components/DrawerMenu";
import Footer from "./components/Footer";
import { HomeActivityTimelineSection } from "./home/HomeActivityTimelineSection";
import { HomeHeader } from "./home/HomeHeader";
import { HomeHeroSection } from "./home/HomeHeroSection";
import { HomeEventsSection } from "./home/HomeEventsSection";
import { HomeLinksAndMeta } from "./home/HomeLinksAndMeta";
import { HomeRecommendedSongsSection } from "./home/HomeRecommendedSongsSection";
import { RecentUpdatesSection } from "./home/RecentUpdatesSection";
import { HomeTimelineSection } from "./home/HomeTimelineSection";
import { HomeViewMilestonesSection } from "./home/HomeViewMilestonesSection";
import useAnniversaries from "./hook/useAnniversaries";
import useChannels from "./hook/useChannels";
import useEvents from "./hook/useEvents";
import useMilestones from "./hook/useMilestones";
import useSongs from "./hook/useSongs";
import { formatDate } from "./lib/formatDate";
import { showAppNotification } from "./lib/notifications";
import { isEventActive } from "./lib/highlights";
import { IoInformationSharp } from "react-icons/io5";
import { FaExternalLinkAlt } from "react-icons/fa";

const ONGOING_EVENT_ALERT_DISMISSED_SESSION_KEY =
  "ongoing-event-alert-dismissed-id";

type BuildInfo = {
  buildDate?: string;
  version?: string;
};

export default function ClientTop() {
  const locale = useLocale();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const { allSongs, songsFetchedAt, isLoading } = useSongs();
  const { channels: channelsRegistry } = useChannels();
  const { items: anniversaryItems, isLoading: isAnniversariesLoading } =
    useAnniversaries();
  const { items: eventItems, isLoading: isEventsLoading } = useEvents();
  const [dismissedOngoingEventAlertId, setDismissedOngoingEventAlertId] =
    useSessionStorage<string | null>({
      key: ONGOING_EVENT_ALERT_DISMISSED_SESSION_KEY,
      defaultValue: null,
      getInitialValueInEffect: false,
    });
  const { items: externalMilestones, isLoading: isMilestonesLoading } =
    useMilestones();
  const t = useTranslations("Home");
  const ongoingEventNotificationIdRef = useRef<string | null>(null);
  const [buildDate, setBuildDate] = useState("N/A");
  const [appVersion, setAppVersion] = useState("N/A");

  useEffect(() => {
    fetch("/build-info.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch build info: ${response.status}`);
        }
        return response.text().then((text) => {
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

  const ongoingEvents = useMemo(
    () => eventItems.filter((item) => isEventActive(item)),
    [eventItems],
  );

  const songsUpdatedLabel = useMemo(() => {
    if (!songsFetchedAt) {
      return null;
    }

    const date = new Date(songsFetchedAt);
    if (Number.isNaN(date.getTime())) {
      return songsFetchedAt;
    }

    return formatDate(date, locale);
  }, [songsFetchedAt]);

  const buildDateLabel = useMemo(() => {
    if (!buildDate || buildDate === "N/A") {
      return null;
    }

    const date = new Date(buildDate);
    if (Number.isNaN(date.getTime())) {
      return buildDate;
    }

    return formatDate(date, locale);
  }, [buildDate, locale]);

  const copyrightYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return currentYear <= 2025 ? "2025" : `2025-${currentYear}`;
  }, []);

  useEffect(() => {
    if (ongoingEvents.length === 0) {
      return;
    }

    const event = ongoingEvents[0];
    const notificationId = `ongoing-event-${event.content}`;
    if (dismissedOngoingEventAlertId === notificationId) {
      return;
    }

    if (ongoingEventNotificationIdRef.current === notificationId) {
      return;
    }
    ongoingEventNotificationIdRef.current = notificationId;

    showAppNotification({
      id: notificationId,
      title: t("eventOngoingTitle", {
        title: event.content,
      }),
      message: event.note ? (
        <div className="space-y-2">
          <Text size="sm" c="dimmed">
            {event.note}

            {event.url ? (
              <Link
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm ml-1 font-semibold text-primary transition hover:text-primary-700 dark:text-pink-200"
              >
                <FaExternalLinkAlt className="text-[0.75rem]" />
                {t("linkLabel")}
              </Link>
            ) : null}
          </Text>
        </div>
      ) : (
        event.content
      ),
      type: "warning",
      icon: <IoInformationSharp />,
      autoClose: false,
      onClose: () => {
        setDismissedOngoingEventAlertId(notificationId);
        ongoingEventNotificationIdRef.current = null;
      },
    });
  }, [
    dismissedOngoingEventAlertId,
    ongoingEvents,
    setDismissedOngoingEventAlertId,
    t,
  ]);

  return (
    <div className="min-h-dvh overflow-x-clip bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.18),transparent_38%),linear-gradient(180deg,#fffafc_0%,#fdf2f8_100%)] text-gray-900 dark:bg-[radial-gradient(circle_at_top,rgba(190,24,93,0.2),transparent_34%),linear-gradient(180deg,#111827_0%,#0f172a_100%)] dark:text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-24 pt-0 sm:px-6 lg:px-8">
        <HomeHeader drawerOpened={drawerOpened} onToggleDrawer={toggleDrawer} />

        <main className="flex flex-1 flex-col">
          <HomeHeroSection songs={allSongs} />

          <section className="pt-8 pb-10 sm:pt-10">
            <HomeRecommendedSongsSection
              isLoading={isLoading}
              songs={allSongs}
            />

            <HomeViewMilestonesSection
              isSongsLoading={isLoading}
              songs={allSongs}
            />

            <HomeEventsSection
              events={eventItems}
              isLoading={isEventsLoading}
            />

            <HomeTimelineSection
              anniversaries={anniversaryItems}
              isAnniversariesLoading={isAnniversariesLoading}
              isMilestonesLoading={isMilestonesLoading}
              isSongsLoading={isLoading}
              milestones={externalMilestones}
              songs={allSongs}
            />

            <HomeActivityTimelineSection
              channels={channelsRegistry}
              events={eventItems}
              isEventsLoading={isEventsLoading}
              isMilestonesLoading={isMilestonesLoading}
              isSongsLoading={isLoading}
              milestones={externalMilestones}
              songs={allSongs}
            />

            <RecentUpdatesSection
              channels={channelsRegistry}
              isLoading={isLoading}
              songs={allSongs}
            />

            <HomeLinksAndMeta
              appVersion={appVersion}
              buildDateLabel={buildDateLabel}
              copyrightYears={copyrightYears}
              isLoading={isLoading}
              songCount={allSongs.length}
              songsUpdatedLabel={songsUpdatedLabel}
            />
          </section>
        </main>

        <Footer />
      </div>
      <DrawerMenu opened={drawerOpened} onClose={closeDrawer} />
      <AnalyticsWrapper />
    </div>
  );
}
