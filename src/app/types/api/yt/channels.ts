export interface ChannelEntry {
  branch: string;
  generation: string;
  talentName: string;
  artistName: string;
  youtubeId: string;
  channelName: string;
  handle: string;
  subscriberCount: number;
  iconUrl: string;
}

export type ChannelsResponse = ChannelEntry[];
