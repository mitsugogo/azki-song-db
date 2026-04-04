import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-6 py-16 md:py-24 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-[130%] rounded-full bg-pink-200/60 blur-3xl dark:bg-pink-900/30" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-[-20%] rounded-full bg-fuchsia-200/60 blur-3xl dark:bg-fuchsia-900/30" />
      </div>

      <section className="w-full max-w-2xl rounded-3xl border border-pink-200/70 bg-white/70 p-8 text-center shadow-[0_18px_50px_rgba(176,46,112,0.18)] backdrop-blur-xl dark:border-pink-900/50 dark:bg-gray-900/65 md:p-12">
        <div
          className="mx-auto mt-6 w-32 md:w-40"
          role="img"
          aria-label={t("pinAlt")}
        >
          <svg
            viewBox="0 0 160 180"
            className="h-auto w-full drop-shadow-[0_12px_20px_rgba(184,30,138,0.25)]"
          >
            <defs>
              <linearGradient
                id="pinGradient"
                x1="20"
                y1="20"
                x2="140"
                y2="150"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a21caf" />
              </linearGradient>
            </defs>

            <path
              d="M80 12C43.6 12 14 40.8 14 76.4c0 41.2 48.7 85.8 63.1 97.9a4.9 4.9 0 0 0 5.8 0C97.3 162.2 146 117.6 146 76.4 146 40.8 116.4 12 80 12z"
              fill="url(#pinGradient)"
            />

            <circle cx="80" cy="76" r="35" fill="#fff" fillOpacity="0.95" />
            <circle cx="80" cy="76" r="22" fill="#f9a8d4" fillOpacity="0.85" />
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
            className="inline-flex min-w-44 items-center justify-center rounded-xl bg-linear-to-r from-pink-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:brightness-110"
          >
            {t("backToHome")}
          </Link>

          <Link
            href="/search"
            className="inline-flex min-w-44 items-center justify-center rounded-xl border border-pink-300/70 bg-white/75 px-6 py-3 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 dark:border-pink-700 dark:bg-gray-900/70 dark:text-pink-300 dark:hover:bg-pink-950/40"
          >
            {t("goToSearch")}
          </Link>
        </div>
      </section>
    </main>
  );
}
