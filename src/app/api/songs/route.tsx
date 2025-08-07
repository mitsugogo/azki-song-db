import { google } from 'googleapis';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_API_KEY });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // シート全体のデータを取得
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [
        '歌枠2025!A:J',
        'debug',
      ], // 必要な範囲を指定
      includeGridData: true, // セルの詳細情報を含める
      fields: 'sheets.data.rowData.values(userEnteredValue,hyperlink)', // 必要なフィールドのみ取得
    });

    function parseTimeFromNumberValue(numberValue: number): number {
      // 1日を秒単位に変換 (24時間 * 60分 * 60秒)
      return Math.round(numberValue * 24 * 60 * 60);
    }
    
    const rows = response.data.sheets?.[0]?.data?.[0]?.rowData || [];
    
    const songs = rows.slice(1).filter((row) => {
      // ヘッダー行を除外し、曲番号が空でない行のみをフィルタリング
      return row.values 
        // values[1]のcheckboxがtrueであることを確認
        && row.values[1]?.userEnteredValue?.boolValue === true
        && row.values[2]?.userEnteredValue?.stringValue;
    }).map((row) => {
      const values = row.values || [];
      return {
        title: values[2]?.userEnteredValue?.stringValue || '', // 曲名
        artist: values[3]?.userEnteredValue?.stringValue || '', // アーティスト
        sing: values[4]?.userEnteredValue?.stringValue || '', // 歌手
        video_title: values[5]?.userEnteredValue?.stringValue || '', // 動画タイトル
        video_uri: values[5]?.hyperlink || '', // ハイパーリンクURL
        video_id: values[5]?.hyperlink?.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^&\n]{11})/)?.[1] || '', // 動画IDの抽出
        start: parseTimeFromNumberValue(values[6]?.userEnteredValue?.numberValue || 0), // 開始時間 (秒)
        end: parseTimeFromNumberValue(values[7]?.userEnteredValue?.numberValue || 0), // 終了時間 (秒)
        broadcast_at: new Date((values[8]?.userEnteredValue?.numberValue || 0) * 24 * 60 * 60 * 1000 + new Date(1899, 11, 30).getTime()).toISOString() || '', // 放送日時
        tags: values[9]?.userEnteredValue?.stringValue?.split(',').map(tag => tag.trim()) || [], // タグをカンマ区切りで分割
        extra: values[10]?.userEnteredValue?.stringValue || '', // オプションのフィールド
      };
    });

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}