"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-6 py-16 md:py-24 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-[130%] rounded-full bg-pink-200/60 blur-3xl dark:bg-pink-900/30" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-[-20%] rounded-full bg-fuchsia-200/60 blur-3xl dark:bg-fuchsia-900/30" />
      </div>

      <section className="w-full max-w-3xl rounded-3xl border border-pink-200/70 bg-white/70 p-8 text-center shadow-[0_18px_50px_rgba(176,46,112,0.18)] backdrop-blur-xl dark:border-pink-900/50 dark:bg-gray-900/65 md:p-12">
        <h1 className="mt-5 text-2xl font-black leading-tight text-gray-900 dark:text-gray-100 md:text-5xl">
          {t("title")}
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-700 dark:text-gray-300 md:text-base">
          {t("description")}
        </p>

        <p className="mx-auto mt-2 max-w-lg text-xs text-gray-500 dark:text-gray-400 md:text-sm">
          {t("hint")}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-w-44 items-center justify-center rounded-xl bg-linear-to-r from-pink-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:brightness-110"
          >
            {t("retry")}
          </button>

          <Link
            href="/"
            className="inline-flex min-w-44 items-center justify-center rounded-xl border border-pink-300/70 bg-white/75 px-6 py-3 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 dark:border-pink-700 dark:bg-gray-900/70 dark:text-pink-300 dark:hover:bg-pink-950/40"
          >
            {t("backToHome")}
          </Link>
        </div>

        {process.env.NODE_ENV !== "production" && error?.message ? (
          <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
            {error.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
