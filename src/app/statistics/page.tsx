import StatisticsPage from "./client";

import type { Metadata } from "next";
import { metadata } from "../layout";
import { Breadcrumb, BreadcrumbItem } from "flowbite-react";
import { HiHome } from "react-icons/hi";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.PUBLIC_BASE_URL ??
  (process.env.NODE_ENV === "development"
    ? `http://localhost:${process.env.PORT ?? 3000}`
    : "https://azki-song-db.vercel.app/");

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
    title: "統計情報 | AZKi Song Database",
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
    <div className="grow lg:p-6 lg:pb-0">
      <Breadcrumb aria-label="Breadcrumb" className="mb-3">
        <BreadcrumbItem href="/">
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </BreadcrumbItem>
        <BreadcrumbItem href="/statistics">統計情報</BreadcrumbItem>
      </Breadcrumb>
      <StatisticsPage />
    </div>
  );
}
