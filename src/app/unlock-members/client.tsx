"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Breadcrumbs } from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import YouTube, { YouTubeEvent } from "react-youtube";
import { Options } from "youtube-player/dist/types";
import { Link } from "@/i18n/navigation";
import { AnalyticsWrapper } from "@/app/components/AnalyticsWrapper";
import Footer from "@/app/components/Footer";
import { Header } from "@/app/components/Header";
import { breadcrumbClasses } from "@/app/theme";

type Props = {
  initialUnlocked: boolean;
  isConfigured: boolean;
};

type PlaybackStatus = "idle" | "checking" | "verified" | "failed";

const playbackProbeVideoId = "EPA8xHQr3AY";
const playbackVerificationTimeoutMs = 10000;

export default function UnlockMembersClient({
  initialUnlocked,
  isConfigured,
}: Props) {
  return (
    <>
      <div className="flex h-dvh flex-col">
        <Header />
        <div className="flex w-full grow min-h-0 flex-col overflow-y-auto md:flex-row">
          <UnlockMembersContent
            initialUnlocked={initialUnlocked}
            isConfigured={isConfigured}
          />
        </div>
        <Footer />
      </div>
      <AnalyticsWrapper />
    </>
  );
}

function UnlockMembersContent({ initialUnlocked, isConfigured }: Props) {
  const t = useTranslations("MembersOnlyAccess");
  const dm = useTranslations("DrawerMenu");
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [noticeKey, setNoticeKey] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>(
    isConfigured ? "checking" : "idle",
  );
  const [playbackAttempt, setPlaybackAttempt] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!isConfigured) {
      setPlaybackStatus("idle");
      return;
    }

    setPlaybackStatus("checking");
    timeoutRef.current = window.setTimeout(() => {
      setPlaybackStatus((current) =>
        current === "verified" ? current : "failed",
      );
      timeoutRef.current = null;
    }, playbackVerificationTimeoutMs);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isConfigured, playbackAttempt]);

  const clearPlaybackTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePlaybackSuccess = () => {
    clearPlaybackTimeout();
    setPlaybackStatus("verified");
  };

  const handleProbeReady = (event: YouTubeEvent<number>) => {
    try {
      event.target.mute();
      event.target.playVideo();
    } catch {
      clearPlaybackTimeout();
      setPlaybackStatus("failed");
    }
  };

  const handleProbeStateChange = (event: YouTubeEvent<number>) => {
    if (event.data === 1) {
      handlePlaybackSuccess();
    }
  };

  const handleProbeError = () => {
    clearPlaybackTimeout();
    setPlaybackStatus("failed");
  };

  const playbackCheckOptions: Options = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      enablejsapi: 1,
      playsinline: 1,
      rel: 0,
      origin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (playbackStatus !== "verified") {
      setErrorKey("playback_verification_required");
      setNoticeKey(null);
      return;
    }

    setIsSubmitting(true);
    setErrorKey(null);
    setNoticeKey(null);

    try {
      const response = await fetch("/api/members-only-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, playbackVerified: true }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrorKey(payload?.error ?? "unexpected_error");
        return;
      }

      setPassword("");
      setIsUnlocked(true);
      setNoticeKey("unlockSuccess");
    } catch {
      setErrorKey("network_error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLock = async () => {
    setIsSubmitting(true);
    setErrorKey(null);
    setNoticeKey(null);

    try {
      const response = await fetch("/api/members-only-access", {
        method: "DELETE",
      });

      if (!response.ok) {
        setErrorKey("unexpected_error");
        return;
      }

      setIsUnlocked(false);
      setNoticeKey("lockSuccess");
    } catch {
      setErrorKey("network_error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const playbackStatusText =
    playbackStatus === "verified"
      ? t("playback.statusVerified")
      : playbackStatus === "failed"
        ? t("playback.statusFailed")
        : playbackStatus === "checking"
          ? t("playback.statusChecking")
          : t("playback.statusIdle");

  return (
    <div className="grow min-h-0 overflow-y-auto overflow-x-hidden p-2 lg:p-6 lg:pb-10">
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="mr-1.5 h-4 w-4" /> {dm("home")}
        </Link>
        <span className={breadcrumbClasses.link}>{t("title")}</span>
      </Breadcrumbs>

      <div className="px-3 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-pink-700 dark:text-pink-300">
          {t("eyebrow")}
        </p>
        <h1 className="mb-2 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-400">
          {t("description")}
        </p>

        <div className="mt-5 max-w-3xl space-y-4">
          {!isConfigured ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              {t("notConfigured")}
            </div>
          ) : null}

          <Alert
            color={isUnlocked ? "green" : "gray"}
            radius="lg"
            title={isUnlocked ? t("statusUnlocked") : t("statusLocked")}
            variant="light"
          >
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
              {isUnlocked ? t("statusUnlockedHelp") : t("statusLockedHelp")}
            </p>
          </Alert>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="rounded-xl border border-light-gray-200 bg-light-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("playback.title")}
                    </p>
                    <p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {t("playback.description")}
                    </p>
                    <p
                      aria-live="polite"
                      className="text-sm font-medium text-gray-800 dark:text-gray-100"
                    >
                      {playbackStatusText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPlaybackAttempt((current) => current + 1)}
                    disabled={!isConfigured || isSubmitting}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-white disabled:cursor-not-allowed disabled:text-gray-400 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:disabled:text-gray-600"
                  >
                    {t("playback.retry")}
                  </button>
                </div>

                <div className="mt-4 aspect-video overflow-hidden rounded-xl border border-gray-200 bg-black shadow-sm dark:border-gray-700">
                  {isConfigured ? (
                    <YouTube
                      key={playbackAttempt}
                      videoId={playbackProbeVideoId}
                      className="h-full w-full"
                      iframeClassName="h-full w-full"
                      opts={playbackCheckOptions}
                      onReady={handleProbeReady}
                      onStateChange={handleProbeStateChange}
                      onError={handleProbeError}
                    />
                  ) : null}
                </div>
              </div>

              <label
                className="block text-sm font-medium text-gray-800 dark:text-gray-100"
                htmlFor="members-only-password"
              >
                {t("passwordLabel")}
              </label>
              <input
                id="members-only-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                placeholder={t("passwordPlaceholder")}
                disabled={!isConfigured || isSubmitting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-900"
              />

              {errorKey ? (
                <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                  {t(`errors.${errorKey}`)}
                </p>
              ) : null}

              {noticeKey ? (
                <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                  {t(`notices.${noticeKey}`)}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    !isConfigured ||
                    isSubmitting ||
                    password.trim().length === 0 ||
                    playbackStatus !== "verified"
                  }
                  className="rounded-md bg-pink-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-700"
                >
                  {isSubmitting ? t("submitting") : t("submit")}
                </button>

                <button
                  type="button"
                  onClick={handleLock}
                  disabled={!isConfigured || isSubmitting || !isUnlocked}
                  className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900 dark:disabled:text-gray-600"
                >
                  {t("lock")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
