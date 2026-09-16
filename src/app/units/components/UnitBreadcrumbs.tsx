import { Breadcrumbs } from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses } from "@/app/theme";

export default function UnitBreadcrumbs({
  homeLabel,
  unitsLabel,
  unitName,
}: {
  homeLabel: string;
  unitsLabel: string;
  unitName?: string;
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
      {unitName ? (
        <>
          <Link href="/units" className={breadcrumbClasses.link}>
            {unitsLabel}
          </Link>
          <span className={breadcrumbClasses.link}>{unitName}</span>
        </>
      ) : (
        <span className={breadcrumbClasses.link}>{unitsLabel}</span>
      )}
    </Breadcrumbs>
  );
}
