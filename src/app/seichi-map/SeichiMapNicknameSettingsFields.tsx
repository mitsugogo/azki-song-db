"use client";

import { Stack, Switch, Text, TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";

type Props = {
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  showNicknameInRanking: boolean;
  onShowNicknameInRankingChange: (visible: boolean) => void;
  showShareNotice?: boolean;
};

export const resolveSeichiMapNicknameDraft = (
  profileNickname?: string | null,
  shareNickname?: string | null,
) => profileNickname || shareNickname || "";

export function SeichiMapNicknameSettingsFields({
  nickname,
  onNicknameChange,
  showNicknameInRanking,
  onShowNicknameInRankingChange,
  showShareNotice = false,
}: Props) {
  const t = useTranslations("SeichiMapComplete.profile");

  return (
    <Stack gap="sm">
      <TextInput
        label={t("nicknameLabel")}
        value={nickname}
        onChange={(event) => onNicknameChange(event.target.value)}
        maxLength={40}
        required
      />
      <Switch
        label={t("rankingVisibilityLabel")}
        description={t("rankingVisibilityDescription")}
        checked={showNicknameInRanking}
        onChange={(event) =>
          onShowNicknameInRankingChange(event.currentTarget.checked)
        }
      />
      {showShareNotice ? (
        <Text size="xs" c="dimmed">
          {t("shareVisibilityNotice")}
        </Text>
      ) : null}
    </Stack>
  );
}
