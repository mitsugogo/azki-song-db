"use client";

import { Button, Stack, Text, TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import { emptyThemes } from "@/app/lib/myBestNineSongs";
import { type BestNineCategory } from "@/app/lib/bestNineCategories";
import BestNineCategoryFields from "./BestNineCategoryFields";

export default function BestNineThemeFields({
  themes,
  onChange,
  readOnly = false,
  slotCategories,
  onCategoriesChange,
}: {
  themes: string[];
  onChange: (themes: string[]) => void;
  readOnly?: boolean;
  slotCategories?: BestNineCategory[][];
  onCategoriesChange?: (categories: BestNineCategory[][]) => void;
}) {
  const t = useTranslations("Share.myBest9.themes");
  const categoryText = useTranslations("Share.myBest9.topics");
  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        {t("help")}
      </Text>
      {slotCategories && (
        <Text size="xs" c="dimmed">
          {categoryText("allowedCategoriesHelp")}
        </Text>
      )}
      <Button
        size="xs"
        variant="light"
        disabled={readOnly}
        onClick={() =>
          onChange(
            Array.from({ length: 9 }, (_, index) => t(`presets.${index}`)),
          )
        }
      >
        {t("preset")}
      </Button>
      <Button
        size="xs"
        variant="subtle"
        color="gray"
        disabled={readOnly}
        onClick={() => onChange(emptyThemes())}
      >
        {t("clear")}
      </Button>
      {themes.map((theme, index) => (
        <Stack key={index} gap={4} mb="xs">
          <TextInput
            label={t("inputLabel", { number: index + 1 })}
            placeholder={t("freeSlot")}
            maxLength={50}
            readOnly={readOnly}
            value={theme}
            onChange={(event) => {
              const value = event.currentTarget.value;
              onChange(
                themes.map((theme, slot) => (slot === index ? value : theme)),
              );
            }}
          />
          {slotCategories && onCategoriesChange && (
            <BestNineCategoryFields
              slot={index}
              value={slotCategories[index]}
              disabled={readOnly}
              onChange={(value) =>
                onCategoriesChange(
                  slotCategories.map((categories, slot) =>
                    slot === index ? value : categories,
                  ),
                )
              }
            />
          )}
        </Stack>
      ))}
    </Stack>
  );
}
