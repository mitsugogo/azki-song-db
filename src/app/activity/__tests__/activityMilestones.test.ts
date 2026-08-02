import { describe, expect, it } from "vitest";
import type { Song } from "@/app/types/song";
import { buildActivityMilestones } from "../activityMilestones";

const songWithMilestone = (date: string): Song =>
  ({
    title: "Test Song",
    artist: "AZKi",
    hl: { ja: { title: "Test Song", artist: "AZKi", artists: ["AZKi"] } },
    album: "",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    sing: "AZKi",
    sings: ["AZKi"],
    video_title: "Test Video",
    video_uri: "",
    video_id: "test-video",
    start: 0,
    end: 180,
    broadcast_at: date,
    year: new Date(date).getFullYear(),
    tags: [],
    milestones: ["Shared milestone"],
  }) as Song;

describe("buildActivityMilestones", () => {
  it("楽曲とAPIの同名記録をactivity年表と同じ規則で統合する", () => {
    const result = buildActivityMilestones(
      [songWithMilestone("2020-02-01T00:00:00+09:00")],
      [
        {
          date: "2020-01-01T00:00:00+09:00",
          content: "Shared milestone",
          note: "API note",
          url: "https://example.com/milestone",
        },
      ],
    );

    expect(result).toHaveLength(1);
    expect(result[0].date.toISOString()).toBe("2019-12-31T15:00:00.000Z");
    expect(result[0].note).toBe("API note");
    expect(result[0].url).toBe("https://example.com/milestone");
  });
});
