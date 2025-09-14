import { Suspense } from "react";
import ClientTable from "./client";
import Loading from "../loading";

import type { Metadata, ResolvingMetadata } from "next";
import { metadata } from "../layout";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { q, v, t } = await searchParams;

  const title = "収録データ一覧";
  const subtitle = "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: "収録データ一覧 | AZKi Song Database",
    description:
      "AZKiさんの歌枠のセトリやオリジナル楽曲・カバー楽曲などをまとめています",
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function DataPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <ClientTable />
      </Suspense>
    </>
  );
}
