import { google } from "googleapis";
import { NextResponse } from "next/server";
import { buildLiveTitleGroups } from "@/app/lib/liveSetlists";
import { buildVercelCacheTagHeader, cacheTags } from "@/app/lib/cacheTags";

const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

const getSheetsClient = () => {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!spreadsheetId) throw new Error("SPREADSHEET_ID が未設定です");

  if (clientEmail && privateKey) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: [READONLY_SCOPE],
    });
    return { spreadsheetId, sheets: google.sheets({ version: "v4", auth }) };
  }

  return {
    spreadsheetId,
    sheets: google.sheets({ version: "v4", auth: process.env.GOOGLE_API_KEY }),
  };
};

export async function GET() {
  try {
    const { spreadsheetId, sheets } = getSheetsClient();
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ["ライブ!A1:Z", "ライブセトリ!A1:Z"],
      valueRenderOption: "FORMATTED_VALUE",
    });
    const [liveRange, setlistRange] = response.data.valueRanges ?? [];
    if (!liveRange?.values?.length || !setlistRange?.values?.length) {
      throw new Error("ライブまたはライブセトリのシートを読み込めませんでした");
    }
    const groups = buildLiveTitleGroups(
      (liveRange?.values ?? []) as unknown[][],
      (setlistRange?.values ?? []) as unknown[][],
    );
    const now = new Date();

    return NextResponse.json(groups, {
      headers: {
        "Cache-Control":
          "public, max-age=0, must-revalidate, s-maxage=300, stale-while-revalidate=120",
        "Vercel-Cache-Tag": buildVercelCacheTagHeader([
          cacheTags.coreDataset,
          cacheTags.lives,
          cacheTags.livesList,
        ]),
        "x-data-updated": now.toISOString(),
        "Last-Modified": now.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error fetching live setlists from Google Sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch live setlists" },
      { status: 500 },
    );
  }
}
