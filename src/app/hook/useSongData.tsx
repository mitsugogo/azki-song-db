import { useState, useEffect } from "react";
import { Song } from "../types/song";
export function useSongData() {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);

  // 曲リストの取得
  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return { loading, songs };
}
