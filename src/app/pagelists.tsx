export interface PageItem {
  name: string;
  href: string;
}

export interface PageCategory {
  category?: string;
  items: PageItem[];
}

export const pageList: PageCategory[] = [
  {
    items: [
      { name: "HOME", href: "/" },
      { name: "検索", href: "/search" },
    ],
  },
  {
    category: "活動の記録",
    items: [
      { name: "Discography", href: "/discography" },
      { name: "活動記録", href: "/summary" },
      { name: "記念日", href: "/anniversaries" },
      { name: "統計情報", href: "/statistics" },
      { name: "全データ", href: "/data" },
    ],
  },
  {
    category: "シェア",
    items: [{ name: "究極の9曲", href: "/share/my-best-9-songs" }],
  },
];
