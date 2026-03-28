import { Song } from "./song";
import { ViewMilestoneInfo } from "./viewMilestone";

export interface StatisticsItem {
  key: string;
  count: number;
  song: Song;
  firstVideo: Song;
  lastVideo: Song;
  effectiveViewCount?: number;
  statVideoId?: string;
  viewMilestone?: ViewMilestoneInfo | null;
}
