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
  SeichiMapIdentityErrorCode,
  SeichiMapIdentityPreview,
} from "../types/seichiMapIdentityRegistry";

type Props = { onReload: () => Promise<boolean> };

export function SeichiMapIdentityAdmin(props: Props) {
  const { enabled } = useAdminMode();
  return enabled ? <EnabledIdentityAdmin {...props} /> : null;
}

function EnabledIdentityAdmin({ onReload }: Props) {
  const t = useTranslations("SeichiMapIdentityAdmin");
  const locale = useLocale();
  const [preview, setPreview] = useState<SeichiMapIdentityPreview | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | "reload" | null>(null);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reloadFailed, setReloadFailed] = useState(false);

  const reload = async () => {
    try {
      setReloadFailed(!(await onReload()));
    } catch {
      setReloadFailed(true);
    }
  };

  const run = async (action: "preview" | "apply" | "reload") => {
    if (busyRef.current || (action === "apply" && !preview?.needsApply)) return;
    busyRef.current = true;
    setBusy(action);
    setError(null);
    try {
      if (action === "reload") {
        await reload();
        return;
      }
      setSaved(false);
      setReloadFailed(false);
      const confirmed = preview;
      setPreview(null);
      const response = await fetch("/api/admin/seichi-map/identities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "preview"
            ? { action }
            : {
                action,
                baseVersion: confirmed!.baseVersion,
                candidateHash: confirmed!.candidateHash,
              },
        ),
      });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload.error as SeichiMapIdentityErrorCode;
        const knownCodes: SeichiMapIdentityErrorCode[] = [
          "forbidden",
          "invalid_request",
          "conflict",
          "kml_unavailable",
          "invalid_kml",
          "invalid_registry",
          "storage_failed",
        ];
        setError(
          t(`errors.${knownCodes.includes(code) ? code : "request_failed"}`),
        );
        return;
      }
      if (action === "preview") {
        setPreview(payload as SeichiMapIdentityPreview);
      } else {
        setSaved(true);
        await reload();
      }
    } catch {
      setError(t("errors.request_failed"));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

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
          {preview?.needsApply && (
            <Button disabled={busy !== null} onClick={() => void run("apply")}>
              {t("apply")}
            </Button>
          )}
          {busy === "apply" && (
            <Text role="status" size="sm">
              {t("applying")}
            </Text>
          )}
        </Group>
        {preview && (
          <>
            <Text size="sm">{t("summary", preview.summary)}</Text>
            <Text size="sm" c="dimmed">
              {preview.updatedAt
                ? t("lastUpdated", {
                    date: new Date(preview.updatedAt).toLocaleString(locale),
                  })
                : t("notInitialized")}
            </Text>
            {!preview.needsApply && <Text role="status">{t("noChanges")}</Text>}
            {preview.changes.length > 0 && (
              <ScrollArea.Autosize mah={300} type="auto">
                <Table captionSide="top">
                  <Table.Caption>{t("changes")}</Table.Caption>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t("location")}</Table.Th>
                      <Table.Th>{t("id")}</Table.Th>
                      <Table.Th>{t("kind")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {preview.changes.map((change) => (
                      <Table.Tr key={change.id}>
                        <Table.Td>{change.name}</Table.Td>
                        <Table.Td>
                          <code>{change.id}</code>
                        </Table.Td>
                        <Table.Td>{t(change.kind)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            )}
          </>
        )}
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        {saved && (
          <Alert color="green" role="status">
            {t("saved")}
          </Alert>
        )}
        {reloadFailed && (
          <Alert color="yellow" role="alert">
            <Stack gap="xs">
              <Text size="sm">{t("reloadFailed")}</Text>
              <Button
                variant="light"
                disabled={busy !== null}
                loading={busy === "reload"}
                onClick={() => void run("reload")}
              >
                {t("reload")}
              </Button>
            </Stack>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
