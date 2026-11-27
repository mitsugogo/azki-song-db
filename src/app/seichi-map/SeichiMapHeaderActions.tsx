"use client";

import { ActionIcon, Box, Group, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { FiBarChart2, FiSettings, FiShare2 } from "react-icons/fi";
import { Link } from "@/i18n/navigation";

type Props = {
  isSharedView: boolean;
  /** レベル・称号を表示するプレイヤーカード。共有マップでは持ち主のもの。lg 未満は見出しの下に全幅で出す */
  playerCard?: ReactNode;
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

/**
 * 見出しの右側に置く操作。プレイヤーカード（lg 以上）と、無地のアイコンボタン3つ（ランキング・共有・設定）だけにして、
 * 色と文字を減らす。利用者数は出典の行に置く（呼び出し側）。
 */
export function SeichiMapHeaderActions({
  isSharedView,
  playerCard,
  onOpenSettings,
  onOpenShare,
  showNicknamePrompt = false,
}: Props) {
  const t = useTranslations("SeichiMapComplete");

  return (
    <Group gap={4} wrap="nowrap" justify="flex-end" className="shrink-0">
      {playerCard ? (
        <Box visibleFrom="lg" mr="xs">
          {playerCard}
        </Box>
      ) : null}
      <Tooltip label={t("ranking.open")} withArrow>
        <ActionIcon
          component={Link}
          href="/seichi-map/ranking"
          variant="subtle"
          color="gray"
          size="lg"
          aria-label={t("ranking.open")}
        >
          <FiBarChart2 size={20} />
        </ActionIcon>
      </Tooltip>
      {!isSharedView ? (
        <>
          <Tooltip label={t("share.open")} withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label={t("share.open")}
              onClick={onOpenShare}
            >
              <FiShare2 size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label={t("profile.registrationPrompt")}
            opened={showNicknamePrompt}
            position="bottom"
            withArrow
          >
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label={t("profile.open")}
              onClick={onOpenSettings}
            >
              <FiSettings size={20} />
            </ActionIcon>
          </Tooltip>
        </>
      ) : null}
    </Group>
  );
}
