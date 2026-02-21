import { ViewStat } from "@/app/types/api/stat/views";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ video_id: string }> },
) {
  const { video_id } = await params;
  if (!video_id) {
    return new Response(JSON.stringify({ error: "video_id is required" }), {
      status: 400,
    });
  }

  let statistics;
  try {
    statistics = await getStatisticsByVideoId(video_id);
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch statistics" }),
      { status: 500 },
    );
  }

  if (!statistics) {
    return new Response(
      JSON.stringify({ error: "No statistics found for the given video_id" }),
      { status: 404 },
    );
  }

  return new Response(JSON.stringify({ statistics }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control":
        "max-age=3600, s-maxage=86400, stale-while-revalidate=300",
    },
  });
}

export async function getStatisticsByVideoId(videoId: string) {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const apiKey = process.env.GOOGLE_API_KEY;
  const sheetName = "statistics";

  // G列がvideo_id
  const query = encodeURIComponent(`SELECT * WHERE G = '${videoId}'`);

  // APIキーを末尾に付与
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&tq=${query}&sheet=${sheetName}&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });

    const text = await response.text();

    // JSON部分を抽出
    const jsonStr = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/,
    );
    if (!jsonStr) return null;

    const data = JSON.parse(jsonStr[1]);

    if (data.status === "error") {
      console.error("Query Error:", data.errors);
      return null;
    }

    // データの整形
    return data.table.rows.map(
      (row: any) =>
        ({
          datetime: parseGoogleDate(row.c[0]?.v),
          viewCount: row.c[3]?.v,
          likeCount: row.c[4]?.v,
          commentCount: row.c[5]?.v,
        }) as ViewStat,
    );
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

function parseGoogleDate(dateStr: string): Date | null {
  // 正規表現でカッコ内の数字を抽出
  const match = dateStr.match(/\((.+)\)/);
  if (!match) return null;

  // カンマで分割して数値配列に変換
  const parts = match[1].split(",").map(Number);

  // Dateオブジェクトを生成
  return new Date(
    parts[0], // 年
    parts[1], // 月 (0始まりなので注意)
    parts[2], // 日
    parts[3] || 0, // 時
    parts[4] || 0, // 分
    parts[5] || 0, // 秒
  );
}
