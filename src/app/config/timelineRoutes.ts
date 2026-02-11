export type RouteConfig = {
  label: string;
  from: string;
  to: string | null;
};

export const ROUTE_RANGES: RouteConfig[] = [
  { label: "ルートα", from: "2018-11-15", to: "2021-04-10" },
  { label: "ルートβ", from: "2021-04-11", to: "2023-06-30" },
  { label: "ルートγ", from: "2023-07-01", to: "2025-06-30" },
  { label: "新たなルート", from: "2025-07-01", to: null },
];

export default ROUTE_RANGES;
