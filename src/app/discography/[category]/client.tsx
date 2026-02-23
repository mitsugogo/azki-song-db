"use client";

import DiscographyPage from "../components/DiscographyPage";

export default function CategoryClient({ category }: { category: string }) {
  return <DiscographyPage initialCategory={category} />;
}
