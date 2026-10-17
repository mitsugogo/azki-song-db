import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");

  return (
    <main className="min-h-screen w-full px-6 py-16 md:py-24 flex items-center justify-center">
      <section className="w-full max-w-2xl p-8 text-center md:p-12">
        <div
          className="mx-auto mt-6 w-32 md:w-40"
          role="img"
          aria-label={t("pinAlt")}
        >
          <svg
            viewBox="0 0 160 180"
            className="h-auto w-full text-pink-600 dark:text-pink-400"
          >
            <path
              d="M80 12C43.6 12 14 40.8 14 76.4c0 41.2 48.7 85.8 63.1 97.9a4.9 4.9 0 0 0 5.8 0C97.3 162.2 146 117.6 146 76.4 146 40.8 116.4 12 80 12z"
              fill="currentColor"
            />

            <circle cx="80" cy="76" r="35" fill="#fff" />
            <circle cx="80" cy="76" r="22" fill="#f9a8d4" />
          </svg>
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight text-gray-900 dark:text-gray-100 md:text-6xl">
          {t("title")}
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-700 dark:text-gray-300 md:text-base">
          {t("description")}
        </p>

        <p className="mx-auto mt-2 max-w-lg text-xs text-gray-500 dark:text-gray-400 md:text-sm">
          {t("hint")}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-w-44 items-center justify-center rounded-lg bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink-700"
          >
            {t("backToHome")}
          </Link>

          <Link
            href="/search"
            className="inline-flex min-w-44 items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t("goToSearch")}
          </Link>
        </div>
      </section>
    </main>
  );
}
