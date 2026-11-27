"use client";

import {
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslations } from "next-intl";

export type SeichiMapLayerOption = {
  name: string;
  visible: boolean;
  /** 「3 / 20 (15%)」のような進捗の表示文字列 */
  progressLabel: string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  layers: SeichiMapLayerOption[];
  onToggle: (layerName: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
};

/**
 * 表示レイヤーの選択。パネル内で展開するとリストが隠れるため、モーダルに出す。
 * スマホではフルスクリーンにする。
 */
export function SeichiMapLayerDialog({
  opened,
  onClose,
  layers,
  onToggle,
  onShowAll,
  onHideAll,
}: Props) {
  const t = useTranslations("SeichiMapComplete");
  const isSmallScreen = useMediaQuery("(max-width: 48em)");
  const visibleCount = layers.filter((layer) => layer.visible).length;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("layers.summary", {
        visible: visibleCount,
        total: layers.length,
      })}
      fullScreen={Boolean(isSmallScreen)}
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="sm">
        <Group gap="xs">
          <Button
            variant="light"
            color="gray"
            size="compact-sm"
            onClick={onShowAll}
          >
            {t("layers.showAll")}
          </Button>
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            onClick={onHideAll}
          >
            {t("layers.hideAll")}
          </Button>
        </Group>
        <Stack gap="sm">
          {layers.map((layer) => (
            <Checkbox
              key={layer.name}
              checked={layer.visible}
              onChange={() => onToggle(layer.name)}
              label={
                <Group
                  justify="space-between"
                  gap="xs"
                  wrap="nowrap"
                  style={{ minWidth: 0 }}
                >
                  <Text size="sm" fw={600} lineClamp={2}>
                    {layer.name}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                    {layer.progressLabel}
                  </Text>
                </Group>
              }
            />
          ))}
        </Stack>
      </Stack>
    </Modal>
  );
}
