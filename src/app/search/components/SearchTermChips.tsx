import {
  FaCalendar,
  FaFilePen,
  FaGuitar,
  FaLeaf,
  FaMusic,
  FaPenNib,
  FaStar,
  FaTag,
  FaUser,
  FaUsers,
} from "react-icons/fa6";

interface SearchTermChipsProps {
  terms: string[];
}

const SearchTermChips = ({ terms }: SearchTermChipsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {terms.map((term, index) => {
        let icon = null;
        let label = term;

        if (term.startsWith("unit:")) {
          icon = <FaUsers className="mr-1" />;
          label = term.replace("unit:", "");
        } else if (term.startsWith("artist:")) {
          icon = <FaUser className="mr-1" />;
          label = term.replace("artist:", "");
        } else if (term.startsWith("sing:")) {
          icon = <FaUser className="mr-1" />;
          label = term.replace("sing:", "");
        } else if (term.startsWith("tag:")) {
          icon = <FaTag className="mr-1" />;
          label = term.replace("tag:", "");
        } else if (term.startsWith("title:")) {
          icon = <FaMusic className="mr-1" />;
          label = term.replace("title:", "");
        } else if (term.startsWith("milestone:")) {
          icon = <FaStar className="mr-1" />;
          label = term.replace("milestone:", "");
        } else if (term.startsWith("year:")) {
          icon = <FaCalendar className="mr-1" />;
          label = term.replace("year:", "");
        } else if (term.startsWith("season:")) {
          icon = <FaLeaf className="mr-1" />;
          label = term.replace("season:", "");
        } else if (term.startsWith("lyricist:")) {
          icon = <FaPenNib className="mr-1" />;
          label = term.replace("lyricist:", "");
        } else if (term.startsWith("composer:")) {
          icon = <FaGuitar className="mr-1" />;
          label = term.replace("composer:", "");
        } else if (term.startsWith("arranger:")) {
          icon = <FaFilePen className="mr-1" />;
          label = term.replace("arranger:", "");
        }

        return (
          <span
            key={`${term}-${index}`}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100/70 dark:bg-primary-800/60 text-primary-700 dark:text-primary-200 border border-primary-200/50 dark:border-primary-700/50 backdrop-blur-sm"
          >
            {icon}
            {label}
          </span>
        );
      })}
    </div>
  );
};

export default SearchTermChips;
