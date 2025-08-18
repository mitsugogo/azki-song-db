import type { Metadata } from "next";
import "./globals.css";
import ClientTop from "./client";
import { baseUrl, metadata } from "./layout";

export async function generateMetadata({
  searchParams = {},
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const searchTerm = typeof searchParams.q === "string" ? searchParams.q : "";

  const subtitle = searchTerm
    ? `「${searchTerm}」の検索結果`
    : "AZKiさんの歌枠の素晴らしさを伝えるサイト";

  // OGP画像URLに含めるsubtitleをURLエンコードします。
  const encodedSubtitle = encodeURIComponent(subtitle);

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [
        // エンコードされたsubtitleを使用するように修正
        `${baseUrl}/api/og?title=AZKi Song Database&subtitle=${encodedSubtitle}&titlecolor=b81e8a&w=1200&h=630`,
      ],
    },
  };
}

export default function Home() {
  return <ClientTop />;
}
