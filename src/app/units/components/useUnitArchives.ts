"use client";

import { useEffect, useState } from "react";
import { fetchJsonDedup } from "@/app/lib/fetchDedup";
import type { ArchiveItem } from "@/app/types/archiveItem";

export function useUnitArchives(participant: string) {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const endpoint = `/api/archives?participant=${encodeURIComponent(participant)}`;
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
  }, [participant]);

  return { items, isLoading };
}
