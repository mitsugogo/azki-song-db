"use client";
import { Alert, MultiSelect, Select, Stack, TagsInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { BestNineSettings } from "@/app/lib/bestNineSettings";
import useBestNineLiveCatalog from "@/app/hook/useBestNineLiveCatalog";

export default function BestNineSettingsFields({
  value,
  onChange,
  disabled = false,
}: {
  value: BestNineSettings;
  onChange: (value: BestNineSettings) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Share.myBest9.settings");
  return (
    <Stack gap="sm">
      <Select
        label={t("songCount")}
        value={String(value.songCount ?? 9)}
        data={Array.from({ length: 9 }, (_, index) => ({
          value: String(index + 1),
          label: t("countOption", { count: index + 1 }),
        }))}
        allowDeselect={false}
        disabled={disabled}
        onChange={(count) =>
          count && onChange({ ...value, songCount: Number(count) })
        }
      />
      <TagsInput
        label={t("hashtags")}
        description={t("hashtagHelp")}
        value={value.hashtags ?? []}
        maxTags={5}
        maxLength={50}
        splitChars={[",", " ", "、"]}
        disabled={disabled}
        onChange={(hashtags) =>
          onChange({
            ...value,
            hashtags: hashtags.map((tag) => tag.replace(/^[#＃]+/, "")),
          })
        }
      />
    </Stack>
  );
}

export function BestNineLivePerformanceField({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Share.myBest9.settings");
  const { groups, loading, error } = useBestNineLiveCatalog();
  const performances = groups.flatMap((group) => group.performances);
  const options = performances.map((performance) => ({
    value: performance.id,
    label: [performance.title, performance.performance, performance.date]
      .filter(Boolean)
      .join(" / "),
  }));
  for (const id of value) {
    if (!options.some((option) => option.value === id))
      options.push({ value: id, label: id });
  }
  return (
    <>
      <MultiSelect
        label={t("livePerformances")}
        description={t("liveHelp")}
        data={options}
        value={value}
        searchable
        clearable
        disabled={disabled || loading}
        onChange={onChange}
      />
      {error && <Alert color="red">{t("liveError")}</Alert>}
    </>
  );
}
