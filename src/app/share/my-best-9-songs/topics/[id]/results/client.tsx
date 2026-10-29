"use client";
import { useEffect, useState } from "react";
import { Alert, Breadcrumbs, Button, Text } from "@mantine/core";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { Link, useRouter } from "@/i18n/navigation";
import { pageClasses, breadcrumbClasses } from "@/app/theme";
import { bestNineRequest } from "@/app/hook/useBestNineTopic";
import type { BestNineResults } from "@/app/lib/bestNineTopics";
import { bestNineErrorCode } from "@/app/lib/bestNineTopics";
import BestNineResultsContent, {
  BestNineResultsHeader,
} from "../../../BestNineResults";
import { showAppNotification } from "@/app/lib/notifications";
import { ScrollToTopButton } from "@/app/components/ScrollToTopButton";

export default function BestNineResultsClient({
  id,
  previewData,
}: {
  id: string;
  previewData?: BestNineResults;
}) {
  const t = useTranslations("Share.myBest9.topics");
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<BestNineResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (previewData) return;
    if (status === "loading") {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    const topicUrl = `/api/share/my-best-9-songs/topics/${encodeURIComponent(id)}`;
    // 未ログイン時もお題の存在だけを確認し、削除済みのURLなら案内して戻す。
    const request =
      status === "authenticated"
        ? bestNineRequest<BestNineResults>(`${topicUrl}/results`)
        : bestNineRequest(topicUrl).then(() => null);
    void request
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const code = bestNineErrorCode(error);
          setError(code);
          if (code === "NOT_FOUND") {
            showAppNotification({
              type: "warning",
              message: t("missingTopic"),
            });
            router.replace("/share/my-best-9-songs");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, status, reload, previewData]);
  return (
    <div className={pageClasses.shell}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" />
          HOME
        </Link>
        <Link href="/share/my-best-9-songs" className={breadcrumbClasses.link}>
          {t("generator")}
        </Link>
        <Link
          href="/share/my-best-9-songs/topics"
          className={breadcrumbClasses.link}
        >
          {t("manage")}
        </Link>
        <span className={breadcrumbClasses.link} aria-current="page">
          {t("results")}
        </span>
      </Breadcrumbs>
      <BestNineResultsHeader
        data={previewData ?? (status === "authenticated" ? data : null)}
        onRefresh={
          previewData ? undefined : () => setReload((value) => value + 1)
        }
      />
      {previewData ? (
        <>
          <Text size="sm" c="dimmed" mb="lg" role="status">
            {t("previewNotice")}
          </Text>
          <BestNineResultsContent data={previewData} />
        </>
      ) : status === "unauthenticated" ? (
        <Button
          onClick={() =>
            signIn("google", { callbackUrl: window.location.href })
          }
        >
          {t("login")}
        </Button>
      ) : status === "loading" || loading ? (
        <Text role="status" size="sm" c="dimmed">
          {t("loading")}
        </Text>
      ) : error ? (
        <Alert color="red">
          <Text size="sm">{t(`errors.${error}`)}</Text>
          {error === "SERVICE_UNAVAILABLE" && (
            <Button
              variant="default"
              size="sm"
              mt="sm"
              onClick={() => setReload((value) => value + 1)}
            >
              {t("retry")}
            </Button>
          )}
        </Alert>
      ) : (
        data && <BestNineResultsContent data={data} />
      )}
      <ScrollToTopButton />
    </div>
  );
}
