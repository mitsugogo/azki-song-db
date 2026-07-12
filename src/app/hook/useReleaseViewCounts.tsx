"use client";

import { useEffect, useState } from "react";
import { fetchJsonDedup } from "../lib/fetchDedup";
import type { Period, ViewCountStat } from "../types/api/stat/views";

type ReleaseStatisticsResponse = {
  statistics: Record<string, ViewCountStat[]>;
};

const useReleaseViewCounts = (
  period: Period = "7d",
  enabled: boolean = true,
) => {
  const [data, setData] = useState<Record<string, ViewCountStat[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const url = `/api/stat/views/releases?period=${period}`;
    fetchJsonDedup<ReleaseStatisticsResponse>(url)
      .then((result) => {
        if (!mounted) return;
        setData(result.data?.statistics ?? {});
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
  }, [enabled, period]);

  return { data, loading };
};

export default useReleaseViewCounts;
