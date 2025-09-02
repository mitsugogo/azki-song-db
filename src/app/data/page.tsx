import { Song } from "../types/song";
import { Suspense } from "react";
import ClientTable from "./client";
import Loading from "../loading";

export const metadata = {
  title: "収録データ一覧 | AZKi Song Database",
  description: "AZKiさんの歌枠のセトリをまとめています",
};

export default async function DataPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <ClientTable />
      </Suspense>
    </>
  );
}
