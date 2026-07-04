import { Highlight } from "@mantine/core";
import Link from "next/link";
import { Fragment } from "react";

const TimestampTextHighlight = ({
  children,
  highlight,
}: {
  children: string;
  highlight?: string;
}) => {
  const normalizedHighlight = highlight?.trim();

  if (!normalizedHighlight) {
    return <span>{children}</span>;
  }

  return (
    <Highlight
      component="span"
      color="yellow"
      highlight={normalizedHighlight}
      style={{
        color: "inherit",
        font: "inherit",
        fontWeight: "inherit",
        lineHeight: "inherit",
      }}
      highlightStyles={{
        color: "inherit",
        font: "inherit",
        fontWeight: "inherit",
        lineHeight: "inherit",
      }}
    >
      {children}
    </Highlight>
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
