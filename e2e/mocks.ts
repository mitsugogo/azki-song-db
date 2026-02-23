import {
  getCachedSongs,
  getCachedChannels,
  getCachedMilestones,
} from "./test-utils";

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

  await page.route("**/api/milestones", async (route: any) => {
    const milestones = getCachedMilestones();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(milestones),
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

  // Mock YouTube video API (return YouTube Data API - like shape)
  await page.route("**/api/yt/video/*", async (route: any) => {
    const videoData = {
      id: "dummy_video_id",
      snippet: {
        title: "Dummy Video",
        description: `E2E description line 1\nE2E description line 2\nE2E description line 3\nE2E description line 4\nE2E description line 5`,
        publishedAt: "2025-01-01T00:00:00Z",
        channelTitle: "Dummy Channel",
        tags: ["歌枠", "test"],
        localized: {
          title: "Dummy Video",
          description: `E2E description line 1\nE2E description line 2\nE2E description line 3\nE2E description line 4\nE2E description line 5`,
        },
      },
      statistics: {
        viewCount: "12345",
        likeCount: "100",
      },
      contentDetails: { duration: "PT5M" },
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
