"use client";

import { Link } from "@/i18n/navigation";
import { Button, Group } from "@mantine/core";
import { useTranslations } from "next-intl";
import { HiChartBar, HiViewList } from "react-icons/hi";

export default function StreamArchivesNavigation({
  active,
}: {
  active: "stats" | "list";
}) {
  const t = useTranslations("Archives");

  return (
    <nav aria-label={t("sectionNavigationLabel")} className="mb-6">
      <Group gap="xs">
        <Button
          component={Link}
          href="/stream-archives"
          variant={active === "stats" ? "filled" : "light"}
          aria-current={active === "stats" ? "page" : undefined}
          leftSection={<HiChartBar />}
        >
          {t("statsTabLabel")}
        </Button>
        <Button
          component={Link}
          href="/stream-archives/list"
          variant={active === "list" ? "filled" : "light"}
          aria-current={active === "list" ? "page" : undefined}
          leftSection={<HiViewList />}
        >
          {t("listTabLabel")}
        </Button>
      </Group>
    </nav>
  );
}
