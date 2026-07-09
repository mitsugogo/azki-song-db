import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/app/config/siteConfig";
import {
  fetchOgFonts,
  ogColors,
  ogImageHeaders,
  OgShell,
  normalizeOgText,
} from "./ogDesign";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const hasTitle = searchParams.has("title");
    const title = hasTitle
      ? normalizeOgText(searchParams.get("title")?.slice(0, 100) ?? "")
      : siteConfig.siteName;

    const titleColor = searchParams.get("titlecolor") || "8c1748";

    const hasSubTitle = searchParams.has("subtitle");
    const subTitle = hasSubTitle
      ? normalizeOgText(searchParams.get("subtitle")?.slice(0, 100) ?? "")
      : "";

    const subTitleColor = searchParams.get("subtitlecolor") || "9d3d68";

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";

    const fonts = await fetchOgFonts(
      `${title || siteConfig.siteName}${subTitle || ""}`,
    );

    return new ImageResponse(
      <OgShell justifyContent="center">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            position: "relative",
            maxWidth: 1000,
            padding: "42px 46px 40px",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              display: "block",
              fontSize: 64,
              fontWeight: 700,
              color: `#${titleColor}`,
              lineHeight: 1.18,
              letterSpacing: 0,
              overflow: "hidden",
              lineClamp: '3 "..."',
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: subTitle ? "block" : "none",
              fontSize: 34,
              fontStyle: "normal",
              color: `#${subTitleColor}`,
              lineHeight: 1.42,
              maxWidth: 840,
              overflow: "hidden",
              lineClamp: '2 "..."',
            }}
          >
            {subTitle}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 58,
            display: "flex",
            color: ogColors.primary,
            fontSize: 21,
            fontWeight: 700,
          }}
        >
          {siteConfig.siteName}
        </div>
      </OgShell>,
      {
        width: parseInt(width),
        height: parseInt(height),
        fonts,
        headers: ogImageHeaders,
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(`${e.message}`);
    }
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
