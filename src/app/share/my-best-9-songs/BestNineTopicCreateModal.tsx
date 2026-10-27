"use client";

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
import { emptyThemes, hasThemes } from "@/app/lib/myBestNineSongs";
import BestNineThemeFields from "./BestNineThemeFields";
import { emptySlotCategories } from "@/app/lib/bestNineCategories";
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
  const [mode, setMode] = useState("free");
  const [themes, setThemes] = useState(emptyThemes);
  const [slotCategories, setSlotCategories] = useState(emptySlotCategories);
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
          if (
            saving ||
            status === "loading" ||
            !title.trim() ||
            (mode === "themed" && !hasThemes(themes))
          )
            return;
          if (
            await onCreate({
              title: title.trim(),
              themes: mode === "themed" ? themes : emptyThemes(),
              slotCategories:
                mode === "themed" ? slotCategories : emptySlotCategories(),
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
          <Radio.Group
            label={t("topics.selectionMode")}
            value={mode}
            onChange={setMode}
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
                slotCategories={slotCategories}
                onCategoriesChange={setSlotCategories}
                onChange={setThemes}
                readOnly={saving}
              />
              {!hasThemes(themes) && (
                <Text size="xs" c="dimmed">
                  {t("topics.themeRequired")}
                </Text>
              )}
            </>
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
              disabled={
                status === "loading" ||
                !title.trim() ||
                (mode === "themed" && !hasThemes(themes))
              }
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
