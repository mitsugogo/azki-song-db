import fs from "fs/promises";

export const setupApiMocks = async (page: any) => {
  // Mock the Google Sheets API to avoid rate limits
  await page.route("**/api/yt/channels", async (route: any) => {
    const channelsData = await fs.readFile(
      "./e2e/dummy_channels.json",
      "utf-8",
    );
    const channels = JSON.parse(channelsData);
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

  // Mock songs API
  await page.route("**/api/songs", async (route: any) => {
    const songsData = [
      {
        slug: "dummy-song",
        title: "Dummy Song",
        artist: "Dummy Artist",
        album: "Dummy Album",
        lyricist: "Dummy Lyricist",
        composer: "Dummy Composer",
        arranger: "Dummy Arranger",
        album_list_uri: "",
        album_release_at: "2023-01-01",
        album_is_compilation: false,
        sing: "AZKi",
        video_title: "Dummy Video",
        video_uri: "https://www.youtube.com/watch?v=dummy",
        video_id: "dummy_video_id",
        start: "00:00:00",
        end: "00:05:00",
        broadcast_at: "2023-01-01T00:00:00Z",
        year: 2023,
        tags: ["dummy"],
        milestones: [],
      },
    ];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(songsData),
    });
  });
};
