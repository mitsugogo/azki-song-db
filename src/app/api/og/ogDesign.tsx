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

  const [
    regular,
    bold,
    black,
    fallbackRegular,
    fallbackBold,
    fallbackBlack,
  ] = await Promise.all([
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
        backgroundImage:
          "linear-gradient(135deg, #fffafc 0%, #fdf2f7 46%, #eef8ff 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        opacity: 0.52,
        backgroundImage:
          "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.42) 42%, rgba(253, 242, 248, 0.92) 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: -80,
        top: 38,
        display: "flex",
        width: 480,
        height: 220,
        borderRadius: 999,
        background:
          "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.34) 58%, transparent 78%)",
        filter: "blur(18px)",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: -60,
        bottom: 14,
        display: "flex",
        width: 420,
        height: 260,
        borderRadius: 999,
        background:
          "radial-gradient(ellipse at center, rgba(190, 24, 93, 0.12), rgba(190, 24, 93, 0.05) 52%, transparent 76%)",
        filter: "blur(18px)",
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
      padding: "10px 16px",
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      border: `1px solid ${ogColors.line}`,
      color: ogColors.primary,
      fontSize: 22,
      fontWeight: 700,
      boxShadow: "0 18px 46px rgba(190, 24, 93, 0.12)",
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
        color: ogColors.muted,
        fontSize: 18,
        fontWeight: 400,
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
      border: `1px solid ${ogColors.line}`,
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
