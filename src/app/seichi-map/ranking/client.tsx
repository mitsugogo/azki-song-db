"use client";

import {
  Alert,
  Anchor,
  Button,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { FiMapPin, FiUsers } from "react-icons/fi";
import { SiGooglemaps } from "react-icons/si";
import { pageClasses } from "../../theme";
import { addCompetitionRanks } from "./ranking";

type RankingResponse = {
  locations: {
    name: string;
    administrativeArea: string | null;
    seichiMapUrl: string;
    googleMapUrl: string;
    uniqueVisitorCount: number;
  }[];
  visitors: { nickname: string | null; visitCount: number }[];
};

export default function SeichiMapRankingClient() {
  const t = useTranslations("SeichiMapRanking");
  const [data, setData] = useState<RankingResponse | null>(null);
  const [error, setError] = useState(false);

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

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Stack gap="xs" mb="xl">
        <h1 className={pageClasses.heading}>{t("title")}</h1>
        <p className={pageClasses.description}>{t("description")}</p>
      </Stack>

      {error ? (
        <Alert color="red">{t("error")}</Alert>
      ) : !data ? (
        <Stack align="center" py="xl">
          <Loader />
          <Text c="dimmed">{t("loading")}</Text>
        </Stack>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <RankingPanel
            icon={<FiMapPin size={20} />}
            title={t("locations.title")}
            unit={t("locations.unit")}
            empty={t("locations.empty")}
            rows={data.locations.map((item) => ({
              name: item.name,
              count: item.uniqueVisitorCount,
              administrativeArea: item.administrativeArea,
              seichiMapUrl: item.seichiMapUrl,
              googleMapUrl: item.googleMapUrl,
            }))}
            seichiMapButtonLabel={t("locations.openSeichiMap")}
            googleMapButtonLabel={t("locations.openGoogleMap")}
            attribution={t("locations.attribution")}
          />
          <RankingPanel
            icon={<FiUsers size={20} />}
            title={t("visitors.title")}
            description={t("visitors.nicknameNotice")}
            unit={t("visitors.unit")}
            empty={t("visitors.empty")}
            rows={data.visitors.map((item) => ({
              name: item.nickname ?? t("anonymousVisitor"),
              count: item.visitCount,
            }))}
          />
        </SimpleGrid>
      )}
    </>
  );
}

function RankingPanel({
  icon,
  title,
  description,
  unit,
  empty,
  rows,
  seichiMapButtonLabel,
  googleMapButtonLabel,
  attribution,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  unit: string;
  empty: string;
  rows: {
    name: string;
    count: number;
    administrativeArea?: string | null;
    seichiMapUrl?: string;
    googleMapUrl?: string;
  }[];
  seichiMapButtonLabel?: string;
  googleMapButtonLabel?: string;
  attribution?: string;
}) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Title order={2} size="h3" className="flex items-center gap-2">
          {icon}
          {title}
        </Title>
        {description ? (
          <Text size="xs" c="dimmed" mt={-4}>
            {description}
          </Text>
        ) : null}
        {rows.length === 0 ? (
          <Text c="dimmed" size="sm">
            {empty}
          </Text>
        ) : (
          <Stack gap={0}>
            {addCompetitionRanks(rows).map((row, index) => (
              <div
                className="flex items-center gap-3 border-b border-gray-2 py-2 last:border-b-0 dark:border-dark-4"
                key={`${row.rank}-${row.name}-${index}`}
              >
                <Text fw={700} c={row.rank <= 3 ? "pink" : "dimmed"} w={28}>
                  {row.rank}
                </Text>
                <Stack gap={2} className="min-w-0 flex-1">
                  <Text fw={600} lineClamp={1}>
                    {row.name}
                  </Text>
                  {row.administrativeArea ||
                  row.seichiMapUrl ||
                  row.googleMapUrl ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {row.administrativeArea ? (
                        <Text size="xs" c="dimmed">
                          {row.administrativeArea}
                        </Text>
                      ) : null}
                      {row.seichiMapUrl && seichiMapButtonLabel ? (
                        <Button
                          component={Link}
                          href={row.seichiMapUrl}
                          leftSection={<FiMapPin size={12} />}
                          variant="light"
                          color="gray"
                          size="compact-xs"
                          c="dimmed"
                        >
                          {seichiMapButtonLabel}
                        </Button>
                      ) : null}
                      {row.googleMapUrl && googleMapButtonLabel ? (
                        <Button
                          component="a"
                          href={row.googleMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          leftSection={<SiGooglemaps size={12} />}
                          variant="light"
                          color="gray"
                          size="compact-xs"
                          c="dimmed"
                        >
                          {googleMapButtonLabel}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </Stack>
                <Text size="sm" c="dimmed">
                  {row.count.toLocaleString()} {unit}
                </Text>
              </div>
            ))}
          </Stack>
        )}
        {attribution ? (
          <Anchor
            href="https://maps.gsi.go.jp/help/termsofuse.html"
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="dimmed"
          >
            {attribution}
          </Anchor>
        ) : null}
      </Stack>
    </Paper>
  );
}
