import { getCachedSongs, getCachedChannels } from "./test-utils";

export const setupApiMocks = async (page: any) => {
  // Mock the songs API with cached data
  await page.route("**/api/songs", async (route: any) => {
    const songs = getCachedSongs();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(songs),
    });
  });

  // Mock the Google Sheets API to avoid rate limits
  await page.route("**/api/yt/channels", async (route: any) => {
    const channels = getCachedChannels();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(channels),
    });
  });

  // Mock YouTube video API
  await page.route("**/api/yt/video/*", async (route: any) => {
    const videoData = {
      id: "dummy_video_id",
      title: "Dummy Video",
      author: "Dummy Author",
      uploadDate: "2023-01-01T00:00:00Z",
      viewCount: 1000,
      isLiveContent: false,
      thumbnails: [],
      likeCount: 100,
      tags: [],
      description: "Dummy description",
      duration: 300,
      chapters: [],
      music: null,
      lastFetchedAt: new Date().toISOString(),
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(videoData),
    });
  });

  // Mock YouTube info API
  await page.route("**/api/yt/info", async (route: any) => {
    const infoData = [
      {
        videoId: "dummy_video_id",
        title: "Dummy Video",
        snippet: { title: "Dummy Video", channelTitle: "Dummy Channel" },
        statistics: { viewCount: "1000", likeCount: "100" },
        thumbnailUrl: "https://example.com/thumbnail.jpg",
      },
    ];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(infoData),
    });
  });
};
