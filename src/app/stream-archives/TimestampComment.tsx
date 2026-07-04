"use client";

import { Button } from "@mantine/core";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { renderTimestampComment } from "./renderTimestampComment";
import { useTranslations } from "next-intl";

const PREVIEW_LINE_COUNT = 5;

type TimestampCommentProps = {
  comment: string;
  expanded?: boolean;
  highlight?: string;
  onContentResize?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
  videoId: string;
};

const TimestampComment = memo(function TimestampComment({
  comment,
  expanded,
  highlight,
  onContentResize,
  onExpandedChange,
  videoId,
}: TimestampCommentProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
  const didMountRef = useRef(false);
  const isExpanded = expanded ?? uncontrolledExpanded;
  const isControlledExpanded = expanded !== undefined;

  const t = useTranslations("Archives.TimestampComment");

  const lines = useMemo(() => comment.split(/\r?\n/), [comment]);
  const shouldCollapse = lines.length > PREVIEW_LINE_COUNT;
  const visibleLines =
    shouldCollapse && !isExpanded ? lines.slice(0, PREVIEW_LINE_COUNT) : lines;

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (!onContentResize) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(onContentResize);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isExpanded, onContentResize]);

  const toggleExpanded = () => {
    const nextExpanded = !isExpanded;
    if (!isControlledExpanded) {
      setUncontrolledExpanded(nextExpanded);
    }
    onExpandedChange?.(nextExpanded);
  };

  if (!comment) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">
        {renderTimestampComment(visibleLines.join("\n"), videoId, highlight)}
      </div>
      {shouldCollapse && (
        <Button
          variant="subtle"
          size="compact-xs"
          color="gray"
          className="h-auto px-0 text-xs"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          c="dimmed"
        >
          {isExpanded ? t("close") : t("more")}
        </Button>
      )}
    </div>
  );
});

export default TimestampComment;
