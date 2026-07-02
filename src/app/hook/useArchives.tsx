import { useEffect, useState } from "react";
import { fetchJsonDedup } from "../lib/fetchDedup";
import { ArchiveItem } from "../types/archiveItem";

const cachedArchives = new Map<string, ArchiveItem[]>();
const cachedFetchedAt = new Map<string, string>();
const archivesPromise = new Map<string, Promise<any>>();

const useArchives = () => {
  const cacheKey = "archives";
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    const cached = cachedArchives.get(cacheKey);
    if (cached) {
      setItems(cached);
      const cachedDate = cachedFetchedAt.get(cacheKey);
      if (cachedDate) {
        setFetchedAt(cachedDate);
      }
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const endpoint = "/api/archives";

    if (!archivesPromise.has(cacheKey)) {
      archivesPromise.set(cacheKey, fetchJsonDedup<ArchiveItem[]>(endpoint));
    }

    const promise = archivesPromise.get(cacheKey);
    if (!promise) {
      setIsLoading(false);
      return;
    }

    promise
      .then((res: any) => {
        if (!mounted) {
          return;
        }

        const data = Array.isArray(res?.data) ? res.data : [];
        const normalizedItems = data
          .map((item: Partial<ArchiveItem>) => ({
            sequence: Number(item?.sequence ?? 0),
            topic: item?.topic || "",
            title: item?.title || "",
            video_id: item?.video_id || "",
            channel_id: item?.channel_id || "",
            video_url: item?.video_url || "",
            video_duration: item?.video_duration || "",
            description: item?.description || "",
            published_at: item?.published_at || "",
            stream_started_at: item?.stream_started_at || "",
            timestamp_comment: item?.timestamp_comment || "",
          }))
          .filter((item: ArchiveItem) => item.title && item.video_id);

        cachedArchives.set(cacheKey, normalizedItems);
        setItems(normalizedItems);

        const headers = res?.headers ?? {};
        const maybeDate = headers["x-data-updated"] || headers["last-modified"];
        if (maybeDate) {
          const date = new Date(maybeDate);
          const resolved = Number.isNaN(date.getTime())
            ? maybeDate
            : date.toISOString();
          setFetchedAt(resolved);
          cachedFetchedAt.set(cacheKey, resolved);
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
        const current = archivesPromise.get(cacheKey);
        if (current === promise) {
          archivesPromise.delete(cacheKey);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { items, isLoading, fetchedAt };
};

export default useArchives;
