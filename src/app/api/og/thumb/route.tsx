import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { FaCalendar } from "react-icons/fa6";
import { Song } from "@/app/types/song";
import { formatDate } from "@/app/lib/formatDate";
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";
import {
  fetchOgFonts,
  normalizeOgText,
  ogColors,
  ogImageHeaders,
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
    const thumbnailUrl = `https://img.youtube.com/vi/${video_id}/maxresdefault.jpg`;
    const tagsText = song.tags.join(" / ");
    const fonts = await fetchOgFonts(
      `${songTitle}${artist}${subTitle}${tagsText}${dateText}`,
    );

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: ogColors.background,
          color: ogColors.ink,
          fontFamily: '"Noto Sans JP", "Noto Sans", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 28,
            display: "flex",
            borderRadius: 34,
            border: "2px solid rgba(255, 255, 255, 0.28)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: 58,
            padding: "42px 54px 42px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 18px",
                borderRadius: 18,
                backgroundColor: "rgba(255, 250, 252, 0.9)",
                border: `1px solid ${ogColors.line}`,
                color: ogColors.primaryDeep,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <div style={{ display: "flex" }}>AZKi Song Database</div>
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
                Song detail
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: ogColors.primaryDeep,
                fontSize: 22,
                fontWeight: 700,
                padding: "12px 18px",
                borderRadius: 18,
                backgroundColor: "rgba(255, 250, 252, 0.9)",
                border: `1px solid ${ogColors.line}`,
              }}
            >
              <div style={{ display: "flex", color: ogColors.primary }}>
                <FaCalendar size={20} />
              </div>
              <div style={{ display: "flex" }}>{dateText}</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 30,
              padding: "36px 40px 34px",
              borderRadius: 34,
              backgroundColor: "rgba(255, 250, 252, 0.9)",
              border: "2px solid rgba(255, 255, 255, 0.7)",
              boxShadow: "0 18px 54px rgba(45, 36, 48, 0.18)",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 30,
                alignItems: "stretch",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 320,
                  minWidth: 320,
                  height: 180,
                  borderRadius: 20,
                  overflow: "hidden",
                  border: `1px solid ${ogColors.line}`,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                }}
              >
                <img
                  src={thumbnailUrl}
                  alt="YouTube Thumbnail"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 26,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 74,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: ogColors.primary,
                  }}
                />
                <div
                  style={{
                    display: "block",
                    lineClamp: 2,
                    overflow: "hidden",
                    fontSize: 42,
                    fontWeight: 900,
                    color: ogColors.ink,
                    lineHeight: 1.22,
                    letterSpacing: -1,
                    paddingBottom: 6,
                  }}
                >
                  {songTitle}
                </div>
                <div
                  style={{
                    display: "block",
                    lineClamp: 1,
                    overflow: "hidden",
                    fontSize: 30,
                    color: ogColors.primaryDeep,
                    fontWeight: 700,
                    lineHeight: 1.25,
                    paddingBottom: 2,
                  }}
                >
                  {artist}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 24,
                paddingTop: 10,
                borderTop: `1px solid ${ogColors.line}`,
              }}
            >
              <div
                style={{
                  display: tagsText ? "flex" : "none",
                  flex: 1,
                  minWidth: 0,
                  maxWidth: "48%",
                }}
              >
                <div
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    borderRadius: 14,
                    backgroundColor: "rgba(255, 255, 255, 0.84)",
                    border: `1px solid ${ogColors.line}`,
                    color: ogColors.primary,
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    maxWidth: "100%",
                    lineClamp: 2,
                  }}
                >
                  {tagsText}
                </div>
              </div>
              <div
                style={{
                  display: "block",
                  lineClamp: 2,
                  flex: 1,
                  minWidth: 0,
                  maxWidth: "48%",
                  overflow: "hidden",
                  textAlign: "right",
                  color: ogColors.muted,
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  paddingBottom: 4,
                }}
              >
                {subTitle}
              </div>
            </div>
          </div>
        </div>
      </div>,
      {
        width: Number.parseInt(width, 10),
        height: Number.parseInt(height, 10),
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
