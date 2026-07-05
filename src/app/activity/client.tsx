"use client";

import Loading from "../loading";
import YearsTile from "./yearsTile";
import Timeline from "./timeline";
import useSongs from "../hook/useSongs";

export default function SummaryTopClient() {
  const { allSongs, isLoading } = useSongs();

  if (isLoading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  return (
    <>
      <YearsTile songs={allSongs} />
      <Timeline songs={allSongs} />
    </>
  );
}
