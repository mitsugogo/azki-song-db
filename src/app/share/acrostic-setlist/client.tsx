"use client";

import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Group,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";
import {
  HiClipboardCopy,
  HiChevronRight,
  HiHome,
  HiPlay,
  HiSave,
  HiSparkles,
} from "react-icons/hi";
import { useTranslations } from "next-intl";
import CreatePlaylistModal from "@/app/components/CreatePlaylistModal";
import usePlaylists from "@/app/hook/usePlaylists";
import useSongs from "@/app/hook/useSongs";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "@/app/theme";
import {
  buildAcrosticCandidateIndex,
  buildAcrosticCopyText,
  buildAcrosticPlaylistEntries,
  MAX_ACROSTIC_CHARACTERS,
  parseAcrosticInput,
  reconcileAcrosticAssignments,
  type AcrosticAssignment,
  type AcrosticMatchSource,
} from "./acrosticSetlist";
import {
  readAcrosticSetlistDraft,
  writeAcrosticSetlistDraft,
} from "./acrosticSetlistDraft";

const MATCH_SOURCE_KEYS: Record<AcrosticMatchSource, string> = {
  "localized-title": "localizedTitle",
  "japanese-title": "japaneseTitle",
  "english-title": "englishTitle",
  alias: "alias",
};

export default function AcrosticSetlistPageClient() {
  const t = useTranslations("Share.acrosticSetlist");
  const dm = useTranslations("DrawerMenu");
  const { allSongs, isLoading } = useSongs({ includeMembersOnly: true });
  const { authenticated, ready, requestSignIn, encodePlaylistUrlParam } =
    usePlaylists();
  const [input, setInput] = useState("");
  const [generatedInput, setGeneratedInput] = useState<string | null>(null);
  const [allowReuse, setAllowReuse] = useState(false);
  const [assignments, setAssignments] = useState<AcrosticAssignment[]>([]);
  const [restoredKeys, setRestoredKeys] = useState<
    (string | null)[] | null | undefined
  >(undefined);
  const [openCreatePlaylistModal, setOpenCreatePlaylistModal] = useState(false);

  const parsedInput = useMemo(() => parseAcrosticInput(input), [input]);
  const generatedCharacters = useMemo(
    () => parseAcrosticInput(generatedInput ?? "").characters,
    [generatedInput],
  );
  const candidateIndex = useMemo(
    () => buildAcrosticCandidateIndex(allSongs),
    [allSongs],
  );

  useEffect(() => {
    const draft = readAcrosticSetlistDraft();
    if (!draft) {
      setRestoredKeys(null);
      return;
    }

    setInput(draft.input);
    setGeneratedInput(draft.generatedInput);
    setAllowReuse(draft.allowReuse);
    setRestoredKeys(draft.generatedInput ? draft.selectedCandidateKeys : null);
  }, []);

  useEffect(() => {
    if (!Array.isArray(restoredKeys) || isLoading || !generatedInput) return;

    const restoredAssignments = generatedCharacters.map(
      (character, position) => ({
        ...character,
        id: `${position}-${character.normalizedCharacter}-${character.character}`,
        selectedCandidateKey: restoredKeys[position] ?? null,
      }),
    );
    setAssignments(
      reconcileAcrosticAssignments(
        generatedCharacters,
        candidateIndex,
        restoredAssignments,
        allowReuse,
      ),
    );
    setRestoredKeys(null);
  }, [
    allowReuse,
    candidateIndex,
    generatedCharacters,
    generatedInput,
    isLoading,
    restoredKeys,
  ]);

  useEffect(() => {
    if (restoredKeys !== null) return;
    writeAcrosticSetlistDraft({
      version: 1,
      input,
      generatedInput,
      allowReuse,
      selectedCandidateKeys: assignments.map(
        (assignment) => assignment.selectedCandidateKey,
      ),
    });
  }, [allowReuse, assignments, generatedInput, input, restoredKeys]);

  const isStale = generatedInput === null || generatedInput !== input;
  const playlistEntries = useMemo(
    () =>
      isStale
        ? null
        : buildAcrosticPlaylistEntries(assignments, candidateIndex),
    [assignments, candidateIndex, isStale],
  );
  const copyText = useMemo(
    () => (isStale ? null : buildAcrosticCopyText(assignments, candidateIndex)),
    [assignments, candidateIndex, isStale],
  );
  const isComplete = playlistEntries !== null && copyText !== null;
  const playlistName = t("defaultPlaylistName", {
    phrase: generatedInput?.trim() ?? "",
  });
  const playlist = useMemo(
    () => ({ name: playlistName, songs: playlistEntries ?? [] }),
    [playlistEntries, playlistName],
  );
  const encodedPlaylist = isComplete ? encodePlaylistUrlParam(playlist) : null;

  const handleGenerate = () => {
    if (
      parsedInput.characters.length === 0 ||
      parsedInput.isOverLimit ||
      isLoading
    ) {
      return;
    }

    setGeneratedInput(input);
    setAssignments((current) =>
      reconcileAcrosticAssignments(
        parsedInput.characters,
        candidateIndex,
        current,
        allowReuse,
      ),
    );
  };

  const handleReuseChange = (checked: boolean) => {
    setAllowReuse(checked);
    setAssignments((current) =>
      reconcileAcrosticAssignments(
        generatedCharacters,
        candidateIndex,
        current,
        checked,
      ),
    );
  };

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      notifications.show({ message: t("notice.copied"), color: "green" });
    } catch {
      notifications.show({ message: t("notice.copyFailed"), color: "red" });
    }
  };

  const handleSave = () => {
    if (!isComplete || !ready) return;
    if (!authenticated) {
      requestSignIn({ type: "create-playlist" });
      return;
    }
    setOpenCreatePlaylistModal(true);
  };

  return (
    <main className={pageClasses.shell} data-testid="acrostic-setlist-page">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="mr-1.5 h-4 w-4" /> {dm("home")}
        </Link>
        <Link href="/share" className={breadcrumbClasses.link}>
          {t("breadcrumbShare")}
        </Link>
        <span className={breadcrumbClasses.link}>{t("pageTitle")}</span>
      </Breadcrumbs>

      <div>
        <h1 className={pageClasses.heading}>{t("pageTitle")}</h1>
        <p className={pageClasses.description}>{t("lead")}</p>
      </div>

      <Stack gap="lg" maw={960} mx="auto">
        <Paper withBorder radius="md" p={{ base: "md", sm: "lg" }}>
          <Stack gap="md">
            <Textarea
              label={t("input.label")}
              description={t("input.description", {
                max: MAX_ACROSTIC_CHARACTERS,
              })}
              placeholder={t("input.placeholder")}
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              autosize
              minRows={2}
              maxRows={5}
            />
            <Group justify="space-between" align="flex-end" wrap="wrap">
              <Text
                size="sm"
                c={parsedInput.isOverLimit ? "red" : "dimmed"}
                aria-live="polite"
              >
                {t("input.count", {
                  count: parsedInput.eligibleCount,
                  max: MAX_ACROSTIC_CHARACTERS,
                })}
              </Text>
              <Button
                leftSection={<HiSparkles />}
                onClick={handleGenerate}
                disabled={
                  parsedInput.characters.length === 0 || parsedInput.isOverLimit
                }
                loading={isLoading}
              >
                {t("button.generate")}
              </Button>
            </Group>
          </Stack>
        </Paper>

        {isLoading ? (
          <Stack gap="sm" aria-label={t("status.loadingSongs")}>
            <Skeleton height={74} radius="md" />
            <Skeleton height={74} radius="md" />
            <Skeleton height={74} radius="md" />
          </Stack>
        ) : assignments.length > 0 ? (
          <Paper withBorder radius="md" p={{ base: "md", sm: "lg" }}>
            <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap">
                <div>
                  <Text fw={700}>{t("result.title")}</Text>
                  <Text size="sm" c="dimmed">
                    {t("result.description")}
                  </Text>
                </div>
                <Switch
                  checked={allowReuse}
                  onChange={(event) =>
                    handleReuseChange(event.currentTarget.checked)
                  }
                  label={t("reuse.label")}
                />
              </Group>

              {isStale ? (
                <Alert color="yellow" title={t("status.staleTitle")}>
                  {t("status.staleDescription")}
                </Alert>
              ) : null}

              <Stack gap="sm">
                {assignments.map((assignment, position) => {
                  const candidates =
                    candidateIndex.byInitial.get(
                      assignment.normalizedCharacter,
                    ) ?? [];
                  const selectedByOtherRows = new Set(
                    assignments
                      .filter((_item, index) => index !== position)
                      .map((item) => item.selectedCandidateKey)
                      .filter((key): key is string => key !== null),
                  );
                  const availableCandidates = candidates.filter(
                    (candidate) =>
                      allowReuse ||
                      candidate.key === assignment.selectedCandidateKey ||
                      !selectedByOtherRows.has(candidate.key),
                  );
                  const selectedCandidate = assignment.selectedCandidateKey
                    ? candidateIndex.byKey.get(assignment.selectedCandidateKey)
                    : null;
                  const match = selectedCandidate?.matches.get(
                    assignment.normalizedCharacter,
                  );
                  const showMatch =
                    match &&
                    (match.source === "alias" ||
                      match.value.normalize("NFKC") !==
                        selectedCandidate?.song.title.normalize("NFKC"));
                  const noCandidateReason =
                    candidates.length === 0
                      ? t("status.noCandidate")
                      : availableCandidates.length === 0
                        ? t("status.noUnusedCandidate")
                        : t("status.selectRequired");

                  return (
                    <div
                      key={assignment.id}
                      className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      data-testid={`acrostic-row-${position}`}
                    >
                      <Badge
                        circle={Array.from(assignment.character).length === 1}
                        size="xl"
                        variant="filled"
                        aria-label={t("result.initialLabel", {
                          character: assignment.character,
                        })}
                      >
                        {assignment.character}
                      </Badge>
                      <div className="min-w-0">
                        <Select
                          aria-label={t("result.selectLabel", {
                            character: assignment.character,
                          })}
                          placeholder={t("result.selectPlaceholder")}
                          searchable
                          clearable
                          nothingFoundMessage={t("result.nothingFound")}
                          comboboxProps={{ withinPortal: false }}
                          data={availableCandidates.map((candidate) => ({
                            value: candidate.key,
                            label: `${candidate.song.title} - ${candidate.song.artist}`,
                          }))}
                          value={assignment.selectedCandidateKey}
                          onChange={(value) =>
                            setAssignments((current) =>
                              current.map((item, index) =>
                                index === position
                                  ? { ...item, selectedCandidateKey: value }
                                  : item,
                              ),
                            )
                          }
                          error={
                            assignment.selectedCandidateKey
                              ? undefined
                              : noCandidateReason
                          }
                        />
                        {showMatch && match ? (
                          <Text size="xs" c="dimmed" mt={4}>
                            {t("result.matchedBy", {
                              source: t(
                                `matchSource.${MATCH_SOURCE_KEYS[match.source]}`,
                              ),
                              value: match.value,
                            })}
                          </Text>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        ) : (
          <Alert color="gray" title={t("status.emptyTitle")}>
            {t("status.emptyDescription")}
          </Alert>
        )}

        <Paper withBorder radius="md" p={{ base: "md", sm: "lg" }}>
          <Stack gap="sm">
            <Text fw={700}>{t("actions.title")}</Text>
            {!isComplete ? (
              <Text size="sm" c="dimmed">
                {t("actions.incomplete")}
              </Text>
            ) : null}
            <Group grow align="stretch">
              {encodedPlaylist ? (
                <Button
                  component={Link}
                  href={{
                    pathname: "/",
                    query: { playlist: encodedPlaylist },
                  }}
                  leftSection={<HiPlay />}
                >
                  {t("button.play")}
                </Button>
              ) : (
                <Button disabled leftSection={<HiPlay />}>
                  {t("button.play")}
                </Button>
              )}
              <Button
                variant="light"
                leftSection={<HiClipboardCopy />}
                disabled={!isComplete}
                onClick={() => void handleCopy()}
              >
                {t("button.copy")}
              </Button>
              <Button
                variant="light"
                leftSection={<HiSave />}
                disabled={!isComplete || !ready}
                loading={!ready}
                onClick={handleSave}
              >
                {t("button.save")}
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>

      <CreatePlaylistModal
        onenModal={openCreatePlaylistModal}
        setOpenModal={setOpenCreatePlaylistModal}
        initialName={playlistName}
        initialSongs={playlistEntries ?? []}
      />
    </main>
  );
}
