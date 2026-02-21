export interface ViewStat {
  datetime: Date | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export const VALID_PERIODS = [
  "1d",
  "3d",
  "7d",
  "30d",
  "90d",
  "180d",
  "365d",
  "1y",
  "all",
] as const;
export type Period = (typeof VALID_PERIODS)[number];

export default ViewStat;
