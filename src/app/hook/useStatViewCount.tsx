"use client";

import { useFetch } from "@mantine/hooks";
import ViewStat from "../types/api/stat/views";

const useStatViewCount = (videoId: string) => {
  const { data, loading, error } = useFetch<{
    statistics: ViewStat[];
  }>(`/api/stat/views/${videoId}`);

  return {
    data,
    loading,
    error,
  };
};

export default useStatViewCount;
