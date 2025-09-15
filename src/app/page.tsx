import type { Metadata, ResolvingMetadata } from "next";
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
  const { q, v, t } = await searchParams;

  const title = "AZKi Song Database";
  let subtitle = "AZKiさんの歌の素晴らしさを伝えるサイト";

  let ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  if (q) {
    const isSololive2025 = q === "sololive2025";
    if (isSololive2025) {
      subtitle = "ソロライブに向けたオリ曲予習用プレイリスト";
    } else {
      subtitle = `「${q}」の検索結果`;
    }

    ogImageUrl.searchParams.set("title", title);
    ogImageUrl.searchParams.set("subtitle", subtitle);
    ogImageUrl.searchParams.set("titlecolor", "b81e8a");
  }
  if (v && t) {
    ogImageUrl = new URL("/api/og/thumb", baseUrl);
    ogImageUrl.searchParams.set("v", v?.toString());
    ogImageUrl.searchParams.set("t", t?.toString());
  }

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
