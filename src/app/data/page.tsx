import { Suspense } from "react";
import { Breadcrumbs } from "@mantine/core";
import ClientTable from "./client";
import Loading from "../loading";
import Link from "next/link";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../theme";

import { siteConfig, baseUrl } from "@/app/config/siteConfig";

import type { Metadata } from "next";
import { metadata } from "../layout";

export async function generateMetadata(): Promise<Metadata> {
  const title = "収録データ一覧";
  const subtitle = "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");
  const canonical = new URL("/data", baseUrl).toString();
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    ...metadata,
    title: `収録データ一覧 | ${siteConfig.siteName}`,
    description:
      "AZKiさんの歌枠のセトリやオリジナル楽曲・カバー楽曲などをまとめています",
    openGraph: {
      ...metadata.openGraph,
      title,
      description:
        "AZKiさんの歌枠のセトリやオリジナル楽曲・カバー楽曲などをまとめています",
      url: canonical,
      siteName: siteConfig.siteName,
      locale: "ja_JP",
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description:
        "AZKiさんの歌枠のセトリやオリジナル楽曲・カバー楽曲などをまとめています",
      images: [ogImagePath],
    },
    alternates: {
      canonical,
    },
  };
}

export default async function DataPage() {
  return (
    <div className="grow lg:p-6 lg:pb-0">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </Link>
        <Link href="/data" className={breadcrumbClasses.link}>
          収録データ
        </Link>
      </Breadcrumbs>

      <Suspense fallback={<Loading />}>
        <ClientTable />
      </Suspense>
    </div>
  );
}
