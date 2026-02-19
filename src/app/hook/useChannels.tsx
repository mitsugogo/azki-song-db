import { useEffect, useState } from "react";
import type { ChannelEntry } from "../types/api/yt/channels";
import { fetchJsonDedup } from "../lib/fetchDedup";

let cachedChannelsForUseChannels: ChannelEntry[] | null = null;

const useChannels = () => {
  const [channels, setChannels] = useState<ChannelEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (cachedChannelsForUseChannels) {
      setChannels(cachedChannelsForUseChannels);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    fetchJsonDedup<ChannelEntry[]>("/api/yt/channels")
      .then((res) => {
        if (!mounted) return;
        const d = res?.data ?? null;
        if (!Array.isArray(d)) {
          setIsLoading(false);
          return;
        }
        cachedChannelsForUseChannels = d;
        setChannels(d);
        setIsLoading(false);
      })
      .catch((e) => {
        console.error("Failed to fetch channels:", e);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { channels, isLoading };
};

export default useChannels;
