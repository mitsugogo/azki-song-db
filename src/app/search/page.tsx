import { Metadata } from "next";
import SearchPageClient from "./client";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const searchTerm = params.q || "";
  
  // unit:プレフィックスを検出
  const isUnitSearch = searchTerm.startsWith("unit:");
  const displayTerm = isUnitSearch 
    ? searchTerm.replace("unit:", "")
    : searchTerm;
  
  // OG画像のタイトルを生成
  let ogTitle = "検索";
  let ogSubtitle = "楽曲を検索できます";
  
  if (searchTerm) {
    if (isUnitSearch) {
      ogTitle = `👥 ${displayTerm}の検索結果`;
      ogSubtitle = "AZKi Song Database";
    } else {
      ogTitle = `「${displayTerm}」の検索結果`;
      ogSubtitle = "AZKi Song Database";
    }
  }

  return {
    title: searchTerm ? `${displayTerm}の検索結果 | AZKi Song Database` : "検索 | AZKi Song Database",
    description: "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
    openGraph: {
      title: ogTitle,
      description: "AZKiさんの楽曲をタグやアーティスト、曲名などから検索できます",
      url: `https://azki-song-db.vercel.app/search${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`,
      type: "website",
      siteName: "AZKi Song Database",
      locale: "ja_JP",
      images: [
        {
          url: `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}api/og?title=${encodeURIComponent(ogTitle)}&subtitle=${encodeURIComponent(ogSubtitle)}&w=1200&h=630`,
          width: 1200,
          height: 630,
          alt: `AZKi Song Database - ${ogTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default function SearchPage() {
  return <SearchPageClient />;
}
