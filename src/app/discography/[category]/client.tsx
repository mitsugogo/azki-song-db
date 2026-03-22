"use client";

import DiscographyClient from "../client";

const CATEGORY_TO_TAB: Record<string, number> = {
  originals: 1,
  collab: 2,
  covers: 3,
};

export default function CategoryClient({ category }: { category: string }) {
  const initialTab = CATEGORY_TO_TAB[category] ?? 0;
  return <DiscographyClient initialTab={initialTab} />;
}
