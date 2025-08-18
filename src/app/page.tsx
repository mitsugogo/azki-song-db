import type { Metadata, ResolvingMetadata } from "next";
import "./globals.css";
import ClientTop from "./client";
import { metadata } from "./layout";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { q } = await searchParams;

  const subtitle = q
    ? `「${q}」の検索結果`
    : "AZKiさんの歌枠の素晴らしさを伝えるサイト";

  // URLオブジェクトを生成して、クエリパラメータを安全に設定します。
  // これにより、Next.jsが自動的に適切なエンコードを行います。
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", "AZKi Song Database");
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default function Home() {
  return <ClientTop />;
}
