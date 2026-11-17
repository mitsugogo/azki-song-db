"use client";
import BestNineSettingsFields, {
  BestNineLivePerformanceField,
} from "./BestNineSettingsFields";
import BestNineCategoryFields from "./BestNineCategoryFields";
import type { BestNineSettings } from "@/app/lib/bestNineSettings";

import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  Radio,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useTranslations } from "next-intl";
import { emptyThemes } from "@/app/lib/myBestNineSongs";
import BestNineThemeFields from "./BestNineThemeFields";
import {
  emptySlotCategories,
  hasLiveSetlistCategory,
  type BestNineCategory,
} from "@/app/lib/bestNineCategories";
import type { BestNineTopicDefinition } from "@/app/lib/bestNineTopics";

export default function BestNineTopicCreateModal({
  opened,
  onClose,
  onCreate,
  saving,
  status,
}: {
  opened: boolean;
  onClose: () => void;
  onCreate: (definition: BestNineTopicDefinition) => Promise<boolean>;
  saving: boolean;
  status: string;
}) {
  const t = useTranslations("Share.myBest9");
  const [title, setTitle] = useState(() => t("defaultTitle"));
  const [settings, setSettings] = useState<BestNineSettings>({
    songCount: 9,
    allowedLiveIds: [],
    hashtags: [],
  });
  const [mode, setMode] = useState("free");
  const [themes, setThemes] = useState(emptyThemes);
  const [slotCategories, setSlotCategories] = useState(emptySlotCategories);
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
      opened={opened}
      onClose={saving ? () => {} : onClose}
      title={t("topics.create")}
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
          if (saving || status === "loading" || !title.trim()) return;
          if (
            await onCreate({
              ...settings,
              title: title.trim(),
              themes: mode === "themed" ? themes : emptyThemes(),
              slotCategories: slotCategories,
            })
          )
            onClose();
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
          {mode === "free" && (
            <BestNineCategoryFields
              slot={0}
              value={slotCategories[0]}
              disabled={saving}
              onChange={(categories) =>
                changeCategories(
                  Array.from({ length: 9 }, () => [...categories]),
                )
              }
            />
          )}
          <Radio.Group
            label={t("topics.selectionMode")}
            value={mode}
            onChange={(nextMode) => {
              setMode(nextMode);
              if (nextMode === "free")
                changeCategories(
                  Array.from({ length: 9 }, () => [...slotCategories[0]]),
                );
            }}
          >
            <Stack gap="xs" mt="xs">
              <Radio
                value="free"
                label={t("topics.freeNine")}
                disabled={saving}
              />
              <Radio
                value="themed"
                label={t("themes.heading")}
                disabled={saving}
              />
            </Stack>
          </Radio.Group>
          {mode === "themed" && (
            <>
              <BestNineThemeFields
                themes={themes}
                songCount={settings.songCount}
                slotCategories={slotCategories}
                onCategoriesChange={changeCategories}
                onChange={setThemes}
                readOnly={saving}
              />
            </>
          )}
          {liveEnabled && (
            <BestNineLivePerformanceField
              value={settings.allowedLiveIds ?? []}
              onChange={(allowedLiveIds) =>
                setSettings((previous) => ({ ...previous, allowedLiveIds }))
              }
              disabled={saving}
            />
          )}
          <Text size="sm" c="dimmed">
            {t("topics.createHelp")}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={saving}>
              {t("themes.cancel")}
            </Button>
            <Button
              type="submit"
              loading={saving}
              disabled={status === "loading" || !title.trim()}
            >
              {t(
                status === "authenticated"
                  ? "topics.create"
                  : "topics.loginToCreate",
              )}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
