import StatisticsPage from "./client";

import type { Metadata } from "next";
import { metadata } from "../layout";
import Link from "next/link";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../theme";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";

export async function generateMetadata(): Promise<Metadata> {
  const title = "統計情報";
  const subtitle =
    "AZKiさんの歌枠のセトリやオリジナル楽曲・カバー楽曲などをまとめています";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: `統計情報 | ${siteConfig.siteName}`,
    description:
      "AZKiさんの歌枠のセトリやオリジナル楽曲・カバー楽曲などをまとめています",
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default function Page() {
  return (
    <div className="grow p-2 lg:p-6 lg:pb-10">
      <nav aria-label="Breadcrumb" className={breadcrumbClasses.root}>
        <div className="flex items-center">
          <Link href="/" className={breadcrumbClasses.link}>
            <HiHome className="w-4 h-4 mr-1.5" /> Home
          </Link>
          <HiChevronRight className={breadcrumbClasses.separator} />
          <Link href="/statistics" className={breadcrumbClasses.link}>
            統計情報
          </Link>
        </div>
      </nav>
      <StatisticsPage />
    </div>
  );
}
