import { Song } from "./song";
import { VideoInfo } from "./videoInfo";

export interface StatisticsItem {
  key: string;
  count: number;
  song: Song;
  firstVideo: Song;
  lastVideo: Song;
}
