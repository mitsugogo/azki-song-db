"use client";
import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type {
  BestNineTopicView,
  BestNineTopicDefinition,
} from "@/app/lib/bestNineTopics";
import { bestNineErrorCode } from "@/app/lib/bestNineTopics";
import type { MyBestNineSongs } from "@/app/lib/myBestNineSongs";
import { showAppNotification } from "@/app/lib/notifications";

const API = "/api/share/my-best-9-songs";
const PENDING = "azki-best-nine:pending-topic";
export const bestNineRequest = async <T>(
  url: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "SERVICE_UNAVAILABLE");
  return body;
};

export default function useBestNineTopic(
  id: string | null,
  resumeCreation = false,
) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("Share.myBest9.topics");
  const [topic, setTopic] = useState<BestNineTopicView | null>(null);
  const [response, setResponse] = useState<{
    id: string;
    selection: MyBestNineSongs;
  } | null>(null);
  const [ready, setReady] = useState(!id);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const resumed = useRef(false);
  const report = (error: unknown) =>
    showAppNotification({
      type: "error",
      message: t(`errors.${bestNineErrorCode(error)}`),
    });

  useEffect(() => {
    if (!id || status === "loading") return;
    let cancelled = false;
    setReady(false);
    setError(null);
    void (async () => {
      try {
        await bestNineRequest(`${API}/participant`, { method: "POST" });
        const data = await bestNineRequest<{
          topic: BestNineTopicView;
          response: typeof response;
        }>(`${API}/topics/${encodeURIComponent(id)}`);
        if (!cancelled) {
          setTopic(data.topic);
          setResponse(data.response);
        }
      } catch (error) {
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
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, status]);

  const persist = async (
    definition: BestNineTopicDefinition,
    update = !!topic,
  ) => {
    if (status !== "authenticated") {
      sessionStorage.setItem(PENDING, JSON.stringify(definition));
      const callback = new URL(window.location.href);
      callback.searchParams.delete("topic");
      callback.searchParams.delete("revision");
      callback.searchParams.delete("new");
      callback.searchParams.set("resumeTopic", "1");
      await signIn("google", { callbackUrl: callback.toString() });
      return false;
    }
    setSaving(true);
    try {
      const data = await bestNineRequest<{ topic: BestNineTopicView }>(
        `${API}/topics${update && topic ? `/${topic.id}` : ""}`,
        {
          method: update ? "PATCH" : "POST",
          body: JSON.stringify({
            ...definition,
            ...(update && topic ? { version: topic.version } : {}),
          }),
        },
      );
      sessionStorage.removeItem(PENDING);
      router.push(
        `/share/my-best-9-songs?topic=${data.topic.id}&revision=${data.topic.version}`,
      );
      return true;
    } catch (error) {
      report(error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (id || !resumeCreation || status !== "authenticated" || resumed.current)
      return;
    resumed.current = true;
    const pending = sessionStorage.getItem(PENDING);
    if (!pending) return;
    try {
      void persist(JSON.parse(pending), false);
    } catch {
      sessionStorage.removeItem(PENDING);
    }
  }, [id, status, resumeCreation]);

  return {
    topic,
    response,
    ready,
    error,
    editing,
    setEditing,
    saving,
    persist,
    status,
    isAdmin: !!session?.user?.isAdmin,
  };
}
