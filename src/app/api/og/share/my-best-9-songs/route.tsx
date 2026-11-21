import {
  renderBestNineOgImage,
  type BestNineOgCard,
} from "./renderBestNineOgImage";
import { bestNineOgSize, getBestNineOgSize } from "@/app/lib/myBestNineSongsOg";
import {
  hasFixedSlots,
  bestNineSlotHeading,
  normalizeSelection,
  resolveBestNineSlots,
} from "@/app/lib/myBestNineSongs";
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/app/config/siteConfig";
import { fetchSongsFromApiWithRecentFallback } from "@/app/lib/server/fetchSongs";
import { internalApiFetch } from "@/app/lib/server/internalApiFetch";
import {
  fetchOgFonts,
  normalizeOgText,
  ogColors,
  ogFontFamily,
  ogImageHeaders,
} from "../../ogDesign";

type OgSongCard = BestNineOgCard;

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

    const savedResponse = await internalApiFetch(
      new URL(`/api/share/my-best-9-songs/${encodeURIComponent(id)}`, origin),
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
    const expectedEntries = selection.songs.filter(
      (entry) => entry.kind !== "live",
    );
    const songs = expectedEntries.length
      ? await fetchSongsFromApiWithRecentFallback(
          {
            locale: hl,
            baseUrlOverride: origin,
          },
          (candidateSongs) =>
            resolveBestNineSlots(selection, candidateSongs).filter(
              (slot) => slot.song,
            ).length === expectedEntries.length,
        ).catch(() => [])
      : [];

    // 厳選した曲を取得
    const themed = hasFixedSlots(selection);
    const resolvedSlots = resolveBestNineSlots(selection, songs);
    const selectedSlots = themed
      ? resolvedSlots
      : resolvedSlots.filter((slot) => slot.song || slot.live);

    const titleText = normalizeOgText(selection.title.trim() || "好きな曲9選");
    const authorText = selection.author?.trim()
      ? normalizeOgText(`by ${selection.author.trim()}`)
      : "";

    const ogSongCards: OgSongCard[] = selectedSlots.map(
      ({ song, live, theme, slot, entry }) => {
        const heading = theme.trim()
          ? bestNineSlotHeading(slot, theme, selection.songs.length)
          : "";
        const themeText = heading ? normalizeOgText(heading) : undefined;
        if (live)
          return {
            url: "",
            title: normalizeOgText(
              hl === "en" ? live.titleEn || live.title : live.title,
            ),
            artist: normalizeOgText(live.singers),
            theme: themeText,
            emptyLabel: normalizeOgText(
              [live.liveTitle, live.performance].filter(Boolean).join(" / "),
            ),
          };
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

    // 未回答の枠も最大選曲数に合わせて保持する。
    while (ogSongCards.length < (selection.songCount ?? 9)) {
      ogSongCards.push({
        url: "",
        title: "",
        artist: "",
        emptyLabel: hl === "en" ? "Not selected" : "未選択",
      });
    }

    const fontTextSeed = `${titleText}${authorText}${ogSongCards
      .map(
        (card) =>
          `${card.theme ?? ""}${card.title}${card.artist}${card.emptyLabel ?? ""}`,
      )
      .join("")}...…,:・`;

    const fonts = await fetchOgFonts(fontTextSeed, "best-nine");

    return new ImageResponse(
      renderBestNineOgImage({
        cards: ogSongCards,
        title: titleText,
        author: authorText,
        size,
      }),
      { ...size, fonts, headers: ogImageHeaders },
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error("Failed to generate OG image:", e.message);
    }
    return await fallbackOgImage();
  }
}
