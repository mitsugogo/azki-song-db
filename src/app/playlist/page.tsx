import PlaylistDetailPage from "./client";
import type { Metadata } from "next";
import { metadata } from "../layout";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.PUBLIC_BASE_URL ??
  (process.env.NODE_ENV === "development"
    ? `http://localhost:${process.env.PORT ?? 3000}`
    : "https://azki-song-db.vercel.app/");

export async function generateMetadata(): Promise<Metadata> {
  const title = "プレイリスト";
  const subtitle = "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲";
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: "プレイリスト | AZKi Song Database",
    description: "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲",
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default function Page() {
  return <PlaylistDetailPage />;
}
