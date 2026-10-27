import { bestNineOgSize } from "@/app/lib/myBestNineSongsOg";
import type { Metadata } from "next";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import { getLocale, getTranslations } from "next-intl/server";
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

  const locale = await getLocale();
  const tMeta = await getTranslations({ namespace: "Metadata.share", locale });

  let pageTitle =
    tMeta("myBest9Title", { siteName: siteConfig.siteName }) ?? "好きな曲9選";
  let description =
    tMeta("myBest9Description") ?? "AZKiの好きな曲をシェアしています";
  let ogTitle = tMeta("myBest9OgTitle") ?? "好きな曲9選";
  let ogDescription = tMeta("myBest9OgDescription") ?? "AZKiの好きな曲9選";

  if (selection) {
    pageTitle = `${selection.title}${selection.author ? ` | ${selection.author}` : ""} | ${siteConfig.siteName}`;
    ogTitle = `${selection.title}${selection.author ? ` by ${selection.author}` : ""}`;
    ogDescription = `AZKiの好きな曲${selection.songs.length}選`;
  }

  // OG 画像 URL
  const ogImageUrl = new URL("/api/og/share/my-best-9-songs", baseUrl);
  ogImageUrl.searchParams.set("id", id);
  ogImageUrl.searchParams.set("hl", locale);
  ogImageUrl.searchParams.set("w", String(bestNineOgSize.width));
  ogImageUrl.searchParams.set("h", String(bestNineOgSize.height));
  ogImageUrl.searchParams.set("v", "cards-v2");

  // Canonical URL
  const canonical = new URL(`/share/my-best-9-songs/${id}`, baseUrl);
  const ogImagePath = `${ogImageUrl.pathname}${ogImageUrl.search}`;

  return {
    title: pageTitle,
    description: ogDescription,
    openGraph: {
      title: pageTitle,
      description: ogDescription,
      url: canonical.toString(),
      siteName: siteConfig.siteName,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      images: [
        {
          url: ogImagePath,
          ...bestNineOgSize,
          alt: ogTitle,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
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
