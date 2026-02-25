import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { ChannelEntry } from "@/app/types/api/yt/channels";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";

export async function GET() {
  try {
    const sheets = google.sheets({
      version: "v4",
      auth: process.env.GOOGLE_API_KEY,
    });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ["channels!A:Z"],
      includeGridData: true,
      fields:
        "sheets.data.rowData.values(userEnteredValue,formattedValue,hyperlink)",
    });

    const sheet = response.data.sheets?.[0];
    const rows: sheets_v4.Schema$RowData[] = sheet?.data?.[0]?.rowData || [];
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    const headerValues = rows[0].values || [];
    const headers: string[] = headerValues.map((v) =>
      (v?.userEnteredValue?.stringValue || v?.formattedValue || "")
        .toString()
        .trim(),
    );

    const findHeaderIndex = (pred: (h: string) => boolean) =>
      headers.findIndex((h) => pred(h.toLowerCase()));

    const idxBranch = findHeaderIndex(
      (h) => h.includes("ブランチ") || h.includes("branch"),
    );
    const idxGeneration = findHeaderIndex(
      (h) => h.includes("世代") || h.includes("generation"),
    );
    const idxTalent = findHeaderIndex(
      (h) => h.includes("タレント") || h.includes("talent"),
    );
    const idxArtist = findHeaderIndex(
      (h) =>
        h.includes("db") || h.includes("アーティスト") || h.includes("artist"),
    );
    const idxYoutubeId = findHeaderIndex(
      (h) =>
        (h.includes("youtube") && h.includes("id")) ||
        h.includes("youtubeid") ||
        h.includes("youtube id"),
    );
    const idxChannelName = findHeaderIndex(
      (h) =>
        h.includes("チャンネル名") ||
        h.includes("channel") ||
        h.includes("name"),
    );
    const idxHandle = findHeaderIndex(
      (h) =>
        h.includes("ハンドル") || h.includes("handle") || h.includes("ハンド"),
    );
    const idxSubscribers = findHeaderIndex(
      (h) =>
        h.includes("登録") || h.includes("subscriber") || h.includes("登録者"),
    );
    const idxIcon = findHeaderIndex(
      (h) =>
        h.includes("アイコン") || h.includes("icon") || h.includes("thumbnail"),
    );

    const getCellString = (row: sheets_v4.Schema$CellData[], idx: number) => {
      if (!row || idx < 0) return "";
      const v = row[idx];
      return (
        v?.userEnteredValue?.stringValue ??
        v?.userEnteredValue?.numberValue ??
        v?.formattedValue ??
        ""
      ).toString();
    };

    const getCellHyperlink = (
      row: sheets_v4.Schema$CellData[],
      idx: number,
    ) => {
      if (!row || idx < 0) return "";
      const v = row[idx];
      return v?.hyperlink ?? "";
    };

    const channels: ChannelEntry[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].values || [];

      const entry: ChannelEntry = {
        branch: idxBranch >= 0 ? getCellString(row, idxBranch).trim() : "",
        generation:
          idxGeneration >= 0 ? getCellString(row, idxGeneration).trim() : "",
        talentName: idxTalent >= 0 ? getCellString(row, idxTalent).trim() : "",
        artistName: idxArtist >= 0 ? getCellString(row, idxArtist).trim() : "",
        youtubeId:
          idxYoutubeId >= 0 ? getCellString(row, idxYoutubeId).trim() : "",
        channelName:
          idxChannelName >= 0 ? getCellString(row, idxChannelName).trim() : "",
        handle: idxHandle >= 0 ? getCellString(row, idxHandle).trim() : "",
        subscriberCount:
          idxSubscribers >= 0
            ? Number(getCellString(row, idxSubscribers).trim() ?? 0)
            : 0,
        iconUrl:
          idxIcon >= 0
            ? getCellHyperlink(row, idxIcon) ||
              getCellString(row, idxIcon).trim()
            : "",
      };

      if (
        !entry.youtubeId &&
        !entry.handle &&
        !entry.channelName &&
        !entry.talentName
      ) {
        continue;
      }

      channels.push(entry);
    }

    const now = new Date();
    return NextResponse.json(channels, {
      headers: {
        "Cache-Control":
          "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=300",
        "Vercel-Cache-Tag": buildVercelCacheTagHeader([
          cacheTags.coreDataset,
          cacheTags.channels,
          cacheTags.channelsList,
        ]),
        "x-data-updated": now.toISOString(),
        "Last-Modified": now.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error fetching channels from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
