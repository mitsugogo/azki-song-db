import { useEffect, useState } from "react";
import { fetchJsonDedup } from "../lib/fetchDedup";

type MilestoneItem = {
  date: string; // ISO or empty
  content: string;
  note?: string;
  url?: string;
};

let cachedMilestones: MilestoneItem[] | null = null;
let milestonesPromise: Promise<any> | null = null;
let cachedFetchedAt: string | null = null;

const useMilestones = () => {
  const [items, setItems] = useState<MilestoneItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    if (cachedMilestones) {
      setItems(cachedMilestones);
      if (cachedFetchedAt) setFetchedAt(cachedFetchedAt);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    if (!milestonesPromise) {
      milestonesPromise = fetchJsonDedup<MilestoneItem[]>("/api/milestones");
    }

    const p = milestonesPromise;
    p.then((res: any) => {
      if (!mounted) return;
      const data = Array.isArray(res.data) ? res.data : [];
      // normalize: ensure objects have expected keys
      const normalized = data
        .map((it: any) => ({
          date: it?.date || "",
          content: it?.content || "",
          note: it?.note || "",
          url: it?.url || "",
        }))
        .filter((it: MilestoneItem) => it.date || it.content);

      cachedMilestones = normalized;
      setItems(normalized);

      const hdrs = res.headers ?? {};
      const maybeDate = hdrs["x-data-updated"] || hdrs["last-modified"] || null;
      if (maybeDate) {
        const dt = new Date(maybeDate);
        const toSet = !isNaN(dt.getTime()) ? dt.toISOString() : maybeDate;
        setFetchedAt(toSet);
        cachedFetchedAt = toSet;
      }
      setIsLoading(false);
    })
      .catch((e: any) => {
        console.error(e);
        if (mounted) setIsLoading(false);
      })
      .finally(() => {
        if (milestonesPromise === p) milestonesPromise = null;
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { items, isLoading, fetchedAt };
};

export default useMilestones;
