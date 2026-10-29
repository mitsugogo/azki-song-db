import { bestNineOgSize, getBestNineOgSize } from "@/app/lib/myBestNineSongsOg";
import {
  hasFixedSlots,
  normalizeSelection,
  resolveBestNineSlots,
} from "@/app/lib/myBestNineSongs";
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/app/config/siteConfig";
import { fetchSongsFromApiWithRecentFallback } from "@/app/lib/server/fetchSongs";
import {
  fetchOgFonts,
  normalizeOgText,
  ogColors,
  ogFontFamily,
  ogImageHeaders,
} from "../../ogDesign";

type OgSongCard = {
  url: string;
  title: string;
  artist: string;
  theme?: string;
  emptyLabel?: string;
};

const fallbackOgImage = async (
  size: { width: number; height: number } = bestNineOgSize,
) => {
  const fonts = await fetchOgFonts(
    "好きな曲9選 AZKi Song Database",
    "best-nine",
  );

  return new ImageResponse(
    <div
      style={{
        backgroundColor: ogColors.background,
        backgroundImage:
          "linear-gradient(135deg, #fffafc 0%, #fdf2f7 46%, #eef8ff 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        fontFamily: ogFontFamily,
        color: ogColors.primaryDeep,
        fontSize: 48,
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          color: ogColors.cyan,
        }}
      >
        ♪
      </div>
      <div style={{ display: "flex" }}>好きな曲9選</div>
      <div
        style={{
          fontSize: 24,
          color: ogColors.primary,
          marginTop: "20px",
          display: "flex",
        }}
      >
        {siteConfig.siteName}
      </div>
    </div>,
    {
      ...size,
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
    const origin = requestUrl.origin;
    const id = searchParams.get("id");
    const size = getBestNineOgSize(searchParams);

    if (!id) {
      return await fallbackOgImage(size);
    }

    const savedResponse = await fetch(
      `${origin}/api/share/my-best-9-songs/${id}`,
    ).catch(() => null);

    const selection = savedResponse?.ok
      ? normalizeSelection(
          ((await savedResponse.json()) as { selection?: unknown }).selection,
        )
      : null;

    if (!selection) {
      return await fallbackOgImage(size);
    }

    // 曲データを取得
    const expectedEntries = selection.songs.slice(0, 9);
    const songs = await fetchSongsFromApiWithRecentFallback(
      {
        locale: hl,
        baseUrlOverride: origin,
      },
      (candidateSongs) =>
        resolveBestNineSlots(selection, candidateSongs).filter(
          (slot) => slot.song,
        ).length === expectedEntries.length,
    ).catch(() => []);

    // 厳選した曲を取得
    const themed = hasFixedSlots(selection);
    const resolvedSlots = resolveBestNineSlots(selection, songs);
    const selectedSlots = themed
      ? resolvedSlots
      : resolvedSlots.filter((slot) => slot.song);

    const titleText = normalizeOgText(selection.title.trim() || "好きな曲9選");
    const authorText = selection.author?.trim()
      ? normalizeOgText(`by ${selection.author.trim()}`)
      : "";

    const ogSongCards: OgSongCard[] = selectedSlots.map(
      ({ song, theme, slot, entry }) => {
        const themeText = themed
          ? normalizeOgText(
              `${slot + 1}. ${theme || (hl === "en" ? "Free choice" : "自由枠")}`,
            )
          : undefined;
        if (!song)
          return {
            url: "",
            title: "",
            artist: "",
            theme: themeText,
            emptyLabel: entry
              ? hl === "en"
                ? "Song not found"
                : "曲が見つかりません"
              : hl === "en"
                ? "Unanswered"
                : "未回答",
          };
        let url = `https://img.youtube.com/vi/${song.video_id}/maxresdefault.jpg`;
        if (song.video_id === "fiddR-oZta4") {
          // afterglow(id:fiddR-oZta4)だけmaxresdefault.jpgが存在しないため、hqdefault.jpgを使用
          url = `https://img.youtube.com/vi/${song.video_id}/hqdefault.jpg`;
        }
        return {
          url: url,
          theme: themeText,
          title: normalizeOgText(song.title),
          artist: normalizeOgText(song.artist),
        };
      },
    );

    // 9枚未満の場合は空カードでパディング
    while (ogSongCards.length < 9) {
      ogSongCards.push({
        url: "",
        title: "",
        artist: "",
        emptyLabel: hl === "en" ? "Not selected" : "未選択",
      });
    }

    const thumbnailRows = [0, 1, 2].map((rowIndex) =>
      ogSongCards.slice(rowIndex * 3, rowIndex * 3 + 3),
    );

    const fontTextSeed = `${titleText}${authorText}${ogSongCards
      .map(
        (card) =>
          `${card.theme ?? ""}${card.title}${card.artist}${card.emptyLabel ?? ""}`,
      )
      .join("")}...…,:・`;

    const fonts = await fetchOgFonts(fontTextSeed, "best-nine");

    const scale = Math.min(
      size.width / bestNineOgSize.width,
      size.height / bestNineOgSize.height,
    );
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: ogColors.background,
          backgroundImage:
            "linear-gradient(135deg, #fffafc 0%, #fdf2f7 52%, #f5f9ff 100%)",
        }}
      >
        <div
          style={{
            width: bestNineOgSize.width,
            height: bestNineOgSize.height,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            padding: 16,
            fontFamily: ogFontFamily,
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: 70,
              flexShrink: 0,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                maxWidth: "100%",
                fontSize: titleText.length > 32 ? 24 : 36,
                lineHeight: 1.1,
                fontWeight: 700,
                color: ogColors.primaryDeep,
                textAlign: "center",
                lineClamp: 2,
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {titleText}
            </div>
            {authorText && (
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  lineHeight: 1.1,
                  color: ogColors.muted,
                  marginTop: 3,
                }}
              >
                {authorText}
              </div>
            )}
          </div>
          {/* お題は上段、下段は左に16:9の画像・右に曲情報。文字を画像に重ねない。 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: 496,
              gap: 10,
              flexShrink: 0,
            }}
          >
            {thumbnailRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  gap: 10,
                  flex: 1,
                }}
              >
                {row.map((card, colIdx) => (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    data-og-slot={rowIdx * 3 + colIdx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minWidth: 0,
                      height: "100%",
                      padding: 10,
                      gap: 3,
                      backgroundColor: "#ffffff",
                      border: `1px solid ${ogColors.line}`,
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        height: 32,
                        flexShrink: 0,
                        color: ogColors.primaryDeep,
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1.12,
                        lineClamp: 2,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {card.theme || `${rowIdx * 3 + colIdx + 1}.`}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                        height: 99,
                        gap: 12,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 176,
                          height: 99,
                          flexShrink: 0,
                          borderRadius: 3,
                          overflow: "hidden",
                          backgroundColor: card.url ? "#000000" : "#f7f2f5",
                        }}
                      >
                        {card.url ? (
                          <img
                            src={card.url}
                            alt=""
                            width={176}
                            height={99}
                            style={{
                              width: 176,
                              height: 99,
                              objectFit: "contain",
                              objectPosition: "center",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              maxWidth: 160,
                              fontSize: 14,
                              color: ogColors.muted,
                              textAlign: "center",
                            }}
                          >
                            {card.emptyLabel}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          flex: 1,
                          minWidth: 0,
                          height: 99,
                          overflow: "hidden",
                        }}
                      >
                        {card.title && (
                          <div
                            style={{
                              display: "flex",
                              fontSize: 17,
                              lineHeight: 1.15,
                              fontWeight: 700,
                              color: ogColors.ink,
                              lineClamp: 3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              wordBreak: "break-word",
                            }}
                          >
                            {card.title}
                          </div>
                        )}
                        {card.artist && (
                          <div
                            style={{
                              display: "flex",
                              marginTop: 4,
                              fontSize: 13,
                              lineHeight: 1.2,
                              color: ogColors.muted,
                              lineClamp: 2,
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              wordBreak: "break-word",
                            }}
                          >
                            {card.artist}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: 24,
              flexShrink: 0,
              fontSize: 13,
              color: ogColors.muted,
              letterSpacing: 1.5,
            }}
          >
            {siteConfig.siteName}
          </div>
        </div>
      </div>,
      { ...size, fonts, headers: ogImageHeaders },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error("Failed to generate OG image:", e.message);
    }
    return await fallbackOgImage();
  }
}
