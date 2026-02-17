import useSongs from "./useSongs";

export function useSongData() {
  const { allSongs, isLoading } = useSongs();

  return { loading: isLoading, songs: allSongs };
}
