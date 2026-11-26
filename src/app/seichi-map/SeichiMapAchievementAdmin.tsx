"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { useAdminMode } from "../context/AdminModeContext";
import type {
  SeichiMapAchievementErrorCode,
  SeichiMapAchievementSyncPreview,
} from "../types/seichiMapAchievements";

type SyncResult = {
  version: number;
  locationCount: number;
  geocodePendingCount: number;
  awardedCount: number;
};

const KNOWN_ERROR_CODES: SeichiMapAchievementErrorCode[] = [
  "forbidden",
  "invalid_request",
  "conflict",
  "kml_unavailable",
  "invalid_kml",
  "invalid_master",
  "storage_failed",
];

export function SeichiMapAchievementAdmin() {
  const { enabled } = useAdminMode();
  return enabled ? <EnabledAchievementAdmin /> : null;
}

function EnabledAchievementAdmin() {
  const t = useTranslations("SeichiMapAchievementAdmin");
  const locale = useLocale();
  const [preview, setPreview] =
    useState<SeichiMapAchievementSyncPreview | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "sync" | null>(null);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: "preview" | "sync") => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(action);
    setError(null);
    if (action === "sync") setResult(null);
    try {
      const response = await fetch("/api/admin/seichi-map/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload.error as SeichiMapAchievementErrorCode;
        setError(
          t(
            `errors.${KNOWN_ERROR_CODES.includes(code) ? code : "request_failed"}`,
          ),
        );
        return;
      }
      if (action === "preview") {
        setPreview(payload as SeichiMapAchievementSyncPreview);
      } else {
        setResult(payload as SyncResult);
        setPreview(null);
      }
    } catch {
      setError(t("errors.request_failed"));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const overlapping =
    preview?.achievements.filter(
      (achievement) => achievement.overlappingLevels.length > 0,
    ) ?? [];

  return (
    <Paper withBorder p="md" mb="md" radius="md">
      <Stack gap="sm">
        <Text component="h2" fw={700}>
          {t("title")}
        </Text>
        <Text size="sm" c="dimmed">
          {t("description")}
        </Text>
        <Group>
          <Button
            variant="light"
            loading={busy === "preview"}
            disabled={busy !== null}
            onClick={() => void run("preview")}
          >
            {t("preview")}
          </Button>
          <Button
            loading={busy === "sync"}
            disabled={busy !== null}
            onClick={() => void run("sync")}
          >
            {t("sync")}
          </Button>
          {busy === "sync" ? (
            <Text role="status" size="sm">
              {t("syncing")}
            </Text>
          ) : null}
        </Group>
        {preview ? (
          <>
            <Text size="sm">
              {t("summary", {
                locationCount: preview.locationCount,
                geocodePendingCount: preview.geocodePendingCount,
              })}
            </Text>
            <Text size="sm" c="dimmed">
              {preview.syncedAt
                ? t("lastSynced", {
                    date: new Date(preview.syncedAt).toLocaleString(locale),
                  })
                : t("notSynced")}
              {" / "}
              {preview.kmlChanged ? t("kmlChanged") : t("kmlUnchanged")}
            </Text>
            {overlapping.length > 0 ? (
              <Alert color="blue">
                <Text size="sm">{t("overlapWarning")}</Text>
                <Text size="xs">
                  {overlapping
                    .map(
                      (achievement) =>
                        `${achievement.name}: ${achievement.overlappingLevels
                          .map((levels) => levels.join("・"))
                          .join(" / ")}`,
                    )
                    .join("、")}
                </Text>
              </Alert>
            ) : null}
            <ScrollArea.Autosize mah={300} type="auto">
              <Table captionSide="top">
                <Table.Caption>{t("denominators")}</Table.Caption>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("achievement")}</Table.Th>
                    <Table.Th>{t("denominator")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {preview.achievements.map((achievement) => (
                    <Table.Tr key={achievement.id}>
                      <Table.Td>{achievement.name}</Table.Td>
                      <Table.Td>{achievement.denominator}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>
          </>
        ) : null}
        {error ? (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        ) : null}
        {result ? (
          <Alert
            color={result.geocodePendingCount > 0 ? "yellow" : "green"}
            role="status"
          >
            {t("synced", result)}
            {result.geocodePendingCount > 0
              ? ` ${t("geocodePending", { count: result.geocodePendingCount })}`
              : null}
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}
