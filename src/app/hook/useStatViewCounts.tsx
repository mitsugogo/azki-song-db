"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJsonDedup } from "../lib/fetchDedup";
import { ViewStat } from "../types/api/stat/views";

const CHUNK_SIZE = 40;

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

type StatisticsResponse = {
  statistics: Record<string, ViewStat[]>;
};

const useStatViewCounts = (videoIds: string[]) => {
  const [data, setData] = useState<Record<string, ViewStat[]>>({});
  const [loading, setLoading] = useState(false);

  const normalizedIds = useMemo(
    () => [...new Set(videoIds.filter(Boolean))],
    [videoIds],
  );

  useEffect(() => {
    if (normalizedIds.length === 0) {
      setData({});
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const chunks = chunkArray(normalizedIds, CHUNK_SIZE);

    Promise.all(
      chunks.map(async (chunk) => {
        const url = `/api/stat/views?videoIds=${encodeURIComponent(chunk.join(","))}`;
        const result = await fetchJsonDedup<StatisticsResponse>(url);
        return result.data?.statistics || {};
      }),
    )
      .then((responses) => {
        if (!mounted) return;
        const merged = responses.reduce<Record<string, ViewStat[]>>(
          (acc, current) => ({ ...acc, ...current }),
          {},
        );
        setData(merged);
      })
      .catch((error) => {
        console.error(error);
        if (!mounted) return;
        setData({});
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [normalizedIds]);

  return {
    data,
    loading,
  };
};

export default useStatViewCounts;
