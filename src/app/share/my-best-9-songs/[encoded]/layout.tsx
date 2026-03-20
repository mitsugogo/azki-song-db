import type { Metadata } from "next";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import type { MyBestNineSongs } from "@/app/hook/useMyBestNineSongs";

type Props = {
  params: Promise<{ encoded: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.encoded;
  let selection: MyBestNineSongs | null = null;

  try {
    const response = await fetch(`${baseUrl}/api/share/my-best-9-songs/${id}`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as { selection?: MyBestNineSongs };
      if (data.selection) {
        selection = data.selection;
      }
    }
  } catch {
    // 取得失敗時はデフォルトメタデータを使用
  }

  let pageTitle = "好きな曲9選";
  let description = "AZKiの好きな曲をシェアしています";
  let ogTitle = "好きな曲9選";
  let ogDescription = "AZKiの好きな曲9選";

  if (selection) {
    pageTitle = `${selection.title}${selection.author ? ` | ${selection.author}` : ""} | ${siteConfig.siteName}`;
    ogTitle = `${selection.title}${selection.author ? ` by ${selection.author}` : ""}`;
    ogDescription = `AZKiの好きな曲${selection.songs.length}選`;
  }

  // OG 画像 URL
  const ogImageUrl = new URL("/api/og/share/my-best-9-songs", baseUrl);
  ogImageUrl.searchParams.set("id", id);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  // Canonical URL
  const canonical = new URL(`/share/my-best-9-songs/${id}`, baseUrl);
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: pageTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical.toString(),
      siteName: siteConfig.siteName,
      locale: "ja_JP",
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImagePath],
    },
    alternates: {
      canonical: canonical.toString(),
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
