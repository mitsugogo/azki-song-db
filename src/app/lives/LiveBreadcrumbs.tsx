import { Breadcrumbs } from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses } from "@/app/theme";

export default function LiveBreadcrumbs({
  homeLabel,
  livesLabel,
  liveTitle,
  liveTitleHref,
  performanceLabel,
}: {
  homeLabel: string;
  livesLabel: string;
  liveTitle?: string;
  liveTitleHref?: string;
  performanceLabel?: string;
}) {
  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      className={breadcrumbClasses.root}
      separator={<HiChevronRight className={breadcrumbClasses.separator} />}
    >
      <Link href="/" className={breadcrumbClasses.link}>
        <HiHome className="mr-1.5 h-4 w-4" /> {homeLabel}
      </Link>
      {liveTitle ? (
        <>
          <Link href="/lives" className={breadcrumbClasses.link}>
            {livesLabel}
          </Link>
          {performanceLabel && liveTitleHref ? (
            <>
              <Link href={liveTitleHref} className={breadcrumbClasses.link}>
                {liveTitle}
              </Link>
              <span className={`${breadcrumbClasses.link} whitespace-nowrap`}>
                {performanceLabel}
              </span>
            </>
          ) : (
            <span className={`${breadcrumbClasses.link} whitespace-nowrap`}>
              {liveTitle}
            </span>
          )}
        </>
      ) : (
        <span className={breadcrumbClasses.link}>{livesLabel}</span>
      )}
    </Breadcrumbs>
  );
}
