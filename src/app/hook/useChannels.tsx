import { useEffect, useState } from "react";
import type { ChannelEntry } from "../types/api/yt/channels";

const useChannels = () => {
  const [channels, setChannels] = useState<ChannelEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    fetch("/api/yt/channels")
      .then((res) => res.json())
      .then((data: ChannelEntry[]) => {
        if (!isActive) return;
        setChannels(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching channels:", error);
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return { channels, isLoading };
};

export default useChannels;
