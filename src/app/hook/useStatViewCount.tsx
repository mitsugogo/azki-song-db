"use client";

import { useFetch } from "@mantine/hooks";
import ViewStat from "../types/api/stat/views";
import type { Period } from "../types/api/stat/views";

const useStatViewCount = (videoId: string, period: Period) => {
  const { data, loading, error } = useFetch<{
    statistics: ViewStat[];
  }>(`/api/stat/views/${videoId}?period=${period}`);

  return {
    data,
    loading,
    error,
  };
};

export default useStatViewCount;
