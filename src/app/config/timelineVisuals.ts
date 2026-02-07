export type VisualChange = {
  label: string;
  from: string; // YYYY-MM-DD
  to: string | null;
  color?: string;
};

export const VISUAL_CHANGES: VisualChange[] = [
  { label: "1st衣装", from: "2018-11-15", to: "2019-05-25", color: "#7c3aed" },
  { label: "2nd衣装", from: "2019-05-26", to: "2021-02-22", color: "#06b6d4" },
  { label: "3rd衣装", from: "2021-02-23", to: "2022-11-14", color: "#f97316" },
  { label: "4th衣装", from: "2022-11-15", to: null, color: "#ef4444" },
];

export default VISUAL_CHANGES;
