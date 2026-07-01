import { siteConfig } from "@/app/config/siteConfig";
import type React from "react";

export const ogFontFamily = "Zen Maru Gothic";
const fallbackFontFamily = "Noto Sans JP";

export const ogColors = {
  background: "#fffafc",
  ink: "#2d2430",
  muted: "#685f68",
  primary: "#be185d",
  primaryDeep: "#831844",
  cyan: "#0891b2",
  cyanSoft: "#e5f8ff",
  pinkSoft: "#fdf2f7",
  line: "rgba(49, 34, 58, 0.12)",
  card: "rgba(255, 255, 255, 0.9)",
};

const googleFontBase =
  "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic";
const googleFallbackFontBase =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+JP";

export const normalizeOgText = (value: string) => value.replace(/～/g, "〜");

const fetchGoogleFont = async (
  familyBase: string,
  weight: 400 | 700 | 900,
  text: string,
) => {
  const css = await fetch(
    `${familyBase}:wght@${weight}&text=${encodeURIComponent(text)}`,
  ).then((res) => res.text());
  const url = css
    .match(
      /src:\s*url\(([^)]+)\)\s*format\(['"]?(woff2|woff|opentype|truetype)['"]?\)/,
    )?.[1]
    ?.replace(/^["']|["']$/g, "");

  if (!url) throw new Error("OG font not found");

  return fetch(url).then((res) => res.arrayBuffer());
};

export const fetchOgFonts = async (textSeed: string) => {
  const seed = [
    siteConfig.siteName,
    siteConfig.siteSlug,
    "AZKi Song Database",
    "Song Database",
    "Music Archive",
    "Songs",
    "Streamed",
    "配信",
    "好きな曲9選",
    "♪ 1234567890-/.,:・...…",
    normalizeOgText(textSeed),
  ].join("");

  const [regular, bold, black, fallbackRegular, fallbackBold, fallbackBlack] =
    await Promise.all([
      fetchGoogleFont(googleFontBase, 400, seed),
      fetchGoogleFont(googleFontBase, 700, seed),
      fetchGoogleFont(googleFontBase, 900, seed),
      fetchGoogleFont(googleFallbackFontBase, 400, seed),
      fetchGoogleFont(googleFallbackFontBase, 700, seed),
      fetchGoogleFont(googleFallbackFontBase, 900, seed),
    ]);

  return [
    {
      name: ogFontFamily,
      data: regular,
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: ogFontFamily,
      data: bold,
      style: "normal" as const,
      weight: 700 as const,
    },
    {
      name: ogFontFamily,
      data: black,
      style: "normal" as const,
      weight: 900 as const,
    },
    {
      name: fallbackFontFamily,
      data: fallbackRegular,
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: fallbackFontFamily,
      data: fallbackBold,
      style: "normal" as const,
      weight: 700 as const,
    },
    {
      name: fallbackFontFamily,
      data: fallbackBlack,
      style: "normal" as const,
      weight: 900 as const,
    },
  ];
};

export const ogImageHeaders = {
  "Content-Type": "image/png",
  "Cache-Control": "s-maxage=604800, stale-while-revalidate=900",
};

export const OgBackground = () => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        backgroundColor: ogColors.background,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 28,
        display: "flex",
        borderRadius: 34,
        border: "2px solid rgba(255, 255, 255, 0.28)",
      }}
    />
  </>
);

export const OgShell = ({
  children,
  padding = "58px 72px",
  justifyContent = "space-between",
}: {
  children: React.ReactNode;
  padding?: string;
  justifyContent?: "center" | "flex-start" | "space-between";
}) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent,
      alignItems: "stretch",
      padding,
      position: "relative",
      overflow: "hidden",
      fontFamily: `${ogFontFamily}, ${fallbackFontFamily}`,
      color: ogColors.ink,
      backgroundColor: ogColors.background,
    }}
  >
    <OgBackground />
    {children}
  </div>
);

export const BrandBadge = ({ label = "Song Database" }: { label?: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      alignSelf: "flex-start",
      padding: "12px 18px",
      borderRadius: 18,
      backgroundColor: "rgba(255, 250, 252, 0.9)",
      color: ogColors.primaryDeep,
      fontSize: 22,
      fontWeight: 600,
    }}
  >
    <div style={{ display: "flex" }}>{siteConfig.siteName}</div>
    <div
      style={{
        display: "flex",
        width: 1,
        height: 24,
        backgroundColor: ogColors.line,
      }}
    />
    <div
      style={{
        display: "flex",
        color: ogColors.primary,
        fontSize: 18,
      }}
    >
      {label}
    </div>
  </div>
);

export const OgFooter = ({
  right = siteConfig.siteSlug,
}: {
  right?: string;
}) => (
  <div
    style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 20,
      color: ogColors.muted,
      fontSize: 20,
      fontWeight: 400,
    }}
  >
    <div style={{ display: "flex" }}>{siteConfig.siteName}</div>
    <div
      style={{
        display: "flex",
        color: ogColors.primary,
        fontWeight: 700,
      }}
    >
      {right}
    </div>
  </div>
);

export const InfoPill = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "10px 16px",
      borderRadius: 14,
      backgroundColor: "rgba(255, 255, 255, 0.84)",
      color: ogColors.primary,
      fontSize: 20,
      fontWeight: 700,
      maxWidth: 720,
      lineClamp: '1 "..."',
    }}
  >
    {children}
  </div>
);
