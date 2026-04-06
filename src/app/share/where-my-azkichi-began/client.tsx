"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Breadcrumbs,
  Button,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { MdContentCopy, MdDownload } from "react-icons/md";
import { FaBars } from "react-icons/fa6";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses } from "@/app/theme";
import useSongs from "@/app/hook/useSongs";
import { isOriginalSong } from "@/app/config/filters";
import {
  MAX_TIMELINE_ROWS,
  TimelineRowInput,
  buildXPostText,
  generateWhereMyAzkichiBeganImage,
  sanitizeTimelineRows,
} from "./imageGenerator";

type ValidationErrors = {
  name?: string;
  rows?: string;
};

type WhereMyAzkichiBeganDraft = {
  name: string;
  handleName: string;
  rows: TimelineRowInput[];
  iconDataUrl: string | null;
  favoriteOriginalSong: string;
};

const createEmptyRow = (): TimelineRowInput => ({
  year: "",
  month: "",
  content: "",
});

const createDefaultRows = (): TimelineRowInput[] => [
  createEmptyRow(),
  createEmptyRow(),
  createEmptyRow(),
];

const normalizeDraftRows = (
  rows: TimelineRowInput[] | undefined,
): TimelineRowInput[] => {
  if (!rows || !Array.isArray(rows)) {
    return createDefaultRows();
  }

  const normalized = rows
    .map((row) => ({
      year: typeof row?.year === "string" ? row.year : "",
      month: typeof row?.month === "string" ? row.month : "",
      content: typeof row?.content === "string" ? row.content : "",
    }))
    .slice(0, MAX_TIMELINE_ROWS);

  return normalized.length > 0 ? normalized : createDefaultRows();
};

const TimelineRowBase = ({
  row,
  rowCount,
  onYearChange,
  onMonthChange,
  onContentChange,
  onRemove,
  t,
  dragHandleProps,
  rowRef,
  rowStyle,
}: {
  row: TimelineRowInput;
  rowCount: number;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onRemove: () => void;
  t: (key: string) => string;
  dragHandleProps?: Record<string, unknown>;
  rowRef?: (node: HTMLDivElement | null) => void;
  rowStyle?: React.CSSProperties;
}) => {
  return (
    <div
      ref={rowRef}
      style={rowStyle}
      className="grid grid-cols-[36px_90px_90px_1fr_auto] gap-2 items-start"
    >
      <button
        type="button"
        aria-label={t("whereMyAzkichiBegan.button.dragRow")}
        title={t("whereMyAzkichiBegan.button.dragRow")}
        className="h-9 w-9 text-gray-500 hover:text-pink-500 hover:border-pink-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-pink-700"
        {...dragHandleProps}
      >
        <FaBars className="mx-auto" />
      </button>

      <TextInput
        placeholder={t("whereMyAzkichiBegan.form.yearPlaceholder")}
        value={row.year}
        onChange={(event) => onYearChange(event.currentTarget.value)}
        maxLength={4}
      />

      <TextInput
        placeholder={t("whereMyAzkichiBegan.form.monthPlaceholder")}
        value={row.month}
        onChange={(event) => onMonthChange(event.currentTarget.value)}
        maxLength={2}
      />

      <Textarea
        autosize
        minRows={1}
        maxRows={2}
        placeholder={t("whereMyAzkichiBegan.form.contentPlaceholder")}
        value={row.content}
        onChange={(event) => onContentChange(event.currentTarget.value)}
        maxLength={60}
      />

      <Button
        variant="light"
        color="gray"
        onClick={onRemove}
        disabled={rowCount <= 1}
      >
        {t("whereMyAzkichiBegan.button.removeRow")}
      </Button>
    </div>
  );
};

const SortableTimelineRow = ({
  rowId,
  row,
  rowCount,
  onYearChange,
  onMonthChange,
  onContentChange,
  onRemove,
  t,
}: {
  rowId: string;
  row: TimelineRowInput;
  rowCount: number;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onRemove: () => void;
  t: (key: string) => string;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: rowId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TimelineRowBase
      row={row}
      rowCount={rowCount}
      onYearChange={onYearChange}
      onMonthChange={onMonthChange}
      onContentChange={onContentChange}
      onRemove={onRemove}
      t={t}
      rowRef={setNodeRef}
      rowStyle={style}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
};

const StaticTimelineRow = ({
  row,
  rowCount,
  onYearChange,
  onMonthChange,
  onContentChange,
  onRemove,
  t,
}: {
  row: TimelineRowInput;
  rowCount: number;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onRemove: () => void;
  t: (key: string) => string;
}) => {
  return (
    <TimelineRowBase
      row={row}
      rowCount={rowCount}
      onYearChange={onYearChange}
      onMonthChange={onMonthChange}
      onContentChange={onContentChange}
      onRemove={onRemove}
      t={t}
    />
  );
};

export default function WhereMyAzkichiBeganClient() {
  const t = useTranslations("Share");
  const dm = useTranslations("DrawerMenu");
  const locale = useLocale();

  const [draft, setDraft] = useLocalStorage<WhereMyAzkichiBeganDraft>({
    key: "where-my-azkichi-began-draft",
    defaultValue: {
      name: "",
      handleName: "",
      rows: createDefaultRows(),
      iconDataUrl: null,
      favoriteOriginalSong: "",
    },
  });

  const { allSongs, isLoading: isSongsLoading } = useSongs();
  const name = draft.name || "";
  const handleName = draft.handleName || "";
  const favoriteOriginalSong = draft.favoriteOriginalSong || "";
  const rows = useMemo(() => normalizeDraftRows(draft.rows), [draft.rows]);
  const iconDataUrl = draft.iconDataUrl || null;
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [validation, setValidation] = useState<ValidationErrors>({});
  const [copyFallbackText, setCopyFallbackText] = useState("");
  const [isDndMounted, setIsDndMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowKeys = useMemo(
    () => rows.map((_, index) => `timeline-row-${index}`),
    [rows],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const validRows = useMemo(() => sanitizeTimelineRows(rows), [rows]);
  const originalSongsSortedByRelease = useMemo(() => {
    const toReleaseMs = (raw: string | undefined) => {
      const time = raw ? Date.parse(raw) : NaN;
      return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
    };

    return [...allSongs]
      .filter((song) => isOriginalSong(song))
      .sort((a, b) => {
        const aReleaseMs = toReleaseMs(a.album_release_at || a.broadcast_at);
        const bReleaseMs = toReleaseMs(b.album_release_at || b.broadcast_at);
        if (aReleaseMs !== bReleaseMs) {
          return aReleaseMs - bReleaseMs;
        }

        const aSourceOrder = a.source_order ?? Number.MAX_SAFE_INTEGER;
        const bSourceOrder = b.source_order ?? Number.MAX_SAFE_INTEGER;
        if (aSourceOrder !== bSourceOrder) {
          return aSourceOrder - bSourceOrder;
        }

        return a.title.localeCompare(b.title, locale === "ja" ? "ja" : "en");
      });
  }, [allSongs, locale]);

  const favoriteOriginalSongThumbnailByTitle = useMemo(() => {
    const map = new Map<string, string>();
    originalSongsSortedByRelease.forEach((song) => {
      const title = song.title.trim();
      if (!title || map.has(title) || !song.video_id) {
        return;
      }
      map.set(
        title,
        `https://img.youtube.com/vi/${song.video_id}/mqdefault.jpg`,
      );
    });
    return map;
  }, [originalSongsSortedByRelease]);

  const favoriteOriginalSongOptions = useMemo(() => {
    const uniqueTitles = new Set<string>();
    const options = originalSongsSortedByRelease
      .map((song) => song.title.trim())
      .filter((title) => {
        if (!title || uniqueTitles.has(title)) {
          return false;
        }
        uniqueTitles.add(title);
        return true;
      })
      .map((title) => ({ value: title, label: title }));

    if (
      favoriteOriginalSong &&
      !options.some((option) => option.value === favoriteOriginalSong)
    ) {
      return [
        { value: favoriteOriginalSong, label: favoriteOriginalSong },
        ...options,
      ];
    }

    return options;
  }, [favoriteOriginalSong, originalSongsSortedByRelease]);

  const updateDraft = (partial: Partial<WhereMyAzkichiBeganDraft>) => {
    setDraft((prev) => ({
      name: partial.name ?? prev.name,
      handleName: partial.handleName ?? prev.handleName,
      rows: partial.rows ? normalizeDraftRows(partial.rows) : prev.rows,
      iconDataUrl:
        partial.iconDataUrl !== undefined
          ? partial.iconDataUrl
          : prev.iconDataUrl,
      favoriteOriginalSong:
        partial.favoriteOriginalSong !== undefined
          ? partial.favoriteOriginalSong
          : prev.favoriteOriginalSong,
    }));
  };

  useEffect(() => {
    setIsDndMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  const handleRowChange = (
    index: number,
    field: keyof TimelineRowInput,
    value: string,
  ) => {
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    );
    updateDraft({ rows: nextRows });
  };

  const handleAddRow = () => {
    if (rows.length >= MAX_TIMELINE_ROWS) {
      return;
    }
    const nextRows = [...rows, createEmptyRow()];
    updateDraft({ rows: nextRows });
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      return;
    }
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    updateDraft({ rows: nextRows });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) {
      return;
    }

    const oldIndex = rowKeys.indexOf(String(active.id));
    const newIndex = rowKeys.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return;
    }

    const nextRows = arrayMove(rows, oldIndex, newIndex);
    updateDraft({ rows: nextRows });
  };

  const handleIconFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("whereMyAzkichiBegan.alerts.iconImageOnly"));
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("icon read error"));
        }
      };
      reader.onerror = () => reject(new Error("icon read error"));
      reader.readAsDataURL(file);
    }).catch(() => null);

    if (!dataUrl) {
      alert(t("whereMyAzkichiBegan.alerts.iconReadFailed"));
      return;
    }

    updateDraft({ iconDataUrl: dataUrl });
  };

  const handleGenerateImage = async () => {
    const nextValidation: ValidationErrors = {};

    if (!name.trim()) {
      nextValidation.name = t("whereMyAzkichiBegan.alerts.nameRequired");
    }

    if (validRows.length === 0) {
      nextValidation.rows = t("whereMyAzkichiBegan.alerts.atLeastOneRow");
    }

    setValidation(nextValidation);

    if (Object.keys(nextValidation).length > 0) {
      return;
    }

    try {
      setIsGenerating(true);
      setCopySuccess(false);
      setCopyFallbackText("");

      const blob = await generateWhereMyAzkichiBeganImage({
        name,
        handle: handleName,
        rows,
        iconDataUrl,
        favoriteOriginalSong,
        favoriteOriginalSongThumbnailUrl:
          favoriteOriginalSongThumbnailByTitle.get(favoriteOriginalSong) || "",
        locale: locale === "ja" ? "ja" : "en",
      });

      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }

      const url = URL.createObjectURL(blob);
      setGeneratedImageUrl(url);
      setDownloadReady(true);
    } catch (error) {
      setDownloadReady(false);
      const message =
        error instanceof Error
          ? error.message
          : t("whereMyAzkichiBegan.alerts.generateFailed");
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;

    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = `where-my-azkichi-began-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyXText = async () => {
    const text = buildXPostText(
      name,
      validRows.length,
      locale === "ja" ? "ja" : "en",
      handleName,
    );

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setCopyFallbackText("");
      window.setTimeout(() => setCopySuccess(false), 1800);
    } catch {
      setCopySuccess(false);
      setCopyFallbackText(text);
    }
  };

  return (
    <div className="grow lg:p-6 lg:pb-0 overflow-auto">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {dm("home")}
        </Link>
        <Link href="/share" className={breadcrumbClasses.link}>
          {t("index.title")}
        </Link>
        <span className={breadcrumbClasses.link}>
          {t("whereMyAzkichiBegan.pageTitle")}
        </span>
      </Breadcrumbs>

      <div className="p-3">
        <h1 className="font-extrabold text-2xl mb-1">
          {t("whereMyAzkichiBegan.pageTitle")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("whereMyAzkichiBegan.lead")}
        </p>
      </div>

      <div className="px-3 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <TextInput
              label={t("whereMyAzkichiBegan.form.nameLabel")}
              placeholder={t("whereMyAzkichiBegan.form.namePlaceholder")}
              value={name}
              onChange={(event) => {
                const nextName = event.currentTarget.value;
                updateDraft({ name: nextName });
              }}
              maxLength={32}
              error={validation.name}
              required
            />

            <TextInput
              label={t("whereMyAzkichiBegan.form.handleLabel")}
              placeholder={t("whereMyAzkichiBegan.form.handlePlaceholder")}
              value={handleName}
              onChange={(event) => {
                const nextHandleName = event.currentTarget.value;
                updateDraft({ handleName: nextHandleName });
              }}
              maxLength={32}
            />

            <div>
              <Text size="sm" fw={500} mb={8}>
                {t("whereMyAzkichiBegan.form.iconLabel")}
              </Text>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-pink-300 bg-pink-50 text-xs text-pink-700 dark:border-pink-700 dark:bg-gray-800 dark:text-pink-300"
                >
                  {iconDataUrl ? (
                    <img
                      src={iconDataUrl}
                      alt={t("whereMyAzkichiBegan.form.iconPreviewAlt")}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    t("whereMyAzkichiBegan.form.iconPlaceholder")
                  )}
                </button>
                <div>
                  <Button
                    variant="light"
                    color="pink"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("whereMyAzkichiBegan.button.uploadIcon")}
                  </Button>
                  <Text size="xs" c="dimmed" mt={6}>
                    {t("whereMyAzkichiBegan.form.iconHint")}
                  </Text>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIconFileChange}
              />
            </div>

            <div>
              <div className="flex items-center mb-2">
                <Text size="sm" fw={500}>
                  {t("whereMyAzkichiBegan.form.timelineLabel", {
                    count: validRows.length,
                    max: MAX_TIMELINE_ROWS,
                  })}
                </Text>
              </div>

              {isDndMounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={rowKeys}
                    strategy={verticalListSortingStrategy}
                  >
                    <Stack gap="xs">
                      {rows.map((row, index) => (
                        <SortableTimelineRow
                          key={rowKeys[index]}
                          rowId={rowKeys[index]}
                          row={row}
                          rowCount={rows.length}
                          onYearChange={(value) =>
                            handleRowChange(index, "year", value)
                          }
                          onMonthChange={(value) =>
                            handleRowChange(index, "month", value)
                          }
                          onContentChange={(value) =>
                            handleRowChange(index, "content", value)
                          }
                          onRemove={() => handleRemoveRow(index)}
                          t={t}
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
              ) : (
                <Stack gap="xs">
                  {rows.map((row, index) => (
                    <StaticTimelineRow
                      key={rowKeys[index]}
                      row={row}
                      rowCount={rows.length}
                      onYearChange={(value) => handleRowChange(index, "year", value)}
                      onMonthChange={(value) =>
                        handleRowChange(index, "month", value)
                      }
                      onContentChange={(value) =>
                        handleRowChange(index, "content", value)
                      }
                      onRemove={() => handleRemoveRow(index)}
                      t={t}
                    />
                  ))}
                </Stack>
              )}
              {validation.rows ? (
                <Text size="xs" c="red" mt={4}>
                  {validation.rows}
                </Text>
              ) : null}
            </div>

            <Button
              variant="subtle"
              color="pink"
              size="compact-sm"
              onClick={handleAddRow}
              disabled={rows.length >= MAX_TIMELINE_ROWS}
            >
              {t("whereMyAzkichiBegan.button.addRow")}
            </Button>

            <Select
              label={t("whereMyAzkichiBegan.form.favoriteOriginalSongLabel")}
              placeholder={t(
                "whereMyAzkichiBegan.form.favoriteOriginalSongPlaceholder",
              )}
              description={t(
                "whereMyAzkichiBegan.form.favoriteOriginalSongHint",
              )}
              data={favoriteOriginalSongOptions}
              value={favoriteOriginalSong || null}
              onChange={(value) => {
                updateDraft({ favoriteOriginalSong: value ?? "" });
              }}
              searchable
              clearable
              nothingFoundMessage={t(
                "whereMyAzkichiBegan.form.favoriteOriginalSongNothingFound",
              )}
              comboboxProps={{ withinPortal: false }}
              disabled={
                isSongsLoading && favoriteOriginalSongOptions.length === 0
              }
            />

            <Button
              color="pink"
              size="md"
              onClick={handleGenerateImage}
              loading={isGenerating}
            >
              {t("whereMyAzkichiBegan.button.generateImage")}
            </Button>
          </Stack>
        </Paper>

        <Paper p="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Text fw={700}>{t("whereMyAzkichiBegan.previewTitle")}</Text>
            <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-2">
              {generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt={t("whereMyAzkichiBegan.previewAlt")}
                  className="w-full rounded"
                />
              ) : (
                <div className="aspect-4/5 rounded bg-linear-to-b from-pink-100 via-sky-100 to-indigo-100 dark:from-pink-950/40 dark:via-slate-900 dark:to-indigo-950/50 flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                  {t("whereMyAzkichiBegan.previewPlaceholder")}
                </div>
              )}
            </div>

            <Text size="sm" c="dimmed">
              {t("whereMyAzkichiBegan.shareNotice")}
            </Text>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                leftSection={<MdDownload />}
                onClick={handleDownload}
                disabled={!downloadReady}
                color="blue"
              >
                {t("whereMyAzkichiBegan.button.download")}
              </Button>
              <Button
                leftSection={<MdContentCopy />}
                onClick={handleCopyXText}
                variant="light"
                color={copySuccess ? "teal" : "pink"}
              >
                {copySuccess
                  ? t("copied")
                  : t("whereMyAzkichiBegan.button.copyXText")}
              </Button>
            </div>

            {copyFallbackText ? (
              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  {t("whereMyAzkichiBegan.copyFallbackLabel")}
                </Text>
                <textarea
                  readOnly
                  value={copyFallbackText}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  rows={3}
                />
              </div>
            ) : null}
          </Stack>
        </Paper>
      </div>
    </div>
  );
}
