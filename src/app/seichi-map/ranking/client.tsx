"use client";

import {
  ActionIcon,
  Alert,
  Group,
  Loader,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { FiMap, FiMapPin, FiUsers } from "react-icons/fi";
import { pageClasses } from "../../theme";
import type { SeichiMapRankingBadge } from "../../types/seichiMapAchievements";
import { LocationRanking, VisitorRanking } from "./SeichiMapRankingLists";

type RankingResponse = {
  locations: {
    id: string;
    name: string;
    administrativeArea: string | null;
    seichiMapUrl: string;
    googleMapUrl: string;
    uniqueVisitorCount: number;
  }[];
  visitors: {
    nickname: string | null;
    visitCount: number;
    achievement?: SeichiMapRankingBadge | null;
    isSelf?: boolean;
  }[];
};

type VisitedResponse = {
  items?: { locationId?: string | null }[];
};

type RankingTab = "visitors" | "locations";

export default function SeichiMapRankingClient() {
  const t = useTranslations("SeichiMapRanking");
  const [data, setData] = useState<RankingResponse | null>(null);
  const [visitedLocationIds, setVisitedLocationIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<RankingTab>("visitors");

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/seichi-map/ranking", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load rankings");
        return (await response.json()) as RankingResponse;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    void fetch("/api/seichi-map/visited", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return new Set<string>();
        const payload = (await response.json()) as VisitedResponse;
        return new Set(
          (payload.items ?? [])
            .map((item) => item.locationId?.trim())
            .filter((locationId): locationId is string => Boolean(locationId)),
        );
      })
      .then((locationIds) => {
        if (!cancelled) setVisitedLocationIds(locationIds);
      })
      .catch(() => {
        // Rankings remain available when the personal visit log is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const renderVisitors = (data: RankingResponse) => (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        {t("visitors.nicknameNotice")}
      </Text>
      <VisitorRanking
        rows={data.visitors.map((item) => ({
          name: item.nickname ?? t("anonymousVisitor"),
          count: item.visitCount,
          badge: item.achievement ?? null,
          isSelf: item.isSelf === true,
        }))}
        unit={t("visitors.unit")}
        empty={t("visitors.empty")}
        showMoreLabel={t("showMore")}
        formatSelfRank={(rank) => t("visitors.selfRank", { rank })}
      />
    </Stack>
  );

  const renderLocations = (data: RankingResponse) => (
    <LocationRanking
      rows={data.locations.map((item) => ({
        name: item.name,
        count: item.uniqueVisitorCount,
        isVisited: visitedLocationIds.has(item.id),
        administrativeArea: item.administrativeArea,
        seichiMapUrl: item.seichiMapUrl,
        googleMapUrl: item.googleMapUrl,
      }))}
      unit={t("locations.unit")}
      empty={t("locations.empty")}
      visitedLabel={t("locations.visited")}
      seichiMapLabel={t("locations.openSeichiMap")}
      googleMapLabel={t("locations.openGoogleMap")}
      attribution={t("locations.attribution")}
      showMoreLabel={t("showMore")}
    />
  );

  return (
    <>
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
        <Stack gap="xs" style={{ minWidth: 0 }}>
          <h1 className={pageClasses.heading}>{t("title")}</h1>
          <p className={`${pageClasses.description} hidden sm:block`}>
            {t("description")}
          </p>
        </Stack>
        <ActionIcon
          component={Link}
          href="/seichi-map"
          hiddenFrom="sm"
          variant="light"
          color="pink"
          size="lg"
          className="shrink-0"
          aria-label={t("backToMap")}
        >
          <FiMap size={18} />
        </ActionIcon>
      </Group>

      {error ? (
        <Alert color="red">{t("error")}</Alert>
      ) : !data ? (
        <Stack align="center" py="xl">
          <Loader color="pink" />
          <Text c="dimmed">{t("loading")}</Text>
        </Stack>
      ) : (
        <>
          <Stack gap="md" hiddenFrom="md">
            <SegmentedControl
              fullWidth
              value={tab}
              onChange={(value) =>
                setTab(value === "locations" ? value : "visitors")
              }
              data={[
                { label: t("tabs.visitors"), value: "visitors" },
                { label: t("tabs.locations"), value: "locations" },
              ]}
              aria-label={t("title")}
            />
            {tab === "visitors" ? renderVisitors(data) : renderLocations(data)}
          </Stack>

          <SimpleGrid cols={2} spacing="xl" visibleFrom="md">
            <RankingColumn
              icon={<FiUsers size={20} />}
              title={t("visitors.title")}
            >
              {renderVisitors(data)}
            </RankingColumn>
            <RankingColumn
              icon={<FiMapPin size={20} />}
              title={t("locations.title")}
            >
              {renderLocations(data)}
            </RankingColumn>
          </SimpleGrid>
        </>
      )}
    </>
  );
}

function RankingColumn({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Stack gap="sm">
      <Group gap="xs" wrap="nowrap">
        {icon}
        <Title order={2} size="h3">
          {title}
        </Title>
      </Group>
      {children}
    </Stack>
  );
}
