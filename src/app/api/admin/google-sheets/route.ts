import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/admin";
import { updateSongMetadata, upsertChannel } from "@/app/lib/adminGoogleSheets";
import { getJapaneseYouTubeChannelName } from "@/app/lib/youtubeDataApi";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "upsert-channel") {
      const channelId = body.channelId as string;
      const channelName = await getJapaneseYouTubeChannelName(
        channelId,
        request.url,
      );
      if (!channelName) {
        throw new Error("日本語のチャンネル名が見つかりません");
      }
      const result = await upsertChannel({
        channelId,
        channelName,
      });
      return NextResponse.json(result);
    }

    if (action === "update-song-metadata") {
      const result = await updateSongMetadata({
        videoId: body.videoId as string,
        videoUri: body.videoUri as string | undefined,
        start: body.start as number,
        matchTitle: body.matchTitle as string | undefined,
        matchArtist: body.matchArtist as string | undefined,
        matchAlbum: body.matchAlbum as string | undefined,
        title: body.title as string,
        artist: body.artist as string,
        album: body.album as string,
        albumListUri: body.albumListUri as string | undefined,
        singer: body.singer as string,
        videoTitle: body.videoTitle as string,
        broadcastDate: body.broadcastDate as string,
        tags: body.tags as string,
        extra: body.extra as string,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "操作が不正です" }, { status: 400 });
  } catch (error) {
    console.error("Admin Google Sheets operation failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "保存に失敗しました",
      },
      { status: 400 },
    );
  }
}
