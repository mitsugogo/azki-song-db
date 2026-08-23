"use client";

import { ActionIcon, Badge, Button, Group, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { FiBarChart2, FiSettings, FiShare2 } from "react-icons/fi";
import { Link } from "@/i18n/navigation";

type Props = {
  isSharedView: boolean;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  showNicknamePrompt?: boolean;
  userCount: number | null;
};

type NicknamePromptState = {
  isSignedIn: boolean;
  isSharedView: boolean;
  profileLookupCompleted: boolean;
  nickname: string | null;
  promptDismissed: boolean;
};

export const shouldShowNicknameRegistrationPrompt = ({
  isSignedIn,
  isSharedView,
  profileLookupCompleted,
  nickname,
  promptDismissed,
}: NicknamePromptState) =>
  isSignedIn &&
  !isSharedView &&
  profileLookupCompleted &&
  !nickname &&
  !promptDismissed;

export function SeichiMapHeaderActions({
  isSharedView,
  onOpenSettings,
  onOpenShare,
  showNicknamePrompt = false,
  userCount,
}: Props) {
  const t = useTranslations("SeichiMapComplete");

  return (
    <Group gap="xs" wrap="nowrap">
      {userCount !== null ? (
        <Badge variant="light" color="gray" size="sm">
          {t("usage.userCount", { count: userCount })}
        </Badge>
      ) : null}
      <Tooltip label={t("ranking.open")} withArrow>
        <Button
          component={Link}
          href="/seichi-map/ranking"
          variant="light"
          color="gray"
          size="sm"
          leftSection={<FiBarChart2 size={16} />}
        >
          {t("ranking.open")}
        </Button>
      </Tooltip>
      {!isSharedView ? (
        <>
          <Tooltip label={t("share.open")} withArrow>
            <ActionIcon
              variant="light"
              color="pink"
              size="lg"
              aria-label={t("share.open")}
              onClick={onOpenShare}
            >
              <FiShare2 size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label={t("profile.registrationPrompt")}
            opened={showNicknamePrompt}
            position="bottom"
            withArrow
          >
            <ActionIcon
              variant="light"
              color="pink"
              size="lg"
              aria-label={t("profile.open")}
              onClick={onOpenSettings}
            >
              <FiSettings size={18} />
            </ActionIcon>
          </Tooltip>
        </>
      ) : null}
    </Group>
  );
}
