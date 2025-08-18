import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeModeScript } from "flowbite-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

// URLにq={value}があったら、OGPのsubtitleを変える
const url = new URL(baseUrl);
const searchTerm = url.searchParams.get("q") || "";
const subtitle = searchTerm
  ? `「${searchTerm}」の検索結果`
  : "AZKiさんの歌枠の素晴らしさを伝えるサイト";
export const metadata: Metadata = {
  title: "AZKi Song Database",
  description:
    "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲をまとめています。",

  openGraph: {
    title: "AZKi Song Database",
    description:
      "ホロライブのAZKiさんの歌を楽しむためのデータベース。歌枠やオリ曲、ライブ等で歌唱した楽曲をまとめています。",
    url: "https://azki-song-db.vercel.app/",
    siteName: "AZKi Song Database",
    locale: "ja_JP",
    type: "website",
    images: [
      `${baseUrl}/api/og?title=AZKi Song Database&subtitle=${subtitle}&titlecolor=b81e8a&w=1200&h=630`,
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <ThemeModeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}
