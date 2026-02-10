import { ReactNode } from "react";

const DEFAULT_LINK_CLASS = "text-primary hover:underline dark:text-primary-300";
const DEFAULT_TIMESTAMP_CLASS =
  "timestamp-link text-primary hover:underline dark:text-primary-300";

export type LinkifyTextOptions = {
  linkClassName?: string;
  includeLineBreaks?: boolean;
  timestampToSeconds?: (timestamp: string) => number;
  timestampLinkClassName?: string;
  hashtagPlatform?: "youtube" | "x";
};

const combinedRegex =
  /(https?:\/\/[\w\d./=?#-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff]+)|(\d{1,2}:\d{2}:\d{2})|(@[\w\d_.\-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff]+)|(#[\w\d_.\-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3130-\u318f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAff\uFE00-\uFEff]+)/g;

export const renderLinkedText = (
  text: string,
  {
    linkClassName = DEFAULT_LINK_CLASS,
    includeLineBreaks = true,
    timestampToSeconds,
    timestampLinkClassName = DEFAULT_TIMESTAMP_CLASS,
    hashtagPlatform = "x",
  }: LinkifyTextOptions = {},
): ReactNode[] => {
  if (!text) return [];

  const lines = includeLineBreaks ? text.split(/\r\n|\n/) : [text];
  const nodes: ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      nodes.push(<br key={`br-${lineIndex}`} />);
    }

    let lastIndex = 0;
    for (const match of line.matchAll(combinedRegex)) {
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        nodes.push(line.slice(lastIndex, matchIndex));
      }

      if (match[1]) {
        const url = match[1];
        nodes.push(
          <a
            key={`url-${lineIndex}-${matchIndex}`}
            href={url}
            target="_blank"
            className={linkClassName}
          >
            {url}
          </a>,
        );
      } else if (match[2] && timestampToSeconds) {
        const timestamp = match[2];
        const seconds = timestampToSeconds(timestamp);
        nodes.push(
          <a
            key={`ts-${lineIndex}-${matchIndex}`}
            href="#"
            data-t={seconds}
            className={timestampLinkClassName}
          >
            {timestamp}
          </a>,
        );
      } else if (match[2]) {
        nodes.push(match[2]);
      } else if (match[3]) {
        const handle = match[3]; // includes leading @
        const url = `https://www.youtube.com/${handle}`;
        nodes.push(
          <a
            key={`handle-${lineIndex}-${matchIndex}`}
            href={url}
            target="_blank"
            className={linkClassName}
          >
            {handle}
          </a>,
        );
      } else if (match[4]) {
        const hashtag = match[4]; // includes leading #
        const tag = hashtag.slice(1);
        const url =
          hashtagPlatform === "youtube"
            ? `https://www.youtube.com/hashtag/${tag}`
            : `https://x.com/hashtag/${tag}`;
        nodes.push(
          <a
            key={`hashtag-${lineIndex}-${matchIndex}`}
            href={url}
            target="_blank"
            className={linkClassName}
          >
            {hashtag}
          </a>,
        );
      }

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < line.length) {
      nodes.push(line.slice(lastIndex));
    }
  });

  return nodes;
};
