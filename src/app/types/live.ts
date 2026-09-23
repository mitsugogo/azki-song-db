export interface LiveSetlistEntry {
  order: string;
  title: string;
  titleEn?: string;
  artist: string;
  artistEn?: string;
  singers: string;
  singersEn?: string;
  note: string;
  noteEn?: string;
}

export interface LivePerformance {
  id: string;
  pageSlug?: string;
  performanceSlug?: string;
  title: string;
  titleEn?: string;
  category: string;
  performance: string;
  performanceEn?: string;
  date: string;
  doorsTime: string;
  startTime: string;
  venue: string;
  venueEn?: string;
  url: string;
  performers: string;
  performersEn?: string;
  ticket: string;
  ticketEn?: string;
  note: string;
  noteEn?: string;
  setlist: LiveSetlistEntry[];
}

export interface LiveTitleGroup {
  canonicalId: string;
  pageSlug?: string;
  title: string;
  titleEn?: string;
  category: string;
  performances: LivePerformance[];
  totalSongs: number;
  latestDate: string;
}
