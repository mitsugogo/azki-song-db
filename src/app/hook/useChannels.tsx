import { useEffect, useState } from "react";
import type { ChannelEntry } from "../types/api/yt/channels";

let cachedChannelsForUseChannels: ChannelEntry[] | null = null;
let channelsPromiseForUseChannels: Promise<ChannelEntry[] | null> | null = null;

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

    const handleData = (data: ChannelEntry[] | null) => {
      if (!mounted) return;
      if (!Array.isArray(data)) {
        setIsLoading(false);
        return;
      }
      cachedChannelsForUseChannels = data;
      setChannels(data);
      setIsLoading(false);
    };

    if (channelsPromiseForUseChannels) {
      channelsPromiseForUseChannels.then(handleData).catch((e) => {
        console.error("Failed to fetch channels:", e);
        if (mounted) setIsLoading(false);
      });
    } else {
      channelsPromiseForUseChannels = fetch("/api/yt/channels")
        .then(async (res) => {
          if (!res.ok) return null;
          const d = await res.json();
          return Array.isArray(d) ? (d as ChannelEntry[]) : null;
        })
        .finally(() => {
          /* keep until resolved */
        });

      channelsPromiseForUseChannels
        .then(handleData)
        .catch((e) => {
          console.error("Failed to fetch channels:", e);
          if (mounted) setIsLoading(false);
        })
        .finally(() => {
          channelsPromiseForUseChannels = null;
        });
    }

    return () => {
      mounted = false;
    };
  }, []);

  return { channels, isLoading };
};

export default useChannels;
