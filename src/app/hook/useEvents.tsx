import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { fetchJsonDedup } from "../lib/fetchDedup";
import { EventItem } from "../types/eventItem";

const cachedEventsByLocale = new Map<string, EventItem[]>();
const eventsPromiseByLocale = new Map<string, Promise<any>>();
const cachedFetchedAtByLocale = new Map<string, string>();

const normalizeLocale = (locale: string | undefined) => {
  const localeCode = (locale || "ja").toLowerCase().split("-")[0];
  return localeCode === "en" ? "en" : "ja";
};

const useEvents = () => {
  const locale = useLocale();
  const normalizedLocale = useMemo(() => normalizeLocale(locale), [locale]);

  const [items, setItems] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    const cached = cachedEventsByLocale.get(normalizedLocale);
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
    const endpoint = `/api/events?hl=${encodeURIComponent(normalizedLocale)}`;

    if (!eventsPromiseByLocale.has(normalizedLocale)) {
      eventsPromiseByLocale.set(
        normalizedLocale,
        fetchJsonDedup<EventItem[]>(endpoint),
      );
    }

    const promise = eventsPromiseByLocale.get(normalizedLocale);
    if (!promise) {
      setIsLoading(false);
      return;
    }

    promise
      .then((res: any) => {
        if (!mounted) {
          return;
        }

        const data = Array.isArray(res?.data) ? res.data : [];
        const normalizedItems = data
          .map((item: Partial<EventItem>) => ({
            start_at: item?.start_at || "",
            end_at: item?.end_at || "",
            content: item?.content || "",
            place: item?.place || "",
            place_url: item?.place_url || "",
            note: item?.note || "",
            url: item?.url || "",
          }))
          .filter((item: EventItem) => Boolean(item.start_at && item.content));

        cachedEventsByLocale.set(normalizedLocale, normalizedItems);
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

        const current = eventsPromiseByLocale.get(normalizedLocale);
        if (current === promise) {
          eventsPromiseByLocale.delete(normalizedLocale);
        }
      });

    return () => {
      mounted = false;
    };
  }, [normalizedLocale]);

  return { items, isLoading, fetchedAt };
};

export default useEvents;
