import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const hasTitle = searchParams.has("title");
    const title = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : siteConfig.siteName;

    const titleColor = searchParams.get("titlecolor") || "8c1748";

    const hasSubTitle = searchParams.has("subtitle");
    const subTitle = hasSubTitle
      ? searchParams.get("subtitle")?.slice(0, 100)
      : "";

    const subTitleColor = searchParams.get("subtitlecolor") || "9d3d68";

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";

    const notoSansRegular = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&text=" +
        encodeURIComponent(title || siteConfig.siteName) +
        encodeURIComponent(subTitle || `🎵 ${siteConfig.siteName}`) +
        encodeURIComponent("...…"),
    )
      .then((res) => res.text())
      .then((css) => {
        const url = css.match(
          /src: url\((.+)\) format\('(opentype|truetype)'\)/,
        )?.[1];
        if (!url) throw new Error("Font not found");
        return fetch(url).then((res) => res.arrayBuffer());
      });

    const notoSansBold = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=" +
        encodeURIComponent(title || siteConfig.siteName) +
        encodeURIComponent(subTitle || `🎵 ${siteConfig.siteName}`) +
        encodeURIComponent(siteConfig.siteSlug) +
        encodeURIComponent("...…"),
    )
      .then((res) => res.text())
      .then((css) => {
        const url = css.match(
          /src: url\((.+)\) format\('(opentype|truetype)'\)/,
        )?.[1];
        if (!url) throw new Error("Font not found");
        return fetch(url).then((res) => res.arrayBuffer());
      });

    return new ImageResponse(
      <div
        style={{
          backgroundColor: "#fdf7fb",
          backgroundImage:
            "linear-gradient(135deg, #fff7fb 0%, #ffeef7 46%, #f5f3ff 100%)",
          backgroundSize: "100% 100%",
          height: "100%",
          width: "100%",
          display: "flex",
          textAlign: "left",
          alignItems: "stretch",
          justifyContent: "space-between",
          flexDirection: "column",
          flexWrap: "nowrap",
          fontFamily: "Noto Sans JP",
          padding: "80px 96px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景の装飾レイヤー */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.96,
            backgroundImage:
              "radial-gradient(560px 320px at 12% 92%, rgba(145, 184, 255, 0.12), transparent 62%), linear-gradient(180deg, rgba(255, 237, 246, 0.48) 0%, rgba(255, 237, 246, 0.18) 30%, rgba(255, 237, 246, 0) 58%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-120px",
            top: "-80px",
            width: "420px",
            height: "420px",
            borderRadius: "999px",
            background:
              "linear-gradient(150deg, rgba(255, 205, 226, 0.3), rgba(220, 226, 255, 0.16))",
            filter: "blur(24px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-160px",
            bottom: "-140px",
            width: "520px",
            height: "520px",
            borderRadius: "999px",
            background:
              "linear-gradient(165deg, rgba(206, 198, 255, 0.4), rgba(255, 205, 226, 0.3))",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 245, 250, 0.78)",
              color: "#c2185b",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.08em",
              alignSelf: "flex-start",
              border: "1px solid rgba(255, 228, 241, 0.9)",
              boxShadow: "0 16px 32px rgba(255, 140, 180, 0.16)",
            }}
          >
            {siteConfig.siteName}
          </div>
          <div
            style={{
              width: "100%",
              fontSize: 64,
              fontStyle: "normal",
              fontWeight: 700,
              color: `#${titleColor}`,
              lineHeight: 1.15,
              letterSpacing: "0.01em",
              textShadow: "0 10px 28px rgba(255, 255, 255, 0.7)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "block",
              fontSize: 36,
              fontStyle: "normal",
              color: `#${subTitleColor}`,
              lineHeight: 1.4,
              maxWidth: "850px",
            }}
          >
            {subTitle}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            paddingTop: "32px",
            color: "#9d3d68",
            fontSize: 22,
            fontWeight: 400,
            borderTop: "1px solid rgba(214, 92, 151, 0.16)",
          }}
        >
          <div style={{ letterSpacing: "0.12em" }}>
            {siteConfig.siteNameUpper}
          </div>
          <div style={{ fontSize: 20, color: "#c74a7d", fontWeight: 700 }}>
            {siteConfig.siteSlug}
          </div>
        </div>
      </div>,
      {
        width: parseInt(width),
        height: parseInt(height),
        fonts: [
          {
            name: "Noto Sans JP",
            data: notoSansRegular,
            style: "normal",
            weight: 400,
          },
          {
            name: "Noto Sans JP",
            data: notoSansBold,
            style: "normal",
            weight: 700,
          },
        ],
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "s-maxage=604800, stale-while-revalidate=900",
        },
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
