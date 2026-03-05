import Link from "next/link";
import { Breadcrumbs } from "@mantine/core";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";

interface SearchBreadcrumbProps {
  currentLabel?: string;
}

const SearchBreadcrumb = ({ currentLabel }: SearchBreadcrumbProps) => {
  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      className={breadcrumbClasses.root}
      separator={<HiChevronRight className={breadcrumbClasses.separator} />}
    >
      <Link href="/" className={breadcrumbClasses.link}>
        <HiHome className="w-4 h-4 mr-1.5" /> Home
      </Link>
      <Link href="/search" className={breadcrumbClasses.link}>
        検索
      </Link>
      {currentLabel ? (
        <span className={breadcrumbClasses.link}>{currentLabel}</span>
      ) : null}
    </Breadcrumbs>
  );
};

export default SearchBreadcrumb;
