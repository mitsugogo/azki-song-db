import { Link } from "@/i18n/navigation";
import { ReactNode } from "react";
import {
  HASHTAG_CANDIDATE_PATTERN,
  isValidHashtagForPlatform,
  sanitizeHashtagToken,
  type HashtagPlatform,
} from "./hashtag";

const DEFAULT_LINK_CLASS = "text-primary hover:underline dark:text-primary-300";
const DEFAULT_TIMESTAMP_CLASS =
  "timestamp-link text-primary hover:underline dark:text-primary-300";

export type LinkifyTextOptions = {
  linkClassName?: string;
  includeLineBreaks?: boolean;
  timestampToSeconds?: (timestamp: string) => number;
  timestampLinkClassName?: string;
  hashtagPlatform?: HashtagPlatform;
};

const combinedRegex = new RegExp(
  `(https?:\\/\\/[a-zA-Z0-9_0-9\\uFF10-\\uFF19./=?#-\\u3000-\\u303f\\u3040-\\u309f\\u30a0-\\u30ff\\u3130-\\u318f\\u3300-\\u33ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uF900-\\uFAff\\uFE00-\\uFEff]+)|([0-9\\uFF10-\\uFF19]{1,2}:[0-9\\uFF10-\\uFF19]{2}:[0-9\\uFF10-\\uFF19]{2})|(@[a-zA-Z0-9_0-9\\uFF10-\\uFF19_.\\-\\u3000-\\u303f\\u3040-\\u309f\\u30a0-\\u30ff\\u3130-\\u318f\\u3300-\\u33ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uF900-\\uFAff\\uFE00-\\uFEff]+)|(${HASHTAG_CANDIDATE_PATTERN})`,
  "gu",
);

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
        const rawHashtag = match[4];
        const hashtag = sanitizeHashtagToken(rawHashtag);
        const trailingText = rawHashtag.slice(hashtag.length);
        if (!hashtag) {
          nodes.push(rawHashtag);
          lastIndex = matchIndex + match[0].length;
          continue;
        }
        if (!isValidHashtagForPlatform(hashtag, hashtagPlatform)) {
          nodes.push(rawHashtag);
        } else {
          const tag = hashtag.slice(1);
          const url =
            hashtagPlatform === "youtube"
              ? `https://www.youtube.com/hashtag/${tag}`
              : hashtagPlatform === "self"
                ? `/?q=${encodeURIComponent(`#${tag}`)}`
                : hashtagPlatform === "x"
                  ? `https://x.com/hashtag/${tag}`
                  : `#${tag}`;
          nodes.push(
            <Link
              key={`hashtag-${lineIndex}-${matchIndex}`}
              href={url}
              target={hashtagPlatform === "self" ? "_self" : "_blank"}
              rel={
                hashtagPlatform === "self" ? undefined : "noopener noreferrer"
              }
              className={linkClassName}
            >
              {hashtag}
            </Link>,
          );
          if (trailingText) {
            nodes.push(trailingText);
          }
        }
      }

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < line.length) {
      nodes.push(line.slice(lastIndex));
    }
  });

  return nodes;
};
