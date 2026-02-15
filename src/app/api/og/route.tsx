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

    const titleColor = searchParams.get("titlecolor") || "ffffff";

    const hasSubTitle = searchParams.has("subtitle");
    const subTitle = hasSubTitle
      ? searchParams.get("subtitle")?.slice(0, 100)
      : "";

    const subTitleColor = searchParams.get("subtitlecolor") || "ffe3f0";

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
          backgroundColor: "#1a0a12",
          backgroundImage:
            "linear-gradient(135deg, #1a0a12 0%, #3a0e2a 45%, #1d0a1b 100%)",
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
            opacity: 0.9,
            backgroundImage:
              "radial-gradient(650px 300px at 90% 15%, rgba(244, 52, 139, 0.45), transparent 60%), radial-gradient(500px 260px at 10% 90%, rgba(209, 28, 118, 0.4), transparent 60%)",
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
              "linear-gradient(140deg, rgba(252, 52, 136, 0.55), rgba(244, 52, 139, 0.2))",
            filter: "blur(2px)",
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
              "linear-gradient(160deg, rgba(209, 28, 118, 0.35), rgba(26, 10, 18, 0.35))",
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
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "#ffe3f0",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.08em",
              alignSelf: "flex-start",
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
              textShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
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
            color: "#f7cfe1",
            fontSize: 22,
            fontWeight: 400,
          }}
        >
          <div style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {siteConfig.siteName}
          </div>
          <div style={{ fontSize: 20, color: "#fc3488" }}>
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
