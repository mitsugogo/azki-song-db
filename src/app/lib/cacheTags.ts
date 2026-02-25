export const cacheTags = {
  coreDataset: "dataset:core",
  songs: "songs",
  songsList: "songs:list",
  milestones: "milestones",
  milestonesList: "milestones:list",
  channels: "channels",
  channelsList: "channels:list",
  statViews: "stat:views",
  statViewsList: "stat:views:list",
  statViewsSingle: "stat:views:single",
} as const;

export function buildVercelCacheTagHeader(tags: string[]): string {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  ).join(",");
}
