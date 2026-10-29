"use client";
import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Pagination,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { bestNineRequest } from "@/app/hook/useBestNineTopic";
import type {
  BestNineTopicView,
  BestNineTopicPage,
} from "@/app/lib/bestNineTopics";
import { bestNineErrorCode } from "@/app/lib/bestNineTopics";
import { showAppNotification } from "@/app/lib/notifications";
import styles from "./topics.module.css";
import { formatDate } from "@/app/lib/formatDate";
import BestNineTopicEditModal from "./BestNineTopicEditModal";

export default function BestNineTopicManager({
  authenticated,
  showAll,
}: {
  authenticated: boolean;
  showAll: boolean;
}) {
  const t = useTranslations("Share.myBest9.topics");
  const locale = useLocale();
  const [topics, setTopics] = useState<BestNineTopicView[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<BestNineTopicView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BestNineTopicView | null>(
    null,
  );
  const deleteTopic = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await bestNineRequest(
        `/api/share/my-best-9-songs/topics/${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" },
      );
      setTopics((topics) =>
        topics.filter((topic) => topic.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setReload((value) => value + 1);
      showAppNotification({ message: t("deleted") });
    } catch (error) {
      if (bestNineErrorCode(error) === "NOT_FOUND") {
        setTopics((topics) =>
          topics.filter((topic) => topic.id !== deleteTarget.id),
        );
        setDeleteTarget(null);
        setReload((value) => value + 1);
      }
      showAppNotification({
        type: "error",
        message: t(`errors.${bestNineErrorCode(error)}`),
      });
    } finally {
      setDeleting(false);
    }
  };
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    setError(false);
    setLoading(true);
    setTopics([]);
    const query = new URLSearchParams();
    if (showAll) query.set("scope", "all");
    if (page > 1) query.set("page", String(page));
    void bestNineRequest<BestNineTopicPage>(
      `/api/share/my-best-9-songs/topics${query.size ? `?${query}` : ""}`,
    )
      .then((data) => {
        if (!cancelled) {
          setTopics(data.topics);
          setPagination({ total: data.total, totalPages: data.totalPages });
          if (data.page !== page) setPage(data.page);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, showAll, reload, page]);
  if (!authenticated) return null;
  return (
    <Stack gap="md">
      {editTarget && (
        <BestNineTopicEditModal
          key={`${editTarget.id}:${editTarget.version}`}
          topic={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setTopics((topics) =>
              topics.map((topic) =>
                topic.id === updated.id ? updated : topic,
              ),
            );
            setEditTarget(null);
          }}
        />
      )}
      <Modal
        opened={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={t("deleteConfirmTitle")}
        centered
        closeOnClickOutside={!deleting}
        closeOnEscape={!deleting}
        closeButtonProps={{ disabled: deleting, "aria-label": t("close") }}
      >
        <Text size="sm">
          {t("deleteConfirm", { title: deleteTarget?.title ?? "" })}
        </Text>
        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            {t("close")}
          </Button>
          <Button color="red" loading={deleting} onClick={deleteTopic}>
            {t("delete")}
          </Button>
        </Group>
      </Modal>
      {showAll && (
        <Text size="sm" c="dimmed">
          {t("allTopics")}
        </Text>
      )}
      {loading ? (
        <Text role="status" size="sm">
          {t("loading")}
        </Text>
      ) : error ? (
        <Alert color="red">
          <Text size="sm">{t("errors.SERVICE_UNAVAILABLE")}</Text>
          <Button
            variant="light"
            size="sm"
            mt="xs"
            onClick={() => setReload((value) => value + 1)}
          >
            {t("retry")}
          </Button>
        </Alert>
      ) : topics.length === 0 ? (
        <Text size="sm" c="dimmed">
          {t("empty")}
        </Text>
      ) : (
        <ul className={styles.topicList}>
          {topics.map((topic) => (
            <li key={topic.id} className={styles.topicRow}>
              <div className={styles.topicInfo}>
                <h2 className={styles.topicTitle}>
                  <Link
                    href={`/share/my-best-9-songs?topic=${topic.id}`}
                    className={styles.topicLink}
                  >
                    {topic.title}
                  </Link>
                </h2>
                <Text size="sm" c="dimmed">
                  {t("createdAt")}:{" "}
                  <time dateTime={topic.createdAt}>
                    {formatDate(topic.createdAt, locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                      timeZone: "Asia/Tokyo",
                    })}
                  </time>
                </Text>
              </div>
              <Group gap="sm">
                {topic.canViewResults && (
                  <Button
                    size="sm"
                    variant="default"
                    component={Link}
                    href={`/share/my-best-9-songs/topics/${topic.id}/results`}
                  >
                    {t("results")}
                  </Button>
                )}
                {topic.canEdit && (
                  <Tooltip label={t("edit")}>
                    <ActionIcon
                      size="lg"
                      variant="subtle"
                      color="gray"
                      aria-label={t("edit")}
                      onClick={() => setEditTarget(topic)}
                    >
                      <HiOutlinePencil size={18} aria-hidden="true" />
                    </ActionIcon>
                  </Tooltip>
                )}
                {topic.canDelete && (
                  <Tooltip label={t("delete")}>
                    <ActionIcon
                      size="lg"
                      variant="subtle"
                      color="red"
                      aria-label={t("delete")}
                      onClick={() => setDeleteTarget(topic)}
                    >
                      <HiOutlineTrash size={18} aria-hidden="true" />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </li>
          ))}
        </ul>
      )}
      {!error && pagination.total > 0 && (
        <Group justify="space-between" wrap="wrap">
          <Text size="sm" c="dimmed">
            {t("totalTopics", { count: pagination.total })}
          </Text>
          <Pagination
            total={pagination.totalPages}
            value={page}
            onChange={setPage}
            hideWithOnePage
            disabled={
              loading ||
              deleting ||
              deleteTarget !== null ||
              editTarget !== null
            }
            size="sm"
            siblings={1}
            boundaries={1}
            getItemProps={(page) => ({
              "aria-label": t("pageNumber", { page }),
            })}
            getControlProps={(control) => ({
              "aria-label": t(`pagination.${control}`),
            })}
          />
        </Group>
      )}
    </Stack>
  );
}
