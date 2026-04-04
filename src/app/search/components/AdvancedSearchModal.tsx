import {
  Modal,
  Button,
  Stack,
  TextInput,
  Group,
  Text,
  useMantineTheme,
  Code,
  Textarea,
} from "@mantine/core";
import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (query: string) => void;
}

/**
 * 高度な検索モーダル
 * 複数の検索フィールドを組み合わせてクエリを生成する
 */
export default function AdvancedSearchModal({
  isOpen,
  onClose,
  onApply,
}: AdvancedSearchModalProps) {
  const t = useTranslations("AdvancedSearch");
  const theme = useMantineTheme();

  // フォームフィールド
  const [allKeywords, setAllKeywords] = useState("");
  const [exactPhrase, setExactPhrase] = useState("");
  const [anyKeywords, setAnyKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");

  // キーワード解析ヘルパー
  const parseKeywords = (input: string): string[] => {
    if (!input.trim()) return [];
    return input
      .split(/[\s,]+/)
      .map((k) => k.trim())
      .filter(Boolean);
  };

  // クエリ生成ロジック
  const generatedQuery = useMemo(() => {
    const parts: string[] = [];

    // 完全一致フレーズ（最優先）
    if (exactPhrase.trim()) {
      const phrase = exactPhrase.trim();
      parts.push(`"${phrase}"`);
    }

    // AND検索（すべてのキーワード）
    const allKeys = parseKeywords(allKeywords);
    if (allKeys.length > 0) {
      parts.push(allKeys.join("|"));
    }

    // OR検索（いずれか含む） - スペース区切りで表現
    const anyKeys = parseKeywords(anyKeywords);
    if (anyKeys.length > 0) {
      if (anyKeys.length === 1) {
        parts.push(anyKeys[0]);
      } else {
        parts.push(anyKeys.join(" OR "));
      }
    }

    // 除外検索
    const excludeKeys = parseKeywords(excludeKeywords);
    if (excludeKeys.length > 0) {
      excludeKeys.forEach((key) => {
        parts.push(`-${key}`);
      });
    }

    return parts.filter(Boolean).join("|");
  }, [allKeywords, exactPhrase, anyKeywords, excludeKeywords]);

  const handleApply = () => {
    if (generatedQuery.trim()) {
      onApply(generatedQuery);
      onClose();
    }
  };

  const handleClose = () => {
    setAllKeywords("");
    setExactPhrase("");
    setAnyKeywords("");
    setExcludeKeywords("");
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={t("title")}
      size="md"
      centered
    >
      <Stack gap="lg">
        {/* すべてのキーワード（AND検索） */}
        <div>
          <Text fw={600} size="sm" mb="xs">
            {t("allKeywords")}
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            {t("allKeywordsDesc")}
          </Text>
          <Textarea
            placeholder={t("allKeywordsPlaceholder")}
            value={allKeywords}
            onChange={(e) => setAllKeywords(e.currentTarget.value)}
            rows={2}
            maxLength={300}
          />
        </div>

        {/* 完全一致フレーズ */}
        <div>
          <Text fw={600} size="sm" mb="xs">
            {t("exactPhrase")}
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            {t("exactPhraseDesc")}
          </Text>
          <TextInput
            placeholder={t("exactPhrasePlaceholder")}
            value={exactPhrase}
            onChange={(e) => setExactPhrase(e.currentTarget.value)}
            maxLength={200}
          />
        </div>

        {/* いずれかのキーワード（OR検索） */}
        <div>
          <Text fw={600} size="sm" mb="xs">
            {t("anyKeywords")}
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            {t("anyKeywordsDesc")}
          </Text>
          <Textarea
            placeholder={t("anyKeywordsPlaceholder")}
            value={anyKeywords}
            onChange={(e) => setAnyKeywords(e.currentTarget.value)}
            rows={2}
            maxLength={300}
          />
        </div>

        {/* 除外キーワード */}
        <div>
          <Text fw={600} size="sm" mb="xs">
            {t("excludeKeywords")}
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            {t("excludeKeywordsDesc")}
          </Text>
          <Textarea
            placeholder={t("excludeKeywordsPlaceholder")}
            value={excludeKeywords}
            onChange={(e) => setExcludeKeywords(e.currentTarget.value)}
            rows={2}
            maxLength={300}
          />
        </div>

        {/* プレビュー */}
        <div
          style={{
            background: theme.colors.gray[0],
            padding: theme.spacing.md,
            borderRadius: theme.radius.sm,
          }}
        >
          <Text fw={600} size="sm" mb="xs">
            {t("preview")}
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            {t("query")}
          </Text>
          {generatedQuery.trim() && (
            <Code block className="text-xs overflow-x-auto">
              {generatedQuery}
            </Code>
          )}
          {!generatedQuery.trim() && (
            <Text size="xs" c="dimmed">
              クエリが生成されていません。上記のフィールドに入力してください。
            </Text>
          )}
        </div>

        {/* アクションボタン */}
        <Group justify="flex-end">
          <Button variant="outline" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleApply}
            disabled={!generatedQuery.trim()}
            color="blue"
          >
            {t("apply")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
