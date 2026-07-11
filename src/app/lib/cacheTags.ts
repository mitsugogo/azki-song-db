export const cacheTags = {
  coreDataset: "dataset:core",
  songs: "songs",
  songsList: "songs:list",
  milestones: "milestones",
  milestonesList: "milestones:list",
  events: "events",
  eventsList: "events:list",
  archives: "archives",
  archivesList: "archives:list",
  channels: "channels",
  channelsList: "channels:list",
  ytInfo: "yt:info",
  ytVideo: "yt:video",
  statViews: "stat:views",
  statViewsList: "stat:views:list",
  statViewsReleases: "stat:views:releases",
  statViewsSingle: "stat:views:single",
} as const;

export function buildVercelCacheTagHeader(tags: string[]): string {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  ).join(",");
}
