"use client";

import { Link } from "@/i18n/navigation";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";
import { Breadcrumbs } from "@mantine/core";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";

type DiscographyBreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

export default function DiscographyBreadcrumbs({
  items,
}: {
  items: DiscographyBreadcrumbItem[];
}) {
  const t = useTranslations("Discography");
  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      className={breadcrumbClasses.root}
      separator={<HiChevronRight className={breadcrumbClasses.separator} />}
    >
      <Link href="/" className={breadcrumbClasses.link}>
        <HiHome className="w-4 h-4 mr-1.5" /> {t("homeLabel")}
      </Link>
      <Link href="/discography" className={breadcrumbClasses.link}>
        {t("breadcrumb")}
      </Link>
      {items.map((item, index) => {
        const key = item.href ? `${item.href}-${index}` : `item-${index}`;
        if (item.href) {
          return (
            <Link key={key} href={item.href} className={breadcrumbClasses.link}>
              {item.label}
            </Link>
          );
        }

        return (
          <span key={key} className={breadcrumbClasses.link}>
            {item.label}
          </span>
        );
      })}
    </Breadcrumbs>
  );
}
