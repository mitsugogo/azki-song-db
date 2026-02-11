import Link from "next/link";
import type { Metadata } from "next";
import { metadata } from "../layout";
import { Breadcrumb, BreadcrumbItem } from "flowbite-react";
import { FaHome } from "react-icons/fa";
import SummaryTopClient from "./client";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.PUBLIC_BASE_URL ??
  (process.env.NODE_ENV === "development"
    ? `http://localhost:${process.env.PORT ?? 3000}`
    : "https://azki-song-db.vercel.app/");

export async function generateMetadata(): Promise<Metadata> {
  const title = "年ごとの活動記録";
  const subtitle =
    "年ごとの活動（収録楽曲数・カバー/オリ曲など）をまとめています";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: `${title} | AZKi Song Database`,
    description: subtitle,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function Page() {
  const activityStart = new Date(2018, 10, 15);
  const now = new Date();
  const activityDays =
    Math.floor(
      (now.getTime() - activityStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const avtivityDurationStr = (() => {
    let years = now.getFullYear() - activityStart.getFullYear();
    let months = now.getMonth() - activityStart.getMonth();
    let days = now.getDate() - activityStart.getDate();

    // 日がマイナスになった場合、1ヶ月分戻して日数を調整
    if (days < 0) {
      months -= 1;
      // 前月の末日を取得して、足りない日数を足す
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      days += previousMonthEnd.getDate();
    }

    // 月がマイナスになった場合、1年分戻して月数を調整
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    let result = "";
    if (years > 0) {
      result += `${years}年`;
    }
    result += `${months}ヶ月`;
    result += `${days}日`;
    return result;
  })();

  // Flowbite Breadcrumb will be rendered directly in JSX below

  return (
    <div className="grow lg:p-6 lg:pb-0">
      <div className="mb-4">
        <Breadcrumb aria-label="Breadcrumb" className="mb-3">
          <BreadcrumbItem href="/">
            <FaHome className="inline mr-1" /> Home
          </BreadcrumbItem>
          <BreadcrumbItem href="/summary">活動記録</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <h1 className="font-extrabold text-2xl p-3">活動記録</h1>

      <div className="p-3">
        <p className="text-sm text-light-gray-400 mb-4">
          各年ごとの活動の要約ページです。年をクリックすると詳細ページへ移動します。
        </p>
        <p className="text-sm text-light-gray-400 mb-4">
          活動日数: <span className="font-semibold">{activityDays}</span>
          日目（2018/11/15 から {avtivityDurationStr}経過）
        </p>

        <SummaryTopClient />
      </div>
    </div>
  );
}
