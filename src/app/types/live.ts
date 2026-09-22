export interface LiveSetlistEntry {
  order: string;
  title: string;
  artist: string;
  singers: string;
  note: string;
}

export interface LivePerformance {
  id: string;
  pageSlug?: string;
  performanceSlug?: string;
  title: string;
  category: string;
  performance: string;
  date: string;
  doorsTime: string;
  startTime: string;
  venue: string;
  url: string;
  performers: string;
  ticket: string;
  note: string;
  setlist: LiveSetlistEntry[];
}

export interface LiveTitleGroup {
  canonicalId: string;
  pageSlug?: string;
  title: string;
  category: string;
  performances: LivePerformance[];
  totalSongs: number;
  latestDate: string;
}
