import fs from "fs";
import path from "path";

async function globalSetup() {
  try {
    // 環境変数や Playwright の baseURL を考慮して絶対URLを作成する
    const host = process.env.HOST ?? "127.0.0.1";
    const port = process.env.PORT ?? "3001";
    const defaultBase = `http://${host}:${port}`;
    const baseApiRaw =
      process.env.PLAYWRIGHT_BASE_URL ??
      process.env.BASE_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      defaultBase;

    // baseApiRaw が絶対URLでない場合、defaultBase を元に解決する
    let baseApi: string;
    try {
      // new URL で検証。絶対URLであればそのまま使用
      new URL(baseApiRaw);
      baseApi = baseApiRaw;
    } catch {
      baseApi = new URL(baseApiRaw, defaultBase).toString();
    }

    const songsPath = "/api/songs";
    const channelsPath = "/api/yt/channels";
    const milestonesPath = "/api/milestones";

    const songsUrl = new URL(songsPath, baseApi).toString();
    const channelsUrl = new URL(channelsPath, baseApi).toString();
    const milestonesUrl = new URL(milestonesPath, baseApi).toString();

    // 実際のAPIからデータを取得してキャッシュ
    const songsResponse = await fetch(songsUrl);
    const songsData = await songsResponse.json();

    const channelsResponse = await fetch(channelsUrl);
    const channelsData = await channelsResponse.json();

    const milestonesResponse = await fetch(milestonesUrl);
    const milestonesData = await milestonesResponse.json();

    // キャッシュディレクトリを作成
    const cacheDir = path.join(__dirname, ".cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // キャッシュファイルを保存
    fs.writeFileSync(
      path.join(cacheDir, "songs.json"),
      JSON.stringify(songsData),
    );
    fs.writeFileSync(
      path.join(cacheDir, "channels.json"),
      JSON.stringify(channelsData),
    );
    fs.writeFileSync(
      path.join(cacheDir, "milestones.json"),
      JSON.stringify(milestonesData),
    );
  } catch (err) {
    console.error("globalSetup failed", {
      err: err instanceof Error ? err.message : String(err),
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL,
      BASE_URL: process.env.BASE_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      HOST: process.env.HOST,
      PORT: process.env.PORT,
    });
    throw err;
  }
}

export default globalSetup;
