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
      { name: "TOP", href: "/" },
      { name: "検索", href: "/search" },
    ],
  },
  {
    category: "データ",
    items: [
      { name: "Discography", href: "/discography" },
      { name: "統計情報", href: "/statistics" },
      { name: "活動記録", href: "/summary" },
      { name: "全データ", href: "/data" },
    ],
  },
];
