"use client";

import BestNineSettingsFields, {
  BestNineLivePerformanceField,
} from "./BestNineSettingsFields";
import { type BestNineSettings } from "@/app/lib/bestNineSettings";
import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useTranslations } from "next-intl";
import type { BestNineTopicView } from "@/app/lib/bestNineTopics";
import { bestNineErrorCode } from "@/app/lib/bestNineTopics";
import { bestNineRequest } from "@/app/hook/useBestNineTopic";
import { showAppNotification } from "@/app/lib/notifications";
import BestNineThemeFields from "./BestNineThemeFields";
import {
  normalizeSlotCategories,
  hasLiveSetlistCategory,
  type BestNineCategory,
  emptySlotCategories,
} from "@/app/lib/bestNineCategories";

export default function BestNineTopicEditModal({
  topic,
  onClose,
  onSaved,
}: {
  topic: BestNineTopicView;
  onClose: () => void;
  onSaved: (topic: BestNineTopicView) => void;
}) {
  const t = useTranslations("Share.myBest9");
  const [title, setTitle] = useState(topic.title);
  const [themes, setThemes] = useState(() => [...topic.themes]);
  const [slotCategories, setSlotCategories] = useState(
    () =>
      normalizeSlotCategories(topic.slotCategories) ?? emptySlotCategories(),
  );
  const [settings, setSettings] = useState<BestNineSettings>({
    songCount: topic.songCount ?? 9,
    allowedLiveIds: topic.allowedLiveIds ?? [],
    hashtags: topic.hashtags ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedThemes = themes.map((theme) => theme.trim());
  const changed =
    JSON.stringify(settings) !==
      JSON.stringify({
        songCount: topic.songCount ?? 9,
        allowedLiveIds: topic.allowedLiveIds ?? [],
        hashtags: topic.hashtags ?? [],
      }) ||
    title.trim() !== topic.title ||
    JSON.stringify(slotCategories) !==
      JSON.stringify(normalizeSlotCategories(topic.slotCategories)) ||
    normalizedThemes.some((theme, index) => theme !== topic.themes[index]);
  const canSave = topic.canEdit && !!title.trim() && changed && !saving;
  const liveEnabled = hasLiveSetlistCategory(
    slotCategories,
    settings.songCount,
  );
  const changeCategories = (categories: BestNineCategory[][]) => {
    setSlotCategories(categories);
    if (!hasLiveSetlistCategory(categories, settings.songCount))
      setSettings((previous) => ({ ...previous, allowedLiveIds: [] }));
  };
  const changeSettings = (next: BestNineSettings) =>
    setSettings({
      ...next,
      allowedLiveIds: hasLiveSetlistCategory(slotCategories, next.songCount)
        ? next.allowedLiveIds
        : [],
    });
  return (
    <Modal
      opened
      onClose={() => !saving && onClose()}
      title={t("topics.edit")}
      centered
      size="lg"
      closeOnClickOutside={!saving}
      closeOnEscape={!saving}
      closeButtonProps={{ disabled: saving, "aria-label": t("topics.close") }}
    >
      <form
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            (event.nativeEvent.isComposing || event.keyCode === 229)
          )
            event.preventDefault();
        }}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSave) return;
          setSaving(true);
          setError(null);
          try {
            const data = await bestNineRequest<{ topic: BestNineTopicView }>(
              `/api/share/my-best-9-songs/topics/${encodeURIComponent(topic.id)}`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  ...settings,
                  title: title.trim(),
                  themes: normalizedThemes,
                  slotCategories,
                  version: topic.version,
                }),
              },
            );
            showAppNotification({ message: t("topics.saved") });
            onSaved(data.topic);
          } catch (error) {
            setError(bestNineErrorCode(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Stack gap="md">
          <TextInput
            label={t("form.titleLabel")}
            value={title}
            maxLength={50}
            required
            data-autofocus
            disabled={saving}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <BestNineSettingsFields
            value={settings}
            onChange={changeSettings}
            disabled={saving}
          />
          <BestNineThemeFields
            themes={themes}
            songCount={settings.songCount}
            slotCategories={slotCategories}
            onCategoriesChange={changeCategories}
            onChange={setThemes}
            readOnly={saving}
          />
          {liveEnabled && (
            <BestNineLivePerformanceField
              value={settings.allowedLiveIds ?? []}
              onChange={(allowedLiveIds) =>
                setSettings((previous) => ({ ...previous, allowedLiveIds }))
              }
              disabled={saving}
            />
          )}
          <Text size="xs" c="dimmed">
            {t("topics.revisionHelp")}
          </Text>
          {error && <Alert color="red">{t(`topics.errors.${error}`)}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" disabled={saving} onClick={onClose}>
              {t("themes.cancel")}
            </Button>
            <Button type="submit" loading={saving} disabled={!canSave}>
              {t("topics.saveRevision")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
