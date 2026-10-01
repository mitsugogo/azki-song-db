import { Badge } from "@mantine/core";
import type { ReactNode } from "react";
import { getArchiveTopics } from "./archiveTopics";

export default function ArchiveTopicBadges({
  topic,
  className,
  renderTitle = (title) => title,
}: {
  topic: string;
  className?: string;
  renderTitle?: (title: string) => ReactNode;
}) {
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
      {getArchiveTopics(topic).map(({ key, title }) => (
        <Badge
          key={key}
          color="pink"
          variant="light"
          className="max-w-full whitespace-normal py-1 leading-snug"
        >
          {renderTitle(title)}
        </Badge>
      ))}
    </div>
  );
}
