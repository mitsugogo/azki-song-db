import type { MilestoneItem } from "@/app/hook/useMilestones";
import type { Song } from "@/app/types/song";

export type ActivityTimelineMilestone = {
  date: Date;
  text: string;
  note: string;
  url: string;
  place: string;
  place_url: string;
  is_external: boolean;
};

export function toActivityDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildActivityMilestones(
  songs: Song[],
  externalMilestones: MilestoneItem[],
) {
  const songMilestones = songs
    .filter(
      (song) =>
        song.milestones && song.milestones.length > 0 && song.broadcast_at,
    )
    .flatMap((song) =>
      (song.milestones || []).map((milestone) => ({
        date: new Date(song.broadcast_at),
        text: milestone.trim(),
        note: "",
        url: "",
        place: "",
        place_url: "",
        is_external: false,
      })),
    )
    .filter(
      (milestone) =>
        Number.isFinite(milestone.date.getTime()) && Boolean(milestone.text),
    );

  const dedupedSongMilestones = Array.from(
    songMilestones
      .reduce((map, milestone) => {
        const existing = map.get(milestone.text);
        if (!existing || milestone.date.getTime() < existing.date.getTime()) {
          map.set(milestone.text, milestone);
        }
        return map;
      }, new Map<string, ActivityTimelineMilestone>())
      .values(),
  );

  const apiMilestones: ActivityTimelineMilestone[] = externalMilestones
    .map((milestone) => ({
      date: milestone.date ? new Date(milestone.date) : null,
      text: milestone.content?.trim() || "",
      note: milestone.note || "",
      url: milestone.url || "",
      place: milestone.place || "",
      place_url: milestone.place_url || "",
      is_external: true,
    }))
    .filter((milestone): milestone is ActivityTimelineMilestone =>
      Boolean(
        milestone.date &&
        Number.isFinite(milestone.date.getTime()) &&
        milestone.text,
      ),
    );

  const songByText = new Map(
    dedupedSongMilestones.map((milestone) => [milestone.text, milestone]),
  );
  const apiByText = apiMilestones.reduce((map, milestone) => {
    const group = map.get(milestone.text);
    if (group) group.push(milestone);
    else map.set(milestone.text, [milestone]);
    return map;
  }, new Map<string, ActivityTimelineMilestone[]>());

  const mergedCrossSourceMilestones: ActivityTimelineMilestone[] = [];

  for (const songMilestone of dedupedSongMilestones) {
    const apiGroup = apiByText.get(songMilestone.text);
    if (!apiGroup || apiGroup.length === 0) {
      mergedCrossSourceMilestones.push(songMilestone);
      continue;
    }

    const oldestApi = apiGroup.reduce((oldest, current) =>
      current.date.getTime() < oldest.date.getTime() ? current : oldest,
    );

    mergedCrossSourceMilestones.push({
      ...songMilestone,
      date:
        oldestApi.date.getTime() < songMilestone.date.getTime()
          ? oldestApi.date
          : songMilestone.date,
      note:
        songMilestone.note ||
        apiGroup.find((milestone) => Boolean(milestone.note))?.note ||
        "",
      url: apiGroup.find((milestone) => Boolean(milestone.url))?.url || "",
      place:
        apiGroup.find((milestone) => Boolean(milestone.place))?.place || "",
      place_url:
        apiGroup.find((milestone) => Boolean(milestone.place_url))?.place_url ||
        "",
      is_external: true,
    });
  }

  const allMilestones = [
    ...mergedCrossSourceMilestones,
    ...apiMilestones.filter((milestone) => !songByText.has(milestone.text)),
  ].sort((left, right) => left.date.getTime() - right.date.getTime());

  const uniqueMilestones = new Map<string, ActivityTimelineMilestone>();
  for (const milestone of allMilestones) {
    const key = `${toActivityDateKey(milestone.date)}::${milestone.text}`;
    const existing = uniqueMilestones.get(key);
    if (!existing) {
      uniqueMilestones.set(key, milestone);
      continue;
    }

    uniqueMilestones.set(key, {
      ...existing,
      note: existing.note || milestone.note,
      url: existing.url || milestone.url,
      place: existing.place || milestone.place,
      place_url: existing.place_url || milestone.place_url,
      is_external: existing.is_external || milestone.is_external,
    });
  }

  return [...uniqueMilestones.values()].sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );
}
