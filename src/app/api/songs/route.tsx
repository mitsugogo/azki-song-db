import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import slugify, { slugifyV2 } from "../../lib/slugify";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";
import {
  hasMembersOnlyAccess,
  isMembersOnlySongSheetTitle,
  membersOnlyAccessCookieName,
  membersOnlySongRanges,
} from "@/app/lib/membersOnlyAccess";
import { Song } from "@/app/types/song";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hl = searchParams.get("hl")?.toLowerCase() ?? "ja";
    const isEnglish = hl.startsWith("en");
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookieMap = new Map(
      cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const separatorIndex = part.indexOf("=");
          if (separatorIndex === -1) return [part, ""];
          return [
            part.slice(0, separatorIndex),
            decodeURIComponent(part.slice(separatorIndex + 1)),
          ];
        }),
    );
    const includeMembersOnlySongs = hasMembersOnlyAccess(
      cookieMap.get(membersOnlyAccessCookieName),
    );

    const sheets = google.sheets({
      version: "v4",
      auth: process.env.GOOGLE_API_KEY,
    });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const publicRanges = [
      // 翻訳用マップ
      "artists!A:B",
      "song_titles!A:C",

      // データ
      "歌枠2021以前!A:L",
      "歌枠2022!A:L",
      "歌枠2023!A:M", // 列範囲を少し広めに設定
      "歌枠2024!A:L",
      "歌枠2025!A:M",
      "歌枠2026!A:M",
      "記念ライブ系!A:R",
      "オリ曲!A:V",
      "カバー!A:U",
      "ゲスト・fesなど!A:M",
      "特殊!A:R",
    ];
    const ranges = includeMembersOnlySongs
      ? [...publicRanges, ...membersOnlySongRanges]
      : publicRanges;

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges,
      includeGridData: true,
      fields:
        "sheets(properties/title,data/rowData/values(userEnteredValue,hyperlink,formattedValue))",
    });

    /**
     * Googleスプレッドシートのシリアル値を秒に変換
     */
    function parseTimeFromNumberValue(numberValue: number): number {
      return Math.round(numberValue * 24 * 60 * 60);
    }

    /**
     * Googleスプレッドシートのシリアル値をISO文字列に変換
     */
    function convertToDate(numberValue: number): string {
      if (!numberValue) return "";
      return new Date(
        numberValue * 24 * 60 * 60 * 1000 + new Date(1899, 11, 30).getTime(),
      ).toISOString();
    }

    /**
     * ヘッダー文字列の正規化（全角半角、空白、記号の差異を吸収）
     */
    const normalize = (s: any) =>
      String(s || "")
        .replace(/[（）\(\)\s\?\？\.,，、!！]/g, "")
        .toLowerCase();

    // 取得したいフィールドと、スプレッドシート上の見出し名（エイリアス）の定義
    const HEADER_SCHEMA = [
      { key: "title", aliases: ["曲名", "title"] },
      { key: "title_en", aliases: ["曲名_en", "title_en"] },
      { key: "artist", aliases: ["アーティスト", "artist"] },
      { key: "artist_en", aliases: ["アーティスト_en", "artist_en"] },
      { key: "sing", aliases: ["歌った人", "sing"] },
      { key: "video", aliases: ["動画", "video", "video_uri"] },
      { key: "start", aliases: ["start", "開始", "開始時刻"] },
      { key: "end", aliases: ["end", "終了", "終了時刻"] },
      { key: "broadcast_at", aliases: ["配信日", "date", "broadcast_at"] },
      { key: "tags", aliases: ["tags（カンマ区切り）", "タグ", "tags"] },
      { key: "extra", aliases: ["備考", "extra", "note"] },
      { key: "milestones", aliases: ["マイルストーン", "milestones"] },
      { key: "album", aliases: ["アルバム", "album"] },
      { key: "album_en", aliases: ["アルバム_en", "album_en"] },
      { key: "album_release_at", aliases: ["アルバム発売日", "発売日"] },
      {
        key: "album_is_compilation",
        aliases: ["コンピレーションアルバム", "compilation"],
      },
      { key: "lyricist", aliases: ["作詞", "lyricist"] },
      { key: "composer", aliases: ["作曲", "composer"] },
      { key: "arranger", aliases: ["編曲", "arranger"] },
      { key: "live_call", aliases: ["ライブコール", "live_call"] },
      { key: "live_note", aliases: ["ライブノート", "live_note"] },
      { key: "view_count", aliases: ["再生数", "view_count"] },
    ] as const;

    const songs: Song[] = [];
    let sourceOrder = 0;
    // 翻訳用マップ（英語時のみ使用）
    const artistsMap: Record<string, string> = {};
    const titlesMap: Record<string, string> = {};

    const sheetsArr = response.data.sheets || [];

    // 翻訳用シートのみを先に処理してマップを作成
    sheetsArr.forEach((sheet) => {
      const sheetRows = sheet.data?.[0]?.rowData || [];
      if (sheetRows.length < 2) return;

      const headerValues = sheetRows[0].values || [];
      const colMap: Record<string, number> = {};
      HEADER_SCHEMA.forEach((def) => {
        const index = headerValues.findIndex((cell) => {
          const cellStr =
            cell.userEnteredValue?.stringValue || cell.formattedValue || "";
          return def.aliases.some(
            (alias) => normalize(alias) === normalize(cellStr),
          );
        });
        colMap[def.key] = index;
      });

      const sheetTitle = (sheet.properties?.title || "").toLowerCase();
      if (sheetTitle === "artists") {
        sheetRows.slice(1).forEach((row) => {
          const vals = row.values || [];
          const ja =
            (colMap["artist"] !== -1 && vals[colMap["artist"]]
              ? vals[colMap["artist"]].userEnteredValue?.stringValue ||
                vals[colMap["artist"]].formattedValue ||
                ""
              : "") || "";
          const en =
            (colMap["artist_en"] !== -1 && vals[colMap["artist_en"]]
              ? vals[colMap["artist_en"]].userEnteredValue?.stringValue ||
                vals[colMap["artist_en"]].formattedValue ||
                ""
              : "") || "";
          if (ja) artistsMap[normalize(ja)] = en || "";
        });
      }

      if (sheetTitle === "song_titles") {
        sheetRows.slice(1).forEach((row) => {
          const vals = row.values || [];
          const title =
            (colMap["title"] !== -1 && vals[colMap["title"]]
              ? vals[colMap["title"]].userEnteredValue?.stringValue ||
                vals[colMap["title"]].formattedValue ||
                ""
              : "") || "";
          const artist =
            (colMap["artist"] !== -1 && vals[colMap["artist"]]
              ? vals[colMap["artist"]].userEnteredValue?.stringValue ||
                vals[colMap["artist"]].formattedValue ||
                ""
              : "") || "";
          const titleEn =
            (colMap["title_en"] !== -1 && vals[colMap["title_en"]]
              ? vals[colMap["title_en"]].userEnteredValue?.stringValue ||
                vals[colMap["title_en"]].formattedValue ||
                ""
              : "") || "";
          if (title && artist) {
            const key = `${normalize(title)}|${normalize(artist)}`;
            titlesMap[key] = titleEn || "";
          }
        });
      }
    });

    // データシートを処理して songs を構築
    sheetsArr.forEach((sheet) => {
      const sheetRows = sheet.data?.[0]?.rowData || [];
      if (sheetRows.length < 2) return; // ヘッダーとデータが必要

      const headerValues = sheetRows[0].values || [];

      // 列マップ
      const colMap: Record<string, number> = {};
      HEADER_SCHEMA.forEach((def) => {
        const index = headerValues.findIndex((cell) => {
          const cellStr =
            cell.userEnteredValue?.stringValue || cell.formattedValue || "";
          return def.aliases.some(
            (alias) => normalize(alias) === normalize(cellStr),
          );
        });
        colMap[def.key] = index; // 見つからない場合は -1
      });

      const sheetTitle = (sheet.properties?.title || "").toLowerCase();
      if (sheetTitle === "artists" || sheetTitle === "song_titles") return; // 翻訳シートはスキップ
      const isMembersOnlySong = isMembersOnlySongSheetTitle(sheetTitle);

      sheetRows.slice(1).forEach((row) => {
        const vals = row.values || [];

        // 有効フラグ(B列)チェック ※B列固定なのは運用ルールに準拠
        const isEnabled = vals[1]?.userEnteredValue?.boolValue === true;

        // 曲名の取得（動的な列から）
        const titleIdx = colMap["title"];
        const titleValue =
          titleIdx !== -1
            ? vals[titleIdx]?.userEnteredValue?.stringValue ||
              vals[titleIdx]?.formattedValue ||
              ""
            : "";

        if (!isEnabled || !titleValue) return;

        // 値取得ヘルパー
        const getStr = (key: string) => {
          const i = colMap[key];
          return i !== -1 && vals[i]
            ? vals[i].userEnteredValue?.stringValue ||
                vals[i].formattedValue ||
                ""
            : "";
        };
        const getNum = (key: string) => {
          const i = colMap[key];
          return i !== -1 && vals[i]
            ? (vals[i].userEnteredValue?.numberValue ?? 0)
            : 0;
        };
        const getBool = (key: string) => {
          const i = colMap[key];
          return i !== -1 && vals[i]
            ? (vals[i].userEnteredValue?.boolValue ?? false)
            : false;
        };
        const getLink = (key: string) => {
          const i = colMap[key];
          return i !== -1 && vals[i] ? vals[i].hyperlink || "" : "";
        };

        const videoUri = getLink("video");
        const videoId =
          videoUri.match(
            /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^?&]{11})/,
          )?.[1] || "";
        const broadcastAt = convertToDate(getNum("broadcast_at"));
        const titleEn = getStr("title_en");
        const localizedTitle = isEnglish ? titleEn || titleValue : titleValue;
        const artistJa = getStr("artist");
        const artistEn = getStr("artist_en");
        const localizedArtist = isEnglish ? artistEn || artistJa : artistJa;

        const albumEn = getStr("album_en");
        const localizedAlbum = isEnglish
          ? albumEn || getStr("album")
          : getStr("album");

        // 組み合わせてユニークな文字列にする
        const uniqKey =
          videoId + "_" + parseTimeFromNumberValue(getNum("start"));

        songs.push({
          source_order: sourceOrder++,
          title: localizedTitle,
          slug: slugify(titleValue) || videoId,
          slugv2: slugifyV2(uniqKey),
          artist: localizedArtist,
          artists: localizedArtist
            .split(/[,,、]/)
            .map((a) => a.trim())
            .filter(Boolean),
          sing: getStr("sing"),
          sings: getStr("sing")
            .split(/[,,、]/)
            .map((s) => s.trim())
            .filter((s) => s !== ""),
          hl: {
            ja: {
              title: titleValue,
              artist: artistJa,
              artists: artistJa
                .split(/[,,、]/)
                .map((a) => a.trim())
                .filter(Boolean),
              album: getStr("album"),
              sing: getStr("sing"),
              sings: getStr("sing")
                .split(/[,,、]/)
                .map((s) => s.trim())
                .filter((s) => s !== ""),
            },
            en: {
              title: titleEn,
              artist: artistEn,
              artists: artistEn
                .split(/[,,、]/)
                .map((a) => a.trim())
                .filter(Boolean),
              album: albumEn,
              sing: getStr("sing"),
              sings: getStr("sing")
                .split(/[,,、]/)
                .map((s) => s.trim())
                .filter((s) => s !== ""),
            },
          },
          lyricist: getStr("lyricist"),
          composer: getStr("composer"),
          arranger: getStr("arranger"),
          album: localizedAlbum,
          album_list_uri: getLink("album"),
          album_release_at: getNum("album_release_at")
            ? convertToDate(getNum("album_release_at"))
            : "",
          album_is_compilation: getBool("album_is_compilation"),
          video_title: getStr("video"),
          video_uri: videoUri,
          video_id: videoId,
          is_members_only: isMembersOnlySong,
          start: parseTimeFromNumberValue(getNum("start")),
          end: parseTimeFromNumberValue(getNum("end")),
          broadcast_at: broadcastAt,
          year: broadcastAt ? new Date(broadcastAt).getFullYear() : null,
          tags: getStr("tags")
            .split(/[,,、]/)
            .map((t) => t.trim())
            .filter(Boolean),
          extra: getStr("extra"),
          milestones: getStr("milestones")
            .split(/[,,、]/)
            .map((t) => t.trim())
            .filter(Boolean),
          live_call: getStr("live_call"),
          live_note: getStr("live_note"),
          view_count: getNum("view_count"),
        } as Song);
      });
    });

    // ソート処理
    songs.sort((a, b) => {
      const timeA = a.album
        ? new Date(a.album_release_at).getTime()
        : new Date(a.broadcast_at).getTime();
      const timeB = b.album
        ? new Date(b.album_release_at).getTime()
        : new Date(b.broadcast_at).getTime();
      return (timeB || 0) - (timeA || 0);
    });

    const now = new Date();
    return NextResponse.json(
      // 日本語以外の場合、取得が終わったsongsから英語が既に設定されているものがあればそれで上書きして返却する
      !isEnglish
        ? songs
        : songs.map((song) => {
            const titleJa = song.hl.ja.title;
            const artistJa = song.hl.ja.artist;

            // まず翻訳シートのマップを優先 (title + artist でキーを作る)
            const titleKey = `${normalize(titleJa)}|${normalize(artistJa)}`;
            const titleEnFromMap = titlesMap[titleKey] || "";

            // アーティストは配列要素ごとにマップを適用
            const mappedArtists = song.artists?.map((a) =>
              artistsMap[normalize(a)] ? artistsMap[normalize(a)] : a,
            );
            const anyArtistTranslated = song.artists?.some(
              (a) => !!artistsMap[normalize(a)],
            );

            // sing / sings も artistsMap を使って翻訳
            const mappedSings = song.sings?.map((s) =>
              artistsMap[normalize(s)] ? artistsMap[normalize(s)] : s,
            );
            const mappedSing = song.sing
              ? artistsMap[normalize(song.sing)] || song.sing
              : song.sing;

            // 翻訳データを探す（既存の行ベースの翻訳をフォールバックとして使用）
            const translated = songs.find(
              (s) =>
                s.hl.ja.title === titleJa &&
                s.hl.ja.artist === artistJa &&
                s.hl?.en?.title,
            );

            const titleEn =
              titleEnFromMap || translated?.hl?.en?.title || song.title;

            const artistEn = anyArtistTranslated
              ? mappedArtists?.join(", ")
              : translated?.hl?.en?.artist || song.artist;
            const singsEn = mappedSings || song.sings;
            const singEn = mappedSing ? mappedSings?.join(", ") : song.sing;

            // song.album が空の場合は translated のアルバム名を引き継がない
            const albumEn = song.album
              ? translated?.hl?.en?.album || song.album
              : "";

            // 何も翻訳が見つからなければ元の song を返す
            if (!titleEn && !artistEn) return song;

            return {
              ...song,
              title: titleEn,
              artist: artistEn,
              artists: mappedArtists || song.artists,
              sing: singEn,
              sings: singsEn,
              album: albumEn,
              hl: {
                ja: {
                  title: titleJa,
                  artist: artistJa,
                  album: song.hl.ja.album,
                  sing: song.hl.ja.sing,
                  sings: song.hl.ja.sings,
                },
                en: {
                  title: titleEn,
                  artist: artistEn,
                  album: albumEn,
                  sing: singEn,
                  sings: singsEn,
                },
              },
            };
          }),
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
          "Vercel-Cache-Tag": buildVercelCacheTagHeader([
            cacheTags.coreDataset,
            cacheTags.songs,
            cacheTags.songsList,
          ]),
          Vary: "Cookie",
          "x-data-updated": now.toISOString(),
          "Last-Modified": now.toUTCString(),
        },
      },
    );
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
