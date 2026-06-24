import { Song } from "../../types/song";

export const isSungByAzki = (song: Song) => {
  return song.sings.some((singer) => singer.includes("AZKi"));
};
