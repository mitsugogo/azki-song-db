"use client";

import { useEffect, useState } from "react";
import { fetchJsonDedup } from "@/app/lib/fetchDedup";
import type { ArchiveItem } from "@/app/types/archiveItem";

export function useUnitArchives(participants: string[]) {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const endpoint = (() => {
    const searchParams = new URLSearchParams();
    participants.forEach((participant) =>
      searchParams.append("participant", participant),
    );
    return `/api/archives?${searchParams.toString()}`;
  })();

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchJsonDedup<ArchiveItem[]>(endpoint)
      .then(({ data }) => {
        if (active) setItems(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endpoint]);

  return { items, isLoading };
}
