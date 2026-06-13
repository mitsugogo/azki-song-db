import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { Song } from "@/app/types/song";
import { formatDate } from "@/app/lib/formatDate";
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";
import {
  BrandBadge,
  fetchOgFonts,
  InfoPill,
  normalizeOgText,
  ogColors,
  ogImageHeaders,
  OgShell,
} from "../ogDesign";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hl = searchParams.get("hl")?.toLowerCase() ?? "ja";
    const v = searchParams.get("v");
    const t = searchParams.get("t") || "0";

    if (!v) {
      return new Response("Missing required parameters", { status: 404 });
    }

    const width = searchParams.get("w") || "1200";
    const height = searchParams.get("h") || "630";

    const video_id = v;
    const start = t.toString().replace("s", "");
    const songs = await fetchSongsFromApiCached({ locale: hl }).catch(() => []);
    const song = songs.find(
      (s: Song) => s.video_id === video_id && Number(s.start) === Number(start),
    );
    if (!song) {
      return new Response("Song not found", { status: 404 });
    }

    const songTitle = normalizeOgText(song.title);
    const artist = normalizeOgText(song.artist);
    const title = `♪ ${songTitle} - ${artist}`;
    const subTitle = normalizeOgText(`${song.video_title}`);
    const dateText = formatDate(song.broadcast_at, hl);
    const thumbnailUrl = `https://img.youtube.com/vi/${video_id}/mqdefault.jpg`;

    const fonts = await fetchOgFonts(
      `${title}${subTitle}${song.tags.join("")}${dateText}`,
    );

    return new ImageResponse(
      <OgShell padding="46px 64px">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            position: "relative",
          }}
        >
          <BrandBadge label="Song detail" />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 34,
            position: "relative",
            padding: 26,
            borderRadius: 28,
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            border: `1px solid ${ogColors.line}`,
            boxShadow: "0 24px 80px rgba(190, 24, 93, 0.16)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 384,
              minWidth: 384,
              height: 246,
              borderRadius: 22,
              padding: 7,
              background:
                "linear-gradient(135deg, rgba(190, 24, 93, 0.82), rgba(8, 145, 178, 0.78))",
              boxShadow: "0 16px 34px rgba(49, 34, 58, 0.18)",
            }}
          >
            <img
              src={thumbnailUrl}
              alt="YouTube Thumbnail"
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
                borderRadius: 17,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 12,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 44,
                fontStyle: "normal",
                fontWeight: 700,
                color: ogColors.primaryDeep,
                lineHeight: 1.18,
                letterSpacing: 0,
                lineClamp: '3 "..."',
              }}
            >
              {songTitle}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontStyle: "normal",
                color: ogColors.primary,
                fontWeight: 700,
                lineHeight: 1.25,
                lineClamp: '1 "..."',
              }}
            >
              {artist}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 25,
                fontStyle: "normal",
                color: ogColors.ink,
                lineHeight: 1.42,
                lineClamp: '2 "..."',
              }}
            >
              {subTitle}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            position: "relative",
          }}
        >
          <InfoPill>{song.tags.join(", ")}</InfoPill>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: ogColors.primary,
              fontSize: 22,
              fontWeight: 700,
              padding: "10px 16px",
              borderRadius: 14,
              backgroundColor: "rgba(255, 255, 255, 0.84)",
              border: `1px solid ${ogColors.line}`,
            }}
          >
            <div style={{ display: "flex", color: ogColors.cyan }}>Date</div>
            <div style={{ display: "flex" }}>{dateText}</div>
          </div>
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
