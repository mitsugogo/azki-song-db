import DiscographyPage from "./client";
import type { Metadata, ResolvingMetadata } from "next";
import { metadata } from "../layout";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Discography";
  const subtitle = "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: "Discography | AZKi Song Database",
    description: "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲",
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default function Page() {
  return <DiscographyPage />;
}
