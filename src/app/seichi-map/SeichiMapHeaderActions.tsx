"use client";

import { ActionIcon, Button, Group, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { FiBarChart2, FiSettings, FiShare2 } from "react-icons/fi";
import { Link } from "@/i18n/navigation";

type Props = {
  isSharedView: boolean;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  showNicknamePrompt?: boolean;
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
}: Props) {
  const t = useTranslations("SeichiMapComplete");

  return (
    <Group gap="xs" wrap="nowrap">
      {!isSharedView ? (
        <>
          <Tooltip
            label={t("profile.registrationPrompt")}
            opened={showNicknamePrompt}
            position="bottom"
            withArrow
          >
            <Button
              variant="light"
              color="pink"
              leftSection={<FiSettings size={16} />}
              onClick={onOpenSettings}
            >
              {t("profile.open")}
            </Button>
          </Tooltip>
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
        </>
      ) : null}
      <Tooltip label={t("ranking.open")} withArrow>
        <ActionIcon
          component={Link}
          href="/seichi-map/ranking"
          variant="light"
          color="gray"
          size="lg"
          aria-label={t("ranking.open")}
        >
          <FiBarChart2 size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
