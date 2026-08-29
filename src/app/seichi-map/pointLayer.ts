export type SeichiMapPointLayer = "self" | "everyone";

export const SEICHI_MAP_UNVISITED_COLOR = "#1c7ed6";
export const SEICHI_MAP_SELF_VISITED_COLOR = "#d63384";
export const SEICHI_MAP_EVERYONE_SINGLE_VISITOR_COLOR = "#fab005";
export const SEICHI_MAP_EVERYONE_LIGHT_COLOR = "#faa2c1";
export const SEICHI_MAP_EVERYONE_DARK_COLOR = "#c2255c";

export type SeichiMapMarkerPresentation = {
  color: string;
  priority: number;
};

type SeichiMapMarkerPresentationInput = {
  pointLayer: SeichiMapPointLayer;
  isVisited: boolean;
  uniqueVisitorCount: number;
  maxUniqueVisitorCount: number;
};

const parseHexColor = (color: string): [number, number, number] => [
  Number.parseInt(color.slice(1, 3), 16),
  Number.parseInt(color.slice(3, 5), 16),
  Number.parseInt(color.slice(5, 7), 16),
];

const toHexColor = (red: number, green: number, blue: number): string =>
  `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const interpolateColor = (
  start: string,
  end: string,
  ratio: number,
): string => {
  const startRgb = parseHexColor(start);
  const endRgb = parseHexColor(end);
  const clampedRatio = Math.min(1, Math.max(0, ratio));

  return toHexColor(
    startRgb[0] + (endRgb[0] - startRgb[0]) * clampedRatio,
    startRgb[1] + (endRgb[1] - startRgb[1]) * clampedRatio,
    startRgb[2] + (endRgb[2] - startRgb[2]) * clampedRatio,
  );
};

export const getSeichiMapMarkerPresentation = ({
  pointLayer,
  isVisited,
  uniqueVisitorCount,
  maxUniqueVisitorCount,
}: SeichiMapMarkerPresentationInput): SeichiMapMarkerPresentation => {
  if (pointLayer === "self") {
    return {
      color: isVisited
        ? SEICHI_MAP_SELF_VISITED_COLOR
        : SEICHI_MAP_UNVISITED_COLOR,
      priority: Number(isVisited),
    };
  }

  const visitorCount = Math.max(0, uniqueVisitorCount);
  if (visitorCount === 0) {
    return { color: SEICHI_MAP_UNVISITED_COLOR, priority: 0 };
  }
  if (visitorCount === 1) {
    return {
      color: SEICHI_MAP_EVERYONE_SINGLE_VISITOR_COLOR,
      priority: visitorCount,
    };
  }

  const colorRatio =
    maxUniqueVisitorCount <= 2
      ? 0
      : Math.log(visitorCount / 2) / Math.log(maxUniqueVisitorCount / 2);

  return {
    color: interpolateColor(
      SEICHI_MAP_EVERYONE_LIGHT_COLOR,
      SEICHI_MAP_EVERYONE_DARK_COLOR,
      colorRatio,
    ),
    priority: visitorCount,
  };
};

export const compareSeichiMapMarkerPresentations = (
  left: SeichiMapMarkerPresentation,
  right: SeichiMapMarkerPresentation,
): number => left.priority - right.priority;
