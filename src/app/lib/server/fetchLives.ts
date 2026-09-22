import { cache } from "react";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import type { LiveTitleGroup } from "@/app/types/live";

const getBaseCandidates = (baseUrlOverride?: string) =>
  Array.from(
    new Set(
      [
        baseUrlOverride,
        baseUrl,
        process.env.NEXT_PUBLIC_BASE_URL,
        process.env.PUBLIC_BASE_URL,
        process.env.NODE_ENV === "development"
          ? `http://127.0.0.1:${process.env.PORT ?? 3000}`
          : undefined,
        siteConfig.siteUrl,
      ].filter(Boolean) as string[],
    ),
  );

export const fetchLiveTitleGroupsFromApi = cache(
  async (baseUrlOverride?: string): Promise<LiveTitleGroup[]> => {
    for (const base of getBaseCandidates(baseUrlOverride)) {
      try {
        const response = await fetch(new URL("/api/lives", base), {
          cache: "no-store",
        });
        if (!response.ok) continue;
        return (await response.json()) as LiveTitleGroup[];
      } catch {
        // Try the next configured base URL.
      }
    }
    throw new Error("Failed to fetch live setlists from any known base URL");
  },
);
