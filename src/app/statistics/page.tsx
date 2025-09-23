import StatisticsPage from "./client";

import type { Metadata } from "next";
import { metadata } from "../layout";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

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
  return <StatisticsPage />;
}
