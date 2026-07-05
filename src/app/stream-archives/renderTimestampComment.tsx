import Link from "next/link";
import { Fragment } from "react";
import { findArchiveSearchHighlightRange } from "./archiveSearch";

const TimestampTextHighlight = ({
  children,
  highlight,
}: {
  children: string;
  highlight?: string;
}) => {
  const highlightRange = findArchiveSearchHighlightRange(
    children,
    highlight ?? "",
  );

  if (!highlightRange) {
    return <span>{children}</span>;
  }

  return (
    <span>
      {children.slice(0, highlightRange.start)}
      <mark
        style={{
          backgroundColor: "var(--mantine-color-yellow-light)",
          color: "inherit",
          font: "inherit",
          fontWeight: "inherit",
          lineHeight: "inherit",
        }}
      >
        {children.slice(highlightRange.start, highlightRange.end)}
      </mark>
      {children.slice(highlightRange.end)}
    </span>
  );
};

export const renderTimestampComment = (
  comment: string,
  videoId?: string,
  highlight?: string,
) => {
  if (!comment) {
    return null;
  }

  const lines = comment.split(/\r?\n/);

  return lines.map((line, index) => {
    const timestampMatch = line.match(/([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?)/);

    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      const timestampSeconds = timestamp
        .split(":")
        .reverse()
        .reduce((total, value, position) => {
          const seconds = Number(value);
          return total + seconds * 60 ** position;
        }, 0);
      const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId ?? "")}&t=${timestampSeconds}`;

      return (
        <Fragment key={`${timestamp}-${index}`}>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            <TimestampTextHighlight highlight={highlight}>
              {timestamp}
            </TimestampTextHighlight>
          </Link>
          <TimestampTextHighlight highlight={highlight}>
            {line.replace(timestamp, "")}
          </TimestampTextHighlight>
          {index < lines.length - 1 ? <br /> : null}
        </Fragment>
      );
    }

    return (
      <Fragment key={`${line}-${index}`}>
        <TimestampTextHighlight highlight={highlight}>
          {line}
        </TimestampTextHighlight>
        {index < lines.length - 1 ? <br /> : null}
      </Fragment>
    );
  });
};
