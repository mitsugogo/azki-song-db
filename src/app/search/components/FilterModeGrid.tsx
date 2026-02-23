import Link from "next/link";
import { SearchFilterModeResult } from "../hook/useSearchFilterModeData";

interface FilterModeGridProps {
  filterModeResult: Exclude<
    SearchFilterModeResult,
    { filterMode: "categories" }
  >;
}

const FilterModeGrid = ({ filterModeResult }: FilterModeGridProps) => {
  const { filterMode, data } = filterModeResult;

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filterMode === "title" &&
          (() => {
            const maxCount = Math.max(...data.map((item) => item.count), 1);
            return data.map((item, index) => {
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(`title:${item.title}|artist:${item.artist}`)}`}
                  className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 p-3">
                    <div className="font-medium text-sm line-clamp-2">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-light-gray-400 line-clamp-1 mt-1">
                      {item.artist}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-light-gray-400 mt-1">
                      {item.count}回
                    </div>
                  </div>
                </Link>
              );
            });
          })()}

        {filterMode === "artist" &&
          (() => {
            const maxCount = Math.max(...data.map((item) => item.count), 1);
            return data.map((item, index) => {
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(`artist:${item.artist}`)}`}
                  className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 p-3">
                    <div className="font-medium text-sm line-clamp-2">
                      {item.artist}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-light-gray-400 mt-1">
                      {item.count}曲
                    </div>
                  </div>
                </Link>
              );
            });
          })()}

        {filterMode === "tag" &&
          (() => {
            const maxCount = Math.max(...data.map((item) => item.count), 1);
            return data.map((item, index) => {
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(`tag:${item.tag}`)}`}
                  className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 p-3">
                    <div className="font-medium text-sm line-clamp-2">
                      {item.tag}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-light-gray-400 mt-1">
                      {item.count}曲
                    </div>
                  </div>
                </Link>
              );
            });
          })()}

        {filterMode === "singer" &&
          (() => {
            const counts = data.map((item) => item.count);
            const maxSqrt = Math.max(
              ...counts.map((count) => Math.sqrt(count)),
              1,
            );
            return data.map((item, index) => {
              const pct = Math.round((Math.sqrt(item.count) / maxSqrt) * 100);
              return (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(`sing:${item.singer}`)}`}
                  className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 p-3">
                    <div className="font-medium text-sm line-clamp-2">
                      {item.singer}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-light-gray-400 mt-1">
                      {item.count}曲
                    </div>
                  </div>
                </Link>
              );
            });
          })()}

        {filterMode === "collab" &&
          (() => {
            const maxCount = Math.max(...data.map((item) => item.count), 1);
            return data.map((item, index) => {
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(
                    item.unitName
                      ? `unit:${item.unitName}`
                      : item.members
                          .split("、")
                          .map((singer) => `sing:${singer}`)
                          .join("|"),
                  )}`}
                  className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 p-3">
                    <div className="font-medium text-sm line-clamp-2">
                      {item.unitName || item.members}
                    </div>
                    {item.unitName && (
                      <div className="text-xs text-gray-400 dark:text-light-gray-500 line-clamp-1 mt-1">
                        （{item.members}）
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-light-gray-300 mt-1">
                      {item.count}曲
                    </div>
                  </div>
                </Link>
              );
            });
          })()}

        {filterMode === "not-sung-for-a-year" &&
          (() => {
            return data.map((item, index) => {
              return (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(`title:${item.title}|artist:${item.artist}`)}`}
                  className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-primary-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="relative z-10 p-3">
                    <div className="font-medium text-sm line-clamp-2">
                      {item.title}{" "}
                      <span className="text-gray-400">({item.count}回)</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-light-gray-400 line-clamp-1 mt-1">
                      {item.artist}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-light-gray-400 mt-1">
                      最終配信日: {new Date(item.lastSung).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              );
            });
          })()}
      </div>
    </div>
  );
};

export default FilterModeGrid;
