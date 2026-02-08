import { Client } from "youtubei";
import { NextResponse } from "next/server";
import { YouTubeApiVideoResult } from "@/app/types/api/yt/video";

const youtube = new Client({
  // 日本語ロケールを明示
  youtubeClientOptions: {
    hl: "ja",
    gl: "JP",
  },
  fetchOptions: {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36",
      "Accept-Language": "ja-JP,ja;q=0.8,en-US;q=0.5,en;q=0.3",
    },
  },
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ video_id: string }> },
) {
  const { video_id } = await params;
  if (!video_id) {
    return NextResponse.json(
      { error: "video_id is required" },
      { status: 400 },
    );
  }

  try {
    const video = await youtube.getVideo(video_id);
    if (!video)
      return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const v: any = video;

    const safeThumbnails = Array.isArray(v.thumbnails)
      ? v.thumbnails.map((t: any) => ({
          url: t.url ?? null,
          width: t.width ?? null,
          height: t.height ?? null,
        }))
      : null;

    const safeChannel = v.channel
      ? {
          id: v.channel.id ?? null, // channel id
          name: v.channel.name ?? null,
          subscriberCount: v.channel.subscriberCount ?? null,
          thumbnails: Array.isArray(v.channel.thumbnails)
            ? v.channel.thumbnails.map((t: any) => ({
                url: t.url ?? null,
                width: t.width ?? null,
                height: t.height ?? null,
              }))
            : null,
        }
      : null;

    const safeChannels = Array.isArray(v.channels)
      ? v.channels.map((ch: any) => ({
          id: ch.id ?? null,
          name: ch.name ?? null,
          subscriberCount: ch.subscriberCount ?? null,
          thumbnails: Array.isArray(ch.thumbnails)
            ? ch.thumbnails.map((t: any) => ({
                url: t.url ?? null,
                width: t.width ?? null,
                height: t.height ?? null,
              }))
            : null,
        }))
      : null;

    const result: YouTubeApiVideoResult = {
      id: v.id ?? v.videoId ?? video_id,
      title: v.title ?? null,
      uploadDate: v.uploadDate ?? v.published ?? null,
      viewCount: v.viewCount ?? v.views ?? null,
      isLiveContent: v.isLiveContent ?? v.isLive ?? false,
      thumbnails: safeThumbnails,
      channel: safeChannel,
      channels: safeChannels,
      likeCount: v.likeCount ?? null,
      tags: Array.isArray(v.tags) ? v.tags : [],
      description: v.description ?? null,
      duration: v.duration ?? v.lengthSeconds ?? null,
      chapters: Array.isArray(v.chapters) ? v.chapters : [],
      music: v.music
        ? {
            imageUrl: v.music.imageUrl ?? v.music.image ?? null,
            title: v.music.title ?? null,
            artist: v.music.artist ?? null,
            album: v.music.album ?? null,
          }
        : null,
      lastFetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch YouTube video data:", error);
    return NextResponse.json(
      { error: "Failed to fetch video data" },
      { status: 500 },
    );
  }
}
