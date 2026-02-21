export interface ViewStat {
  datetime: Date | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export default ViewStat;
