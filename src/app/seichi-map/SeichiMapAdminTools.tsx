"use client";

import { Button, Collapse, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { FiChevronDown, FiChevronUp, FiTool } from "react-icons/fi";
import { useAdminMode } from "../context/AdminModeContext";

/**
 * 管理者だけに見える同期ツールの置き場。
 * 開いたままだと地図が下に押し出されるため、既定では折りたたんでおく。
 */
export function SeichiMapAdminTools({ children }: { children: ReactNode }) {
  const { enabled } = useAdminMode();
  const t = useTranslations("SeichiMapComplete");
  const [opened, { toggle }] = useDisclosure(false);

  if (!enabled) return null;

  return (
    <Stack gap="xs" mb="md">
      <Button
        variant="light"
        color="gray"
        size="compact-sm"
        w="fit-content"
        leftSection={<FiTool size={14} />}
        rightSection={
          opened ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
        }
        aria-expanded={opened}
        onClick={toggle}
      >
        {t("admin.toggle")}
      </Button>
      <Collapse expanded={opened}>{children}</Collapse>
    </Stack>
  );
}
