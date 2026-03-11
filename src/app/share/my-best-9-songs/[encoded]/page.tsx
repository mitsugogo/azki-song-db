"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useMyBestNineSongs, {
  MyBestNineSongs,
} from "@/app/hook/useMyBestNineSongs";
import { Song } from "@/app/types/song";
import { siteConfig, baseUrl } from "@/app/config/siteConfig";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";

type Props = {
  params: Promise<{ encoded: string }>;
};

export default function Page({ params }: Props) {
  const [encoded, setEncoded] = useState<string>("");
  const [selection, setSelection] = useState<MyBestNineSongs | null>(null);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { decodeFromUrlParam } = useMyBestNineSongs();

  // params を解決
  useEffect(() => {
    params.then((p) => {
      setEncoded(p.encoded);
    });
  }, [params]);

  // 曲データを取得して、9選をデコード
  useEffect(() => {
    if (!encoded) return;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 曲データ取得
        const songsRes = await fetch(`${baseUrl}/api/songs`);
        if (!songsRes.ok) {
          throw new Error("曲データの取得に失敗しました");
        }
        const songs = (await songsRes.json()) as Song[];
        setAllSongs(songs);

        // 新形式(ID)を優先して復元
        const savedResponse = await fetch(
          `/api/share/my-best-9-songs/${encoded}`,
        );

        if (savedResponse.ok) {
          const savedData = (await savedResponse.json()) as {
            selection?: MyBestNineSongs;
          };
          if (savedData.selection) {
            setSelection(savedData.selection);
            return;
          }
        }

        // 旧形式(エンコード文字列)のフォールバック
        const decoded = decodeFromUrlParam(encoded);
        if (!decoded) {
          setError("シェアデータが無効です");
          return;
        }

        setSelection(decoded);
      } catch (e) {
        console.error("Failed to load selection:", e);
        setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [encoded, decodeFromUrlParam]);

  if (isLoading) {
    return (
      <div className="grow p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !selection) {
    return (
      <div className="grow p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">シェアが見つかりません</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || "データの読み込みに失敗しました"}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  // 曲データをマップして対応させる
  const selectedSongs = selection.songs
    .map((entry) => {
      // 旧URL互換: start が一致しない場合は video_id のみでフォールバック
      return (
        allSongs.find((s) => s.video_id === entry.v && s.start === entry.s) ||
        allSongs.find((s) => s.video_id === entry.v)
      );
    })
    .filter((s) => s !== undefined) as Song[];

  // 見つからなかった曲の情報を保持
  const missingCount = selection.songs.length - selectedSongs.length;
  const createPageHref = `/share/my-best-9-songs?title=${encodeURIComponent(selection.title)}`;

  return (
    <div className="grow p-4 lg:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">
            {selection.title}
          </h1>
          {selection.author && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              by {selection.author}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {selectedSongs.length}曲
            {missingCount > 0 && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                ({missingCount}曲が見つかりません)
              </span>
            )}
          </p>
        </div>

        {/* 3x3 グリッド */}
        {selectedSongs.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 lg:gap-6 mb-8">
            {selectedSongs.map((song, idx) => (
              <Link
                key={`${song.video_id}-${song.start}-${idx}`}
                href={`/?v=${song.video_id}&t=${song.start}s`}
                className="group rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition"
              >
                <div className="aspect-video bg-black relative overflow-hidden">
                  <YoutubeThumbnail
                    videoId={song.video_id}
                    alt={song.title}
                    fill={true}
                  />
                  {/* オーバーレイ */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>

                {/* 曲情報 */}
                <div className="p-3 lg:p-4">
                  <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-pink-600 transition">
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                    {song.artist}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              曲が見つかりませんでした
            </p>
          </div>
        )}

        {/* フッター */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link
            href={createPageHref}
            className="inline-block px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700 transition mb-4"
          >
            このお題で9選を作成する
          </Link>
          <div>
            <Link
              href="/"
              className="inline-block text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition"
            >
              ← ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
