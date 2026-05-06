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
import robocosanSongs from "./robocosanSongs.json";
import {
  MAX_TIMELINE_ROWS,
  TimelineRowInput,
  buildXPostText,
  generateWhereMyRobocosanBeganImage,
  sanitizeTimelineRows,
} from "./imageGenerator";

type ValidationErrors = {
  name?: string;
  rows?: string;
};

type WhereMyRobocosanBeganDraft = {
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
        aria-label={t("whereMyRobocosanBegan.button.dragRow")}
        title={t("whereMyRobocosanBegan.button.dragRow")}
        className="h-9 w-9 text-gray-500 hover:text-purple-500 hover:border-purple-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-purple-700"
        {...dragHandleProps}
      >
        <FaBars className="mx-auto" />
      </button>

      <TextInput
        placeholder={t("whereMyRobocosanBegan.form.yearPlaceholder")}
        value={row.year}
        onChange={(event) => onYearChange(event.currentTarget.value)}
        maxLength={4}
      />

      <TextInput
        placeholder={t("whereMyRobocosanBegan.form.monthPlaceholder")}
        value={row.month}
        onChange={(event) => onMonthChange(event.currentTarget.value)}
        maxLength={2}
      />

      <Textarea
        autosize
        minRows={1}
        maxRows={2}
        placeholder={t("whereMyRobocosanBegan.form.contentPlaceholder")}
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
        {t("whereMyRobocosanBegan.button.removeRow")}
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

export default function WhereMyRobocosanBeganClient() {
  const t = useTranslations("Share");
  const dm = useTranslations("DrawerMenu");
  const locale = useLocale();

  const [draft, setDraft] = useLocalStorage<WhereMyRobocosanBeganDraft>({
    key: "where-my-robocosan-began-draft",
    defaultValue: {
      name: "",
      handleName: "",
      rows: createDefaultRows(),
      iconDataUrl: null,
      favoriteOriginalSong: "",
    },
  });

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

  const favoriteOriginalSongThumbnailByTitle = useMemo(() => {
    const map = new Map<string, string>();
    robocosanSongs.forEach((song) => {
      map.set(
        song.title,
        `https://img.youtube.com/vi/${song.video_id}/mqdefault.jpg`,
      );
    });
    return map;
  }, []);

  const favoriteOriginalSongOptions = useMemo(() => {
    const options = robocosanSongs.map((song) => ({
      value: song.title,
      label: song.title,
    }));

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
  }, [favoriteOriginalSong]);

  const updateDraft = (partial: Partial<WhereMyRobocosanBeganDraft>) => {
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
      alert(t("whereMyRobocosanBegan.alerts.iconImageOnly"));
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
      alert(t("whereMyRobocosanBegan.alerts.iconReadFailed"));
      return;
    }

    updateDraft({ iconDataUrl: dataUrl });
  };

  const handleGenerateImage = async () => {
    const nextValidation: ValidationErrors = {};

    if (!name.trim()) {
      nextValidation.name = t("whereMyRobocosanBegan.alerts.nameRequired");
    }

    if (validRows.length === 0) {
      nextValidation.rows = t("whereMyRobocosanBegan.alerts.atLeastOneRow");
    }

    setValidation(nextValidation);

    if (Object.keys(nextValidation).length > 0) {
      return;
    }

    try {
      setIsGenerating(true);
      setCopySuccess(false);
      setCopyFallbackText("");

      const blob = await generateWhereMyRobocosanBeganImage({
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
          : t("whereMyRobocosanBegan.alerts.generateFailed");
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;

    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = `where-my-robocosan-began-${Date.now()}.png`;
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
          {t("whereMyRobocosanBegan.pageTitle")}
        </span>
      </Breadcrumbs>

      <div className="p-3">
        <h1 className="font-extrabold text-2xl mb-1">
          {t("whereMyRobocosanBegan.pageTitle")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("whereMyRobocosanBegan.lead")}
        </p>
      </div>

      <div className="px-3 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <TextInput
              label={t("whereMyRobocosanBegan.form.nameLabel")}
              placeholder={t("whereMyRobocosanBegan.form.namePlaceholder")}
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
              label={t("whereMyRobocosanBegan.form.handleLabel")}
              placeholder={t("whereMyRobocosanBegan.form.handlePlaceholder")}
              value={handleName}
              onChange={(event) => {
                const nextHandleName = event.currentTarget.value;
                updateDraft({ handleName: nextHandleName });
              }}
              maxLength={32}
            />

            <div>
              <Text size="sm" fw={500} mb={8}>
                {t("whereMyRobocosanBegan.form.iconLabel")}
              </Text>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-purple-300 bg-purple-50 text-xs text-purple-700 dark:border-purple-700 dark:bg-gray-800 dark:text-purple-300"
                >
                  {iconDataUrl ? (
                    <img
                      src={iconDataUrl}
                      alt={t("whereMyRobocosanBegan.form.iconPreviewAlt")}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    t("whereMyRobocosanBegan.form.iconPlaceholder")
                  )}
                </button>
                <div>
                  <Button
                    variant="light"
                    color="violet"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("whereMyRobocosanBegan.button.uploadIcon")}
                  </Button>
                  <Text size="xs" c="dimmed" mt={6}>
                    {t("whereMyRobocosanBegan.form.iconHint")}
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
                  {t("whereMyRobocosanBegan.form.timelineLabel", {
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
              )}
              {validation.rows ? (
                <Text size="xs" c="red" mt={4}>
                  {validation.rows}
                </Text>
              ) : null}
            </div>

            <Button
              variant="subtle"
              color="violet"
              size="compact-sm"
              onClick={handleAddRow}
              disabled={rows.length >= MAX_TIMELINE_ROWS}
            >
              {t("whereMyRobocosanBegan.button.addRow")}
            </Button>

            <Select
              label={t("whereMyRobocosanBegan.form.favoriteOriginalSongLabel")}
              placeholder={t(
                "whereMyRobocosanBegan.form.favoriteOriginalSongPlaceholder",
              )}
              description={t(
                "whereMyRobocosanBegan.form.favoriteOriginalSongHint",
              )}
              data={favoriteOriginalSongOptions}
              value={favoriteOriginalSong || null}
              onChange={(value) => {
                updateDraft({ favoriteOriginalSong: value ?? "" });
              }}
              searchable
              clearable
              nothingFoundMessage={t(
                "whereMyRobocosanBegan.form.favoriteOriginalSongNothingFound",
              )}
              comboboxProps={{ withinPortal: false }}
            />

            <Button
              color="violet"
              size="md"
              onClick={handleGenerateImage}
              loading={isGenerating}
            >
              {t("whereMyRobocosanBegan.button.generateImage")}
            </Button>
          </Stack>
        </Paper>

        <Paper p="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Text fw={700}>{t("whereMyRobocosanBegan.previewTitle")}</Text>
            <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-2">
              {generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt={t("whereMyRobocosanBegan.previewAlt")}
                  className="w-full rounded"
                />
              ) : (
                <div className="aspect-4/5 rounded bg-linear-to-b from-purple-100 via-violet-100 to-indigo-100 dark:from-purple-950/40 dark:via-slate-900 dark:to-indigo-950/50 flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                  {t("whereMyRobocosanBegan.previewPlaceholder")}
                </div>
              )}
            </div>

            <Text size="sm" c="dimmed">
              {t("whereMyRobocosanBegan.shareNotice")}
            </Text>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                leftSection={<MdDownload />}
                onClick={handleDownload}
                disabled={!downloadReady}
                color="blue"
              >
                {t("whereMyRobocosanBegan.button.download")}
              </Button>
              <Button
                leftSection={<MdContentCopy />}
                onClick={handleCopyXText}
                variant="light"
                color={copySuccess ? "teal" : "violet"}
              >
                {copySuccess
                  ? t("copied")
                  : t("whereMyRobocosanBegan.button.copyXText")}
              </Button>
            </div>

            {copyFallbackText ? (
              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  {t("whereMyRobocosanBegan.copyFallbackLabel")}
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
