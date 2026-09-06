import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/app/config/siteConfig";
import {
  fetchOgFonts,
  getOgBackgroundImageUrl,
  normalizeOgText,
} from "./ogDesign";

export const runtime = "edge";

const genericOgImageHeaders = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=604800, stale-while-revalidate=900",
  "Vercel-CDN-Cache-Control": "public, max-age=31536000",
};

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const { searchParams } = requestUrl;
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
    const titleLength = Array.from(title).length;
    const titleFontSize = titleLength > 56 ? 46 : titleLength > 36 ? 56 : 72;
    const subTitleFontSize = Array.from(subTitle).length > 58 ? 28 : 34;
    const backgroundUrl = getOgBackgroundImageUrl(requestUrl.origin);
    const fonts = await fetchOgFonts(
      `${title || siteConfig.siteName}${subTitle || ""}`,
    );

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#fff6fa",
          fontFamily: '"Noto Sans JP", "Noto Sans", sans-serif',
        }}
      >
        <img
          src={backgroundUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: "236px 60px 112px",
          }}
        >
          <div
            style={{
              display: "block",
              maxWidth: 790,
              lineClamp: 2,
              overflow: "hidden",
              color: `#${titleColor}`,
              fontSize: titleFontSize,
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: -1.2,
              paddingBottom: 12,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: subTitle ? "block" : "none",
              maxWidth: 830,
              marginTop: 16,
              lineClamp: 2,
              overflow: "hidden",
              color: `#${subTitleColor}`,
              fontSize: subTitleFontSize,
              fontWeight: 400,
              lineHeight: 1.42,
            }}
          >
            {subTitle}
          </div>
        </div>
      </div>,
      {
        width: Number.parseInt(width, 10),
        height: Number.parseInt(height, 10),
        fonts,
        headers: genericOgImageHeaders,
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(`${e.message}`);
    }
    return new Response("Failed to generate the image", {
      status: 500,
    });
  }
}
