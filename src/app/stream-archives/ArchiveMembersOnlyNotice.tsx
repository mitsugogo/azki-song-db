"use client";

import { Alert, Badge, Stack } from "@mantine/core";
import { FaCircleInfo, FaStar } from "react-icons/fa6";

type ArchiveMembersOnlyBadgeProps = {
  label: string;
  showIcon?: boolean;
  className?: string;
};

export function ArchiveMembersOnlyBadge({
  label,
  showIcon = true,
  className,
}: ArchiveMembersOnlyBadgeProps) {
  return (
    <Badge
      color="green"
      size="xs"
      leftSection={showIcon ? <FaStar aria-hidden="true" /> : undefined}
      radius="sm"
      variant="light"
      className={className}
    >
      {label}
    </Badge>
  );
}

type ArchiveMembersOnlyNoticeProps = {
  badgeLabel: string;
  publicInfoNote: string;
};

export default function ArchiveMembersOnlyNotice({
  badgeLabel,
  publicInfoNote,
}: ArchiveMembersOnlyNoticeProps) {
  return (
    <Stack gap="xs" align="flex-start">
      <ArchiveMembersOnlyBadge label={badgeLabel} />
      <Alert
        color="blue"
        variant="light"
        icon={<FaCircleInfo aria-hidden="true" />}
        radius="sm"
        p="sm"
        fz="xs"
        className="w-full"
      >
        {publicInfoNote}
      </Alert>
    </Stack>
  );
}
