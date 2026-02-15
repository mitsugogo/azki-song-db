import { Suspense } from "react";
import ClientTable from "./client";
import Loading from "../loading";
import { Breadcrumb, BreadcrumbItem } from "flowbite-react";
import { HiHome } from "react-icons/hi";

import { siteConfig, baseUrl } from "@/app/config/siteConfig";

import type { Metadata, ResolvingMetadata } from "next";
import { metadata } from "../layout";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const title = "収録データ一覧";
  const subtitle = "AZKiさんのこれまでのオリジナル楽曲やカバー楽曲";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);

  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: `収録データ一覧 | ${siteConfig.siteName}`,
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
    <div className="grow lg:p-6 lg:pb-0">
      <Breadcrumb aria-label="Breadcrumb" className="mb-3">
        <BreadcrumbItem href="/">
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </BreadcrumbItem>
        <BreadcrumbItem href="/data">収録データ</BreadcrumbItem>
      </Breadcrumb>

      <Suspense fallback={<Loading />}>
        <ClientTable />
      </Suspense>
    </div>
  );
}
