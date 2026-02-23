export type ViewMilestoneStatus = "remain" | "achieved";

export interface ViewMilestoneInfo {
  status: ViewMilestoneStatus;
  targetCount: number;
  achievedAt?: string | null;
  estimatedAt?: string | null;
}
