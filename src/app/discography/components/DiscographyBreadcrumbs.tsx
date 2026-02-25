"use client";

import Link from "next/link";
import { Breadcrumbs } from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";
import { ReactNode } from "react";

type DiscographyBreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

export default function DiscographyBreadcrumbs({
  items,
}: {
  items: DiscographyBreadcrumbItem[];
}) {
  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      className={breadcrumbClasses.root}
      separator={<HiChevronRight className={breadcrumbClasses.separator} />}
    >
      <Link href="/" className={breadcrumbClasses.link}>
        <HiHome className="w-4 h-4 mr-1.5" /> Home
      </Link>
      <Link href="/discography" className={breadcrumbClasses.link}>
        楽曲一覧
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
