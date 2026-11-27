"use client";

import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { useCallback, useRef, useState } from "react";
import { FaMedal } from "react-icons/fa";
import { FiArrowDown, FiArrowUp, FiCheck, FiMapPin } from "react-icons/fi";
import { SiGooglemaps } from "react-icons/si";
import { getSeichiMapLevelProgress } from "../../lib/seichiMapAchievementLevel";
import type { SeichiMapRankingBadge } from "../../types/seichiMapAchievements";
import {
  SeichiMapLevelRing,
  SeichiMapTitlePlate,
} from "../SeichiMapPlayerCard";
import classes from "./SeichiMapRanking.module.css";
import { addCompetitionRanks } from "./ranking";

/** 最初に表示する行数。残りは「さらに表示」で追加する */
export const RANKING_PAGE_SIZE = 20;

/** メダルの色。枠や背景には使わず、アイコンの色だけで順位を示す */
const MEDAL_COLORS = {
  1: "var(--mantine-color-yellow-5)",
  2: "var(--mantine-color-gray-5)",
  3: "var(--mantine-color-orange-8)",
} as const;

const isMedalRank = (rank: number): rank is 1 | 2 | 3 =>
  rank === 1 || rank === 2 || rank === 3;

/** 順位。1〜3位はメダルの色だけで区別し、枠や背景は付けない */
function RankMark({ rank }: { rank: number }) {
  return (
    <div className={classes.rankSlot}>
      {isMedalRank(rank) ? (
        <FaMedal
          size={22}
          color={MEDAL_COLORS[rank]}
          role="img"
          aria-label={String(rank)}
        />
      ) : (
        <Text fw={700} c="dimmed" className={classes.rankNumber}>
          {rank}
        </Text>
      )}
    </div>
  );
}

function ShowMore({
  shown,
  total,
  label,
  onClick,
}: {
  shown: number;
  total: number;
  label: string;
  onClick: () => void;
}) {
  if (shown >= total) return null;
  return (
    <Button variant="subtle" color="gray" fullWidth mt="sm" onClick={onClick}>
      {label}
    </Button>
  );
}

export type VisitorRow = {
  name: string;
  count: number;
  badge: SeichiMapRankingBadge | null;
  /** ログイン中の自分の行 */
  isSelf?: boolean;
};

const SELF_ROW_ID = "seichi-map-ranking-self";

export function VisitorRanking({
  rows,
  unit,
  empty,
  showMoreLabel,
  formatSelfRank,
}: {
  rows: VisitorRow[];
  unit: string;
  empty: string;
  showMoreLabel: string;
  /** 「あなた: 3位」のような、自分の順位への案内。自分の行が画面外のときだけ出る */
  formatSelfRank: (rank: number) => string;
}) {
  const [shown, setShown] = useState(RANKING_PAGE_SIZE);
  // 自分の行が画面内にあるか。画面外なら、どちら側にあるかを案内の矢印にする
  const [selfPosition, setSelfPosition] = useState<
    "visible" | "above" | "below"
  >("below");
  const selfObserverRef = useRef<IntersectionObserver | null>(null);
  const selfRowRef = useCallback((node: HTMLDivElement | null) => {
    selfObserverRef.current?.disconnect();
    selfObserverRef.current = null;
    if (!node || typeof IntersectionObserver === "undefined") {
      setSelfPosition("below");
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setSelfPosition(
        entry.isIntersecting
          ? "visible"
          : entry.boundingClientRect.top < 0
            ? "above"
            : "below",
      );
    });
    observer.observe(node);
    selfObserverRef.current = observer;
  }, []);

  if (rows.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {empty}
      </Text>
    );
  }

  const ranked = addCompetitionRanks(rows);
  const selfIndex = ranked.findIndex((row) => row.isSelf);
  const jumpToSelf = () => {
    if (selfIndex < 0) return;
    setShown((current) => Math.max(current, selfIndex + 1));
    // 行が描画されてからスクロールする
    requestAnimationFrame(() =>
      document
        .getElementById(SELF_ROW_ID)
        ?.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
  };

  return (
    <>
      <Stack gap={4}>
        {ranked.slice(0, shown).map((row, index) => {
          const medal = isMedalRank(row.rank);
          return (
            <Group
              key={`${row.rank}-${row.name}-${index}`}
              gap="sm"
              wrap="nowrap"
              py={medal ? "sm" : "xs"}
              id={row.isSelf ? SELF_ROW_ID : undefined}
              ref={row.isSelf ? selfRowRef : undefined}
              className={row.isSelf ? classes.selfRow : undefined}
            >
              <RankMark rank={row.rank} />
              {row.badge ? (
                <div className={classes.ringSlot}>
                  <SeichiMapLevelRing
                    profile={getSeichiMapLevelProgress(row.badge.points)}
                    size={medal ? 44 : 36}
                  />
                </div>
              ) : null}
              <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                <Group justify="space-between" gap="xs" wrap="nowrap">
                  <Text
                    fw={medal ? 700 : 600}
                    size={medal ? "md" : "sm"}
                    lineClamp={1}
                  >
                    {row.name}
                  </Text>
                  <Text
                    size="sm"
                    c={medal ? undefined : "dimmed"}
                    fw={medal ? 700 : undefined}
                    className={classes.count}
                  >
                    {row.count.toLocaleString()}{" "}
                    <Text span inherit c="dimmed" fw={400}>
                      {unit}
                    </Text>
                  </Text>
                </Group>
                {row.badge?.title ? (
                  <div className="min-w-0">
                    <SeichiMapTitlePlate title={row.badge.title} />
                  </div>
                ) : null}
              </Stack>
            </Group>
          );
        })}
      </Stack>
      {selfIndex >= 0 && selfPosition !== "visible" ? (
        <div className={classes.selfJump}>
          <Button
            size="compact-md"
            radius="xl"
            color="pink"
            leftSection={
              selfPosition === "above" ? (
                <FiArrowUp size={14} />
              ) : (
                <FiArrowDown size={14} />
              )
            }
            onClick={jumpToSelf}
          >
            {formatSelfRank(ranked[selfIndex].rank)}
          </Button>
        </div>
      ) : null}
      <ShowMore
        shown={shown}
        total={ranked.length}
        label={showMoreLabel}
        onClick={() => setShown((current) => current + RANKING_PAGE_SIZE)}
      />
    </>
  );
}

export type LocationRow = {
  name: string;
  count: number;
  isVisited: boolean;
  administrativeArea: string | null;
  seichiMapUrl: string;
  googleMapUrl: string;
};

export function LocationRanking({
  rows,
  unit,
  empty,
  visitedLabel,
  seichiMapLabel,
  googleMapLabel,
  attribution,
  showMoreLabel,
}: {
  rows: LocationRow[];
  unit: string;
  empty: string;
  visitedLabel: string;
  seichiMapLabel: string;
  googleMapLabel: string;
  attribution: string;
  showMoreLabel: string;
}) {
  const [shown, setShown] = useState(RANKING_PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {empty}
      </Text>
    );
  }

  const ranked = addCompetitionRanks(rows);

  return (
    <>
      <Stack gap={4}>
        {ranked.slice(0, shown).map((row, index) => (
          <Group
            key={`${row.rank}-${row.name}-${index}`}
            gap="sm"
            wrap="nowrap"
            py="xs"
            align="flex-start"
          >
            <RankMark rank={row.rank} />
            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
              <Text
                fw={isMedalRank(row.rank) ? 700 : 600}
                size="sm"
                lineClamp={2}
                className={classes.name}
              >
                {row.name}
              </Text>
              <Group gap={8} wrap="wrap">
                {row.administrativeArea ? (
                  <Text size="xs" c="dimmed">
                    {row.administrativeArea}
                  </Text>
                ) : null}
                {row.isVisited ? (
                  <Group gap={2} wrap="nowrap">
                    <FiCheck
                      size={12}
                      color="var(--mantine-color-green-6)"
                      aria-hidden="true"
                    />
                    <Text size="xs" c="green.7">
                      {visitedLabel}
                    </Text>
                  </Group>
                ) : null}
              </Group>
            </Stack>
            <Stack gap={2} align="flex-end" className={classes.count}>
              <Text size="sm" c="dimmed">
                {row.count.toLocaleString()} {unit}
              </Text>
              <Group gap={2} wrap="nowrap">
                <Tooltip label={seichiMapLabel} withArrow>
                  <ActionIcon
                    component={Link}
                    href={row.seichiMapUrl}
                    variant="subtle"
                    color="gray"
                    aria-label={`${seichiMapLabel}: ${row.name}`}
                  >
                    <FiMapPin size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={googleMapLabel} withArrow>
                  <ActionIcon
                    component="a"
                    href={row.googleMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="subtle"
                    color="gray"
                    aria-label={`${googleMapLabel}: ${row.name}`}
                  >
                    <SiGooglemaps size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Stack>
          </Group>
        ))}
      </Stack>
      <ShowMore
        shown={shown}
        total={ranked.length}
        label={showMoreLabel}
        onClick={() => setShown((current) => current + RANKING_PAGE_SIZE)}
      />
      <Anchor
        href="https://maps.gsi.go.jp/help/termsofuse.html"
        target="_blank"
        rel="noopener noreferrer"
        size="xs"
        c="dimmed"
        display="block"
        mt="sm"
      >
        {attribution}
      </Anchor>
    </>
  );
}
