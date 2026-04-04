import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { fetchJsonDedup } from "../lib/fetchDedup";

type MilestoneItem = {
  date: string; // ISO or empty
  content: string;
  note?: string;
  url?: string;
};

const cachedMilestonesByLocale = new Map<string, MilestoneItem[]>();
const milestonesPromiseByLocale = new Map<string, Promise<any>>();
const cachedFetchedAtByLocale = new Map<string, string>();

const normalizeLocale = (locale: string | undefined) => {
  const localeCode = (locale || "ja").toLowerCase().split("-")[0];
  return localeCode === "en" ? "en" : "ja";
};

const useMilestones = () => {
  const locale = useLocale();
  const normalizedLocale = useMemo(() => normalizeLocale(locale), [locale]);

  const [items, setItems] = useState<MilestoneItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    const cached = cachedMilestonesByLocale.get(normalizedLocale);
    if (cached) {
      setItems(cached);
      const cachedFetchedAt = cachedFetchedAtByLocale.get(normalizedLocale);
      if (cachedFetchedAt) setFetchedAt(cachedFetchedAt);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const endpoint = `/api/milestones?hl=${encodeURIComponent(normalizedLocale)}`;

    if (!milestonesPromiseByLocale.has(normalizedLocale)) {
      milestonesPromiseByLocale.set(
        normalizedLocale,
        fetchJsonDedup<MilestoneItem[]>(endpoint),
      );
    }

    const p = milestonesPromiseByLocale.get(normalizedLocale);
    if (!p) {
      setIsLoading(false);
      return;
    }

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

      cachedMilestonesByLocale.set(normalizedLocale, normalized);
      setItems(normalized);

      const hdrs = res.headers ?? {};
      const maybeDate = hdrs["x-data-updated"] || hdrs["last-modified"] || null;
      if (maybeDate) {
        const dt = new Date(maybeDate);
        const toSet = !isNaN(dt.getTime()) ? dt.toISOString() : maybeDate;
        setFetchedAt(toSet);
        cachedFetchedAtByLocale.set(normalizedLocale, toSet);
      }
      setIsLoading(false);
    })
      .catch((e: any) => {
        console.error(e);
        if (mounted) setIsLoading(false);
      })
      .finally(() => {
        const current = milestonesPromiseByLocale.get(normalizedLocale);
        if (current === p) milestonesPromiseByLocale.delete(normalizedLocale);
      });

    return () => {
      mounted = false;
    };
  }, [normalizedLocale]);

  return { items, isLoading, fetchedAt };
};

export default useMilestones;
