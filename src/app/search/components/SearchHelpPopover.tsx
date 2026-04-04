import { Popover, Button, Stack, Group, Text, Badge } from "@mantine/core";
import { HiQuestionMarkCircle } from "react-icons/hi";
import { useTranslations } from "next-intl";

export default function SearchHelpPopover() {
  const t = useTranslations("SearchHelp");

  return (
    <Popover position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Button
          variant="subtle"
          size="xs"
          p={0}
          aria-label={t("title")}
          title={t("title")}
        >
          <HiQuestionMarkCircle size={20} />
        </Button>
      </Popover.Target>
      <Popover.Dropdown className="w-80 max-w-sm">
        <Stack gap="md" className="p-2">
          <Text fw={600} size="sm">
            {t("title")}
          </Text>

          {/* AND検索 */}
          <div>
            <Group mb="xs">
              <Badge size="sm">{t("andSearch")}</Badge>
            </Group>
            <Text size="xs" className="mb-2">
              {t("andSearchDesc")}
            </Text>
            <code className="text-xs bg-light-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded block">
              {t("andSearchExample")}
            </code>
          </div>

          {/* OR検索 */}
          <div>
            <Group mb="xs">
              <Badge size="sm">{t("orSearch")}</Badge>
            </Group>
            <Text size="xs" className="mb-2">
              {t("orSearchDesc")}
            </Text>
            <code className="text-xs bg-light-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded block">
              {t("orSearchExample")}
            </code>
          </div>

          {/* 完全一致検索 */}
          <div>
            <Group mb="xs">
              <Badge size="sm">{t("exactMatch")}</Badge>
            </Group>
            <Text size="xs" className="mb-2">
              {t("exactMatchDesc")}
            </Text>
            <code className="text-xs bg-light-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded block">
              {t("exactMatchExample")}
            </code>
          </div>

          {/* 利用可能なプレフィックス */}
          <div>
            <Text fw={600} size="xs" mb="xs">
              {t("supportedPrefixes")}
            </Text>
            <Stack gap="xs" className="text-xs">
              <Text className="opacity-75" size="xs">
                {t("prefixTitle")}
              </Text>
              <Text className="opacity-75" size="xs">
                {t("prefixArtist")}
              </Text>
              <Text className="opacity-75" size="xs">
                {t("prefixAlbum")}
              </Text>
              <Text className="opacity-75" size="xs">
                {t("prefixTag")}
              </Text>
              <Text className="opacity-75" size="xs">
                {t("prefixYear")}
              </Text>
              <Text className="opacity-75" size="xs">
                {t("prefixSeason")}
              </Text>
            </Stack>
          </div>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
