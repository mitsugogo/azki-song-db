import { ViewStat } from "../types/api/stat/views";
import { ViewMilestoneInfo } from "../types/viewMilestone";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ESTIMATION_DAYS = 14;

type ViewMilestoneTarget = {
  status: "remain" | "achieved";
  targetCount: number;
};

function getRemainCount(viewCount: number) {
  if (viewCount < 100000) {
    const remaining = 10000 - (viewCount % 10000);
    if (remaining <= 3000) return remaining;
  }
  if (viewCount < 1000000) {
    const remaining = 100000 - (viewCount % 100000);
    if (remaining <= 10000) return remaining;
  }
  if (viewCount >= 1000000) {
    const remaining = 1000000 - (viewCount % 1000000);
    if (remaining <= 20000) return remaining;
  }
  return null;
}

function getAchievedMilestone(viewCount: number) {
  if (viewCount >= 1000000) {
    const milestone = Math.floor(viewCount / 1000000) * 1000000;
    if (viewCount <= milestone + 10000) {
      return milestone;
    }
  } else if (viewCount >= 300000) {
    const milestone = Math.floor(viewCount / 100000) * 100000;
    if (viewCount <= milestone + 10000) {
      return milestone;
    }
  } else if (viewCount >= 100000) {
    const milestone = Math.floor(viewCount / 100000) * 100000;
    if (viewCount <= milestone + 5000) {
      return milestone;
    }
  } else if (viewCount >= 10000) {
    const milestone = Math.floor(viewCount / 10000) * 10000;
    if (viewCount <= milestone + 1000) {
      return milestone;
    }
  }

  return null;
}

function getTarget(viewCount: number): ViewMilestoneTarget | null {
  const remain = getRemainCount(viewCount);
  if (remain) {
    return {
      status: "remain",
      targetCount: viewCount + remain,
    };
  }

  const achieved = getAchievedMilestone(viewCount);
  if (achieved) {
    return {
      status: "achieved",
      targetCount: achieved,
    };
  }

  return null;
}

function findAchievedAt(history: ViewStat[], targetCount: number) {
  const sorted = [...history]
    .filter((item) => item?.datetime)
    .sort(
      (a, b) =>
        new Date(a.datetime as Date).getTime() -
        new Date(b.datetime as Date).getTime(),
    );

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const previousCount = previous.viewCount ?? 0;
    const currentCount = current.viewCount ?? 0;

    if (previousCount < targetCount && currentCount >= targetCount) {
      return new Date(current.datetime as Date).toISOString();
    }
  }

  return null;
}

function estimateReachedAt(history: ViewStat[], targetCount: number) {
  if (history.length < 2) return null;

  const sorted = [...history]
    .filter((item) => item?.datetime)
    .sort(
      (a, b) =>
        new Date(a.datetime as Date).getTime() -
        new Date(b.datetime as Date).getTime(),
    );

  if (sorted.length < 2) return null;

  const latest = sorted[sorted.length - 1];
  const latestTime = new Date(latest.datetime as Date).getTime();
  const fromTime = latestTime - 30 * DAY_MS;

  const windowed = sorted.filter((item) => {
    const time = new Date(item.datetime as Date).getTime();
    return time >= fromTime && time <= latestTime;
  });

  const base = windowed[0] ?? sorted[Math.max(0, sorted.length - 2)];
  const elapsed = latestTime - new Date(base.datetime as Date).getTime();
  if (elapsed <= 0) return null;

  const growth = (latest.viewCount ?? 0) - (base.viewCount ?? 0);
  if (growth <= 0) return null;

  const remain = targetCount - (latest.viewCount ?? 0);
  if (remain <= 0) return new Date(latestTime).toISOString();

  const perDay = growth / (elapsed / DAY_MS);
  if (perDay <= 0) return null;

  const daysToTarget = remain / perDay;
  if (!isFinite(daysToTarget) || daysToTarget < 0) return null;
  if (daysToTarget > MAX_ESTIMATION_DAYS) return null;

  return new Date(latestTime + daysToTarget * DAY_MS).toISOString();
}

export function buildViewMilestoneInfo(
  viewCount: number,
  history: ViewStat[] | undefined,
): ViewMilestoneInfo | null {
  const target = getTarget(viewCount);
  if (!target) return null;

  const safeHistory = history || [];
  if (target.status === "achieved") {
    return {
      status: "achieved",
      targetCount: target.targetCount,
      achievedAt: findAchievedAt(safeHistory, target.targetCount),
    };
  }

  return {
    status: "remain",
    targetCount: target.targetCount,
    estimatedAt: estimateReachedAt(safeHistory, target.targetCount),
  };
}
