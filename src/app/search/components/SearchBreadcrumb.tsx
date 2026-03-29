import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";
import { useTranslations } from "next-intl";

interface SearchBreadcrumbProps {
  currentLabel?: string;
}

const SearchBreadcrumb = ({ currentLabel }: SearchBreadcrumbProps) => {
  const t = useTranslations("SearchBrowse");
  const tDrawer = useTranslations("DrawerMenu");
  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      className={breadcrumbClasses.root}
      separator={<HiChevronRight className={breadcrumbClasses.separator} />}
    >
      <Link href="/" className={breadcrumbClasses.link}>
        <HiHome className="w-4 h-4 mr-1.5" /> {tDrawer("home")}
      </Link>
      <Link href="/search" className={breadcrumbClasses.link}>
        {t("title")}
      </Link>
      {currentLabel ? (
        <span className={breadcrumbClasses.link}>{currentLabel}</span>
      ) : null}
    </Breadcrumbs>
  );
};

export default SearchBreadcrumb;
