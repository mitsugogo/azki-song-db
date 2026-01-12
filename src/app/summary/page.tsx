import Link from "next/link";
import type { Metadata } from "next";
import { metadata } from "../layout";
import { Anchor, Breadcrumbs } from "@mantine/core";
import { FaHome } from "react-icons/fa";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

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
  const res = await fetch(`${baseUrl}/api/songs`, { cache: "no-store" });
  const songs = (await res.json()) as any[];

  const counts = songs.reduce<Record<number, number>>((acc, s) => {
    const y = Number(s.year);
    if (!Number.isNaN(y)) acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {});
  const years = Object.keys(counts)
    .map((k) => Number(k))
    .sort((a, b) => b - a);

  const breadcrumbItems = [
    {
      title: (
        <span>
          <FaHome className="inline-block mr-1" />
          Home
        </span>
      ),
      href: "/",
    },
    { title: "年ごとの活動記録", href: "/summary" },
  ].map((item, index) => (
    <Anchor href={item.href} key={index}>
      {item.title}
    </Anchor>
  ));

  // 年ごとのマイルストーンと達成日(broadcast_at)を取得
  const milestonesByYear = songs
    .sort(
      (a, b) =>
        new Date(a.broadcast_at).getTime() - new Date(b.broadcast_at).getTime()
    )
    .reduce<Record<number, { broadcast_at: string; milestones: string[] }[]>>(
      (acc, song) => {
        const year = Number(song.year);
        if (Number.isNaN(year)) return acc;
        if (!acc[year]) acc[year] = [];
        // 空のマイルストーンは除外
        if (!song.milestones || song.milestones.length === 0) return acc;

        // 重複するマイルストーンはスキップ
        if (
          acc[year].some((entry) =>
            entry.milestones.includes(song.milestones[0])
          )
        )
          return acc;

        acc[year].push({
          broadcast_at: song.broadcast_at,
          milestones: song.milestones || [],
        });
        return acc;
      },
      {}
    );

  return (
    <div className="flex-grow lg:p-6 lg:pb-0">
      <div className="mb-4">
        <Breadcrumbs separator="›">{breadcrumbItems}</Breadcrumbs>
      </div>
      <h1 className="font-extrabold text-2xl p-3">年ごとの活動記録</h1>

      <div className="p-3">
        <p className="text-sm text-light-gray-400 mb-4">
          各年ごとの活動の要約ページです。年をクリックすると詳細ページへ移動します。
        </p>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {years.map((year) => (
            <li
              key={year}
              className="border rounded p-3 hover:shadow-md transition-shadow duration-150 dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-gray-600"
            >
              <a href={`/summary/${year}`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{year}年</span>
                  <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1">
                    {counts[year]}曲
                  </span>
                </div>
                <div>
                  {milestonesByYear[year] && (
                    <ul className="mt-2 space-y-1">
                      {milestonesByYear[year]
                        .flat()
                        .map(
                          (
                            s: { broadcast_at: string; milestones: string[] },
                            idx: number
                          ) => (
                            <li
                              key={idx}
                              className="text-sm text-light-gray-600 dark:text-light-gray-400"
                            >
                              • {s.milestones.join(", ")} (
                              {new Date(s.broadcast_at).toLocaleDateString()})
                            </li>
                          )
                        )}
                    </ul>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
