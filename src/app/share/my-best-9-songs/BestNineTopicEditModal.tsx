"use client";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedThemes = themes.map((theme) => theme.trim());
  const changed =
    title.trim() !== topic.title ||
    JSON.stringify(slotCategories) !==
      JSON.stringify(normalizeSlotCategories(topic.slotCategories)) ||
    normalizedThemes.some((theme, index) => theme !== topic.themes[index]);
  const canSave = topic.canEdit && !!title.trim() && changed && !saving;
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
          <BestNineThemeFields
            themes={themes}
            slotCategories={slotCategories}
            onCategoriesChange={setSlotCategories}
            onChange={setThemes}
            readOnly={saving}
          />
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
