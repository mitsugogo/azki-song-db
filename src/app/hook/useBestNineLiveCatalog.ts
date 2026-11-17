"use client";
import { useEffect, useMemo, useState } from "react";
import type { LiveTitleGroup } from "@/app/types/live";
import { buildBestNineLiveChoices } from "@/app/lib/bestNineLive";
import { fetchJsonDedup } from "@/app/lib/fetchDedup";

export default function useBestNineLiveCatalog(enabled = true) {
  const [groups, setGroups] = useState<LiveTitleGroup[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    void fetchJsonDedup<LiveTitleGroup[]>("/api/lives")
      .then((result) => {
        if (!result || !Array.isArray(result.data))
          throw new Error("Invalid live catalog");
        if (!cancelled) setGroups(result.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  const choices = useMemo(() => buildBestNineLiveChoices(groups), [groups]);
  return { groups, choices, loading: enabled && loading, error };
}
