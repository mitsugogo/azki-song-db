import { useFetch } from "@mantine/hooks";
import type { ChannelEntry } from "../types/api/yt/channels";

const useChannels = () => {
  const { data, error, loading } = useFetch<ChannelEntry[]>("/api/yt/channels");

  if (error) {
    console.error("Failed to fetch channels:", error);
  }

  return { channels: Array.isArray(data) ? data : [], isLoading: loading };
};

export default useChannels;
