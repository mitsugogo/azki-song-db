import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { fetchJsonDedup } from "../lib/fetchDedup";
import { AnniversaryItem } from "../types/anniversaryItem";

const cachedAnniversariesByLocale = new Map<string, AnniversaryItem[]>();
const cachedFetchedAtByLocale = new Map<string, string>();
const anniversariesPromiseByLocale = new Map<string, Promise<any>>();

const normalizeLocale = (locale: string | undefined) => {
  const localeCode = (locale || "ja").toLowerCase().split("-")[0];
  return localeCode === "en" ? "en" : "ja";
};

const useAnniversaries = () => {
  const locale = useLocale();
  const normalizedLocale = useMemo(() => normalizeLocale(locale), [locale]);

  const [items, setItems] = useState<AnniversaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    const cached = cachedAnniversariesByLocale.get(normalizedLocale);
    if (cached) {
      setItems(cached);
      const cachedFetchedAt = cachedFetchedAtByLocale.get(normalizedLocale);
      if (cachedFetchedAt) {
        setFetchedAt(cachedFetchedAt);
      }
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const endpoint = `/api/anniversaries?hl=${encodeURIComponent(normalizedLocale)}`;

    if (!anniversariesPromiseByLocale.has(normalizedLocale)) {
      anniversariesPromiseByLocale.set(
        normalizedLocale,
        fetchJsonDedup<AnniversaryItem[]>(endpoint),
      );
    }

    const promise = anniversariesPromiseByLocale.get(normalizedLocale);
    if (!promise) {
      setIsLoading(false);
      return;
    }

    promise
      .then((res: any) => {
        if (!mounted) return;

        const data = Array.isArray(res?.data) ? res.data : [];
        const normalizedItems = data
          .map((item: Partial<AnniversaryItem>) => ({
            date: item?.date || "",
            first_date_at: item?.first_date_at || "",
            // next_date_at is computed on client if needed
            name: item?.name || "",
            url: item?.url || "",
            note: item?.note || "",
          }))
          .filter((item: AnniversaryItem) => Boolean(item.name))
          .sort((a: AnniversaryItem, b: AnniversaryItem) => {
            // deterministic ordering: sort by name
            return (a.name || "").localeCompare(b.name || "");
          });

        cachedAnniversariesByLocale.set(normalizedLocale, normalizedItems);
        setItems(normalizedItems);

        const headers = res?.headers ?? {};
        const maybeDate = headers["x-data-updated"] || headers["last-modified"];
        if (maybeDate) {
          const date = new Date(maybeDate);
          const resolved = Number.isNaN(date.getTime())
            ? maybeDate
            : date.toISOString();
          setFetchedAt(resolved);
          cachedFetchedAtByLocale.set(normalizedLocale, resolved);
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
        const current = anniversariesPromiseByLocale.get(normalizedLocale);
        if (current === promise) {
          anniversariesPromiseByLocale.delete(normalizedLocale);
        }
      });

    return () => {
      mounted = false;
    };
  }, [normalizedLocale]);

  return { items, isLoading, fetchedAt };
};

export default useAnniversaries;
