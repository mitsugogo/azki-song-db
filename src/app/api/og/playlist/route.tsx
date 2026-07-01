import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { Song } from "@/app/types/song";
import { siteConfig } from "@/app/config/siteConfig";
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";
import {
  decodePlaylistOgPayload,
  getPlaylistOgGridSize,
  type PlaylistOgPayload,
} from "@/app/lib/playlistUrl";
import {
  fetchOgFonts,
  normalizeOgText,
  ogColors,
  ogFontFamily,
  ogImageHeaders,
} from "../ogDesign";

export const runtime = "edge";

type PlaylistOgCell = {
  thumbnailUrl: string;
};

const normalizeStart = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const withoutSuffix = trimmed.replace(/s$/i, "");
  const numeric = Number(withoutSuffix);
  if (Number.isFinite(numeric)) {
    return String(numeric);
  }

  return withoutSuffix;
};

const getYoutubeThumbnailUrl = (videoId: string) => {
  if (videoId === "fiddR-oZta4") {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const resolveSong = (songs: Song[], entry: PlaylistOgPayload["s"][number]) => {
  const normalizedEntryStart = normalizeStart(entry.s);
  if (!normalizedEntryStart) return null;

  const exact = songs.find((song) => {
    const normalizedSongStart = normalizeStart(song.start);
    return (
      song.video_id === entry.v &&
      normalizedSongStart !== null &&
      normalizedSongStart === normalizedEntryStart
    );
  });
  if (exact) return exact;

  const sameVideoSongs = songs.filter((song) => song.video_id === entry.v);
  if (sameVideoSongs.length === 1) {
    return sameVideoSongs[0];
  }

  return null;
};

const createCells = (payload: PlaylistOgPayload, songs: Song[]) => {
  const gridSize = getPlaylistOgGridSize(payload.c);
  const maxCells = gridSize * gridSize;
  const selectedEntries = payload.s.slice(0, maxCells);
  const cells: PlaylistOgCell[] = selectedEntries.map((entry) => {
    const song = resolveSong(songs, entry);
    const videoId = song?.video_id ?? null;

    return {
      thumbnailUrl: videoId ? getYoutubeThumbnailUrl(videoId) : "",
    };
  });

  while (cells.length < maxCells) {
    cells.push({
      thumbnailUrl: "",
    });
  }

  return {
    gridSize,
    rows: Array.from({ length: gridSize }, (_, rowIndex) =>
      cells.slice(rowIndex * gridSize, rowIndex * gridSize + gridSize),
    ),
  };
};

const fallbackOgImage = async (width: number, height: number) => {
  const fonts = await fetchOgFonts("Playlist AZKi Song Database");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ogColors.background,
        color: ogColors.primaryDeep,
        fontFamily: ogFontFamily,
        fontSize: 44,
        fontWeight: 900,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: Math.max(8, Math.round(Math.min(width, height) * 0.04)),
          display: "flex",
          borderRadius: Math.max(
            16,
            Math.round(Math.min(width, height) * 0.05),
          ),
          border: "2px solid rgba(255, 255, 255, 0.28)",
        }}
      />
      <div style={{ display: "flex" }}>Playlist</div>
      <div
        style={{
          display: "flex",
          marginTop: 14,
          color: ogColors.primary,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {siteConfig.siteName}
      </div>
    </div>,
    {
      width,
      height,
      fonts,
      headers: ogImageHeaders,
    },
  );
};

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const { searchParams } = requestUrl;
    const hl = searchParams.get("hl")?.toLowerCase() ?? "ja";
    const payloadParam = searchParams.get("p");
    const width = Number.parseInt(searchParams.get("w") || "400", 10);
    const height = Number.parseInt(searchParams.get("h") || "400", 10);
    const imageWidth = Number.isFinite(width) ? width : 400;
    const imageHeight = Number.isFinite(height) ? height : 400;

    if (!payloadParam) {
      return await fallbackOgImage(imageWidth, imageHeight);
    }

    const payload = decodePlaylistOgPayload(payloadParam);
    if (!payload) {
      return await fallbackOgImage(imageWidth, imageHeight);
    }

    const songs = await fetchSongsFromApiCached({
      locale: hl,
      baseUrlOverride: requestUrl.origin,
    }).catch(() => []);
    const { gridSize, rows } = createCells(payload, songs);
    const titleText = normalizeOgText(payload.n);
    const fonts = await fetchOgFonts(`${titleText}${payload.c} Playlist`);
    const cellGap = gridSize >= 4 ? 0 : 2;

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: cellGap,
          overflow: "hidden",
          backgroundColor: ogColors.background,
          fontFamily: ogFontFamily,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: Math.max(
              8,
              Math.round(Math.min(imageWidth, imageHeight) * 0.04),
            ),
            display: "flex",
            borderRadius: Math.max(
              16,
              Math.round(Math.min(imageWidth, imageHeight) * 0.05),
            ),
            border: "2px solid rgba(255, 255, 255, 0.28)",
            zIndex: 1,
          }}
        />
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              width: "100%",
              display: "flex",
              flex: 1,
              flexDirection: "row",
              gap: cellGap,
            }}
          >
            {row.map((cell, columnIndex) => (
              <div
                key={`${rowIndex}-${columnIndex}`}
                style={{
                  display: "flex",
                  flex: 1,
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: ogColors.pinkSoft,
                  backgroundImage:
                    "linear-gradient(135deg, #fffafc 0%, #fdf2f7 52%, #e5f8ff 100%)",
                }}
              >
                {cell.thumbnailUrl ? (
                  <img
                    src={cell.thumbnailUrl}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      color: ogColors.primary,
                      fontSize: gridSize === 1 ? 50 : 28,
                      fontWeight: 900,
                    }}
                  >
                    ♪
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>,
      {
        width: imageWidth,
        height: imageHeight,
        fonts,
        headers: ogImageHeaders,
      },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error("Failed to generate playlist OG image:", e.message);
    }
    return await fallbackOgImage(400, 400);
  }
}
