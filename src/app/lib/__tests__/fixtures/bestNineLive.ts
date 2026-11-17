import type { LiveTitleGroup } from "@/app/types/live";
export const departureGroups = [
  {
    canonicalId: "departure",
    title: "Departure",
    category: "ソロライブ",
    performances: [
      {
        id: "departure",
        title: "Departure",
        performance: "",
        date: "2025-11-19",
        category: "ソロライブ",
        setlist: [
          {
            order: "01",
            title: "未来カンパネラ",
            artist: "AZKi",
            singers: "AZKi",
            note: "",
          },
          {
            order: "02a",
            title: "Creating world",
            artist: "AZKi",
            singers: "AZKi",
            note: "メドレー",
          },
          {
            order: "03",
            title: "without U (Re:arrange ver.)",
            artist: "AZKi",
            singers: "AZKi",
            note: "",
          },
          {
            order: "04",
            title: "Guest solo",
            artist: "星街すいせい",
            singers: "星街すいせい",
            note: "",
          },
          {
            order: "05",
            title: "Unknown singer",
            artist: "AZKi",
            singers: "",
            note: "",
          },
          {
            order: "06",
            title: "Going My Way",
            artist: "AZKi、星街すいせい",
            singers: "AZKi、星街すいせい",
            note: "",
          },
        ],
      },
    ],
  },
] as LiveTitleGroup[];
