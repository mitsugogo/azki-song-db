import Link from "next/link";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";

interface SearchBreadcrumbProps {
  currentLabel?: string;
}

const SearchBreadcrumb = ({ currentLabel }: SearchBreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className={breadcrumbClasses.root}>
      <div className="flex items-center">
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </Link>
        <HiChevronRight className={breadcrumbClasses.separator} />
        <Link href="/search" className={breadcrumbClasses.link}>
          検索
        </Link>
        {currentLabel ? (
          <>
            <HiChevronRight className={breadcrumbClasses.separator} />
            <span className={breadcrumbClasses.link}>{currentLabel}</span>
          </>
        ) : null}
      </div>
    </nav>
  );
};

export default SearchBreadcrumb;
