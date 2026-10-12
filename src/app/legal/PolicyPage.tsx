import { Breadcrumbs } from "@mantine/core";
import { getTranslations } from "next-intl/server";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "@/app/theme";
import type { PolicyDocument } from "./policyMetadata";

// Update these dates when the published documents are revised.
const policyPublishedDate = "2026-10-11";
const policyUpdatedDate = "2026-10-11";

type PolicySection = { id: string; heading: string; paragraphs: string[] };

const servicePolicies = [
  { key: "google", href: "https://policies.google.com/privacy" },
  { key: "youtubeTerms", href: "https://www.youtube.com/t/terms" },
  {
    key: "analytics",
    href: "https://vercel.com/docs/analytics/privacy-policy",
  },
  {
    key: "speedInsights",
    href: "https://vercel.com/docs/speed-insights/privacy-policy",
  },
  { key: "osm", href: "https://osmfoundation.org/wiki/Privacy_Policy" },
  { key: "gsi", href: "https://www.gsi.go.jp/GSI/puraibasi-porisi.htm" },
] as const;

const linkClass =
  "text-primary underline underline-offset-2 hover:opacity-80 dark:text-primary-400";

export default async function PolicyPage({
  document,
}: {
  document: PolicyDocument;
}) {
  const [t, tLegal] = await Promise.all([
    getTranslations(document === "terms" ? "Terms" : "Privacy"),
    getTranslations("Legal"),
  ]);
  const sections = t.raw("sections") as PolicySection[];
  const otherDocument = document === "terms" ? "privacy" : "terms";

  return (
    <main className={pageClasses.shell}>
      <Breadcrumbs
        role="navigation"
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" />
          {tLegal("home")}
        </Link>
        <span aria-current="page">{t("title")}</span>
      </Breadcrumbs>
      <article className="mx-auto max-w-3xl">
        <h1 className={pageClasses.heading}>{t("title")}</h1>
        <p className={pageClasses.description}>{t("description")}</p>
        <div className="mb-6 space-y-1 text-sm text-muted">
          <p>
            {tLegal("published")}{" "}
            <time dateTime={policyPublishedDate}>{policyPublishedDate}</time>
          </p>
          <p>
            {tLegal("updated")}{" "}
            <time dateTime={policyUpdatedDate}>{policyUpdatedDate}</time>
          </p>
        </div>
        <div className="space-y-8 text-sm leading-7 text-gray-700 dark:text-gray-200">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`policy-${section.id}`}>
              <h2
                id={`policy-${section.id}`}
                className="mb-2 text-lg font-semibold text-gray-900 dark:text-white"
              >
                {section.heading}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.id === "externalServices" ? (
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  {servicePolicies.map(({ key, href }) => (
                    <li key={key}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        {tLegal(`services.${key}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.id === "contact" ? (
                <p className="mt-3">
                  <a
                    href="https://x.com/mitsugogo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    X: @mitsugogo
                  </a>
                </p>
              ) : null}
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm">
          <Link href={`/${otherDocument}`} className={linkClass}>
            {tLegal(otherDocument)}
          </Link>
        </p>
      </article>
    </main>
  );
}
