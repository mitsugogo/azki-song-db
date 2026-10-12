import type { Metadata } from "next";
import { Fragment } from "react";
import { Breadcrumbs } from "@mantine/core";
import { getLocale, getTranslations } from "next-intl/server";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { LiaExternalLinkAltSolid } from "react-icons/lia";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "../theme";
import { buildLivePageMetadata } from "../lives/liveMetadata";
import { siteConfig } from "../config/siteConfig";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import GuideAnchors from "./GuideAnchors";
import XPostEmbed from "./XPostEmbed";
import {
  glossaryGroups,
  guideColumns,
  guideExploreLinks,
  guidePioneerProfileRows,
  guideSections,
  guideSources,
  guideSourceIds,
  guideSourceSection,
  guideUpdatedAt,
  guideVideoGroups,
  type GuideSourceId,
  type GuideVideo,
} from "./content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "AboutAzki" });
  return buildLivePageMetadata({
    title: t("title"),
    description: t("description"),
    pathname: locale === "en" ? "/en/about-azki" : "/about-azki",
    locale,
  });
}

const linkClass =
  "font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary dark:text-pink-300";
const headingClass =
  "scroll-mt-4 text-xl font-bold leading-relaxed text-gray-900 dark:text-gray-100";

export default async function AboutAzkiPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("AboutAzki"),
  ]);
  const sourceLinks = (sources: readonly GuideSourceId[]) => (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-6 text-gray-600 dark:text-gray-300">
      {[...new Set(sources)].map((id) => (
        <li key={id}>
          <a
            href={guideSources[id]}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {t(`sources.${id}`)}
            <LiaExternalLinkAltSolid
              className="ml-0.5 inline"
              aria-hidden="true"
            />
          </a>
        </li>
      ))}
    </ul>
  );
  const relatedSources = (sources: readonly GuideSourceId[]) => (
    <aside
      aria-label={t("relatedSources")}
      className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700"
    >
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {t("relatedSources")}
      </p>
      {sourceLinks(sources)}
    </aside>
  );
  const sectionSources = (id: (typeof guideSections)[number]["id"]) =>
    relatedSources(guideSections.find((section) => section.id === id)!.sources);
  const videoCards = (videos: readonly GuideVideo[]) => (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {videos.map((video) => {
        const title = t(`videos.${video.key}`);
        const href = `https://www.youtube.com/watch?v=${video.videoId}${
          video.startSeconds ? `&t=${video.startSeconds}s` : ""
        }`;
        return (
          <a
            key={video.videoId}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("watchVideo", { title })}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-primary focus-visible:outline-2 focus-visible:outline-primary dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="aspect-video">
              <YoutubeThumbnail videoId={video.videoId} alt={title} />
            </div>
            <span className="flex items-start justify-between gap-2 p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
              <LiaExternalLinkAltSolid
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
            </span>
          </a>
        );
      })}
    </div>
  );
  const paragraphs = (key: string) =>
    (t.raw(key) as string[]).map((_, index) => (
      <Fragment key={index}>
        <p className="mt-4 text-sm leading-8 text-gray-700 dark:text-gray-200">
          {t.rich(`${key}.${index}`, {
            geoFirst: (chunks) => (
              <a
                href={guideSources.geoFirst}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {chunks}
              </a>
            ),
            greetingMinecraft: (chunks) => (
              <a
                href={guideSources.greetingMinecraft}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        {key === "enjoy.paragraphs" &&
          guideVideoGroups
            .filter((group) => group.paragraph === index)
            .map((group) => (
              <Fragment key={group.paragraph}>
                {videoCards(group.videos)}
              </Fragment>
            ))}
      </Fragment>
    ));
  const heading = (id: string, title: string, level: "h2" | "h3" = "h2") => {
    const Heading = level;
    return (
      <Heading id={id} tabIndex={-1} className={headingClass}>
        {title}
        <a
          href={`#${id}`}
          aria-label={t("permalink", { title })}
          className="ml-2 text-base font-normal text-primary/60 hover:text-primary dark:text-pink-300"
        >
          #
        </a>
      </Heading>
    );
  };

  return (
    <main className={pageClasses.shell}>
      <div className="mx-auto w-full max-w-3xl pb-4">
        <Breadcrumbs
          role="navigation"
          aria-label="Breadcrumb"
          className={breadcrumbClasses.root}
          separator={<HiChevronRight className={breadcrumbClasses.separator} />}
        >
          <Link href="/" className={breadcrumbClasses.link}>
            <HiHome className="mr-1.5 h-4 w-4" />
            {t("home")}
          </Link>
          <span className={breadcrumbClasses.link}>{t("title")}</span>
        </Breadcrumbs>
        <div className="mt-4 flex items-center gap-3">
          <img
            src="/icon.png"
            width={48}
            height={48}
            alt=""
            className="shrink-0 rounded-full"
          />
          <h1 className={`${pageClasses.heading} mb-0!`}>{t("title")}</h1>
        </div>
        <p className={`${pageClasses.description} mt-3`}>{t("lead")}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("updatedAt")}{" "}
          <time dateTime={guideUpdatedAt}>{guideUpdatedAt}</time>
        </p>

        <GuideAnchors>
          <nav
            aria-label={t("contents")}
            className="mt-6 rounded-xl border border-pink-200/60 bg-pink-50/50 p-5 dark:border-pink-900/60 dark:bg-pink-950/20"
          >
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {t("contents")}
            </h2>
            <ol className="mt-3 grid list-inside list-decimal gap-2 text-sm sm:grid-cols-2">
              {[...guideSections, guideSourceSection].map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={linkClass}>
                    {t(`sections.${section.key}`)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <section className="mt-10" aria-labelledby="introduction">
            {heading("introduction", t("sections.introduction"))}
            {paragraphs("introduction.paragraphs")}
            {sectionSources("introduction")}
          </section>

          <section className="mt-10" aria-labelledby="profile">
            {heading("profile", t("sections.profile"))}
            <dl className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 px-4 dark:divide-gray-700 dark:border-gray-700">
              {[
                "reading",
                "affiliation",
                "birthday",
                "debut",
                "fanName",
                "dream",
              ].map((key) => (
                <div
                  key={key}
                  className="grid gap-1 py-3 text-sm sm:grid-cols-[8rem_1fr] sm:gap-4"
                >
                  <dt className="font-semibold text-gray-600 dark:text-gray-300">
                    {t(`profile.${key}.label`)}
                  </dt>
                  <dd className="leading-6 text-gray-900 dark:text-gray-100">
                    {t(`profile.${key}.value`)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a
                className={linkClass}
                href={guideSources.profile}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("officialProfile")}
              </a>
              <a
                className={linkClass}
                href={siteConfig.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.channelName}
              </a>
              <a
                className={linkClass}
                href={siteConfig.xUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("officialX")}
              </a>
            </div>
            {sectionSources("profile")}
          </section>

          <section className="mt-10" aria-labelledby="enjoy">
            {heading("enjoy", t("sections.enjoy"))}
            {paragraphs("enjoy.paragraphs")}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a
                href={`${siteConfig.channelUrl}/streams`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {t("watchStreams")}
              </a>
              <a
                href={guideSources.geoStream}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {t("watchGeoStream")}
              </a>
            </div>
            {sectionSources("enjoy")}
          </section>

          <section className="mt-10" aria-labelledby="columns">
            {heading("columns", t("sections.columns"))}
            <ol className="mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 text-sm">
              {guideColumns.map((column) => (
                <li key={column.id}>
                  <a href={`#${column.id}`} className={linkClass}>
                    {t(`columns.${column.key}.title`)}
                  </a>
                </li>
              ))}
            </ol>
            {guideColumns.map((column) => (
              <article
                key={column.id}
                aria-labelledby={column.id}
                className="mt-6 rounded-xl border border-gray-200 p-5 sm:p-6 dark:border-gray-700"
              >
                {heading(column.id, t(`columns.${column.key}.title`), "h3")}
                {paragraphs(`columns.${column.key}.paragraphs`)}
                {column.key === "pioneers" && (
                  <>
                    <div className="mt-5">
                      <XPostEmbed
                        url={guideSources.pioneersVisual}
                        locale={locale}
                      >
                        <figure className="border-l-2 border-pink-300 pl-4 dark:border-pink-700">
                          <blockquote
                            cite={guideSources.pioneersVisual}
                            className="text-sm leading-8 text-gray-700 dark:text-gray-200"
                          >
                            {t("columns.pioneers.quote")}
                          </blockquote>
                          <figcaption className="mt-2 text-xs leading-6">
                            <a
                              href={guideSources.pioneersVisual}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={linkClass}
                            >
                              {t("columns.pioneers.quoteSource")}
                              <LiaExternalLinkAltSolid
                                className="ml-0.5 inline"
                                aria-hidden="true"
                              />
                            </a>
                          </figcaption>
                        </figure>
                      </XPostEmbed>
                    </div>
                    <table className="mt-5 w-full border-collapse text-sm">
                      <caption className="mb-3 text-left font-bold text-gray-900 dark:text-gray-100">
                        {t("columns.pioneers.profile.title")}
                      </caption>
                      <tbody>
                        {guidePioneerProfileRows.map((key) => (
                          <tr
                            key={key}
                            className="border-b border-gray-200 dark:border-gray-700"
                          >
                            <th
                              scope="row"
                              className="w-28 py-3 pr-4 text-left align-top font-semibold text-gray-600 sm:w-36 dark:text-gray-300"
                            >
                              {t(`columns.pioneers.profile.${key}.label`)}
                            </th>
                            <td className="py-3 leading-6 text-gray-900 dark:text-gray-100">
                              {t(`columns.pioneers.profile.${key}.value`)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {relatedSources(column.sources)}
              </article>
            ))}
          </section>

          <section className="mt-10" aria-labelledby="glossary">
            {heading("glossary", t("sections.glossary"))}
            <p className="mt-4 text-sm leading-8 text-gray-700 dark:text-gray-200">
              {t("glossaryLead")}
            </p>
            {glossaryGroups.map((group) => (
              <div key={group.key} className="mt-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t(`glossaryGroups.${group.key}`)}
                </h3>
                <ul className="mt-3 flex list-none flex-wrap gap-x-4 gap-y-2 text-sm">
                  {group.entries.map((entry) => (
                    <li key={entry.id}>
                      <a href={`#${entry.id}`} className={linkClass}>
                        {t(`terms.${entry.key}.name`)}
                      </a>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="py-5">
                      <dt
                        id={entry.id}
                        tabIndex={-1}
                        className="scroll-mt-4 text-base font-bold text-gray-900 dark:text-gray-100"
                      >
                        {t(`terms.${entry.key}.name`)}
                        <a
                          href={`#${entry.id}`}
                          aria-label={t("permalink", {
                            title: t(`terms.${entry.key}.name`),
                          })}
                          className="ml-2 text-primary dark:text-pink-300"
                        >
                          #
                        </a>
                      </dt>
                      <dd>
                        <p className="mt-2 text-sm leading-8 text-gray-700 dark:text-gray-200">
                          {t.rich(`terms.${entry.key}.description`, {
                            seichiMap: (chunks) => (
                              <Link href="/seichi-map" className={linkClass}>
                                {chunks}
                              </Link>
                            ),
                          })}
                        </p>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            {relatedSources(
              glossaryGroups.flatMap((group) =>
                group.entries.flatMap((entry) => [...entry.sources]),
              ),
            )}
          </section>

          <section className="mt-10" aria-labelledby="explore">
            {heading("explore", t("sections.explore"))}
            <p className="mt-4 text-sm leading-8 text-gray-700 dark:text-gray-200">
              {t("exploreLead")}
            </p>
            <ul className="mt-4 list-none space-y-3">
              {guideExploreLinks.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="block rounded-xl border border-gray-200 px-4 py-3 transition hover:border-primary dark:border-gray-700"
                  >
                    <span className="text-sm font-bold text-primary dark:text-pink-300">
                      {t(`explore.${item.key}.title`)}{" "}
                      <HiChevronRight className="inline" aria-hidden="true" />
                    </span>
                    <p className="mt-1 text-sm leading-7 text-gray-600 dark:text-gray-300">
                      {t(`explore.${item.key}.description`)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            {sectionSources("explore")}
          </section>
          <section className="mt-10" aria-labelledby={guideSourceSection.id}>
            {heading(guideSourceSection.id, t("sections.sources"))}
            {sourceLinks(guideSourceIds)}
          </section>
        </GuideAnchors>
      </div>
    </main>
  );
}
