import { Metadata } from "next";
import SearchPageClient from "./client";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

export const metadata: Metadata = {
  title: "検索 | AZKi Song Database",
  description: "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
  openGraph: {
    title: "検索",
    description: "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
    url: "https://azki-song-db.vercel.app/search",
    type: "website",
    siteName: "AZKi Song Database",
    locale: "ja_JP",
    images: [
      {
        url: `${baseUrl}api/og?title=検索&subtitle=楽曲を検索できます&w=1200&h=630`,
        width: 1200,
        height: 630,
        alt: "AZKi Song Database - 検索",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function SearchPage() {
  return <SearchPageClient />;
}
