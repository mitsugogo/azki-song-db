import { jstOffsetMs } from "./highlights";

const AZKI_BIRTHDAY_MONTH = 7;
const AZKI_BIRTHDAY_DAY = 1;

export const isAzkiBirthday = (now: Date = new Date()) => {
  const jstDate = new Date(now.getTime() + jstOffsetMs);
  return (
    jstDate.getUTCMonth() + 1 === AZKI_BIRTHDAY_MONTH &&
    jstDate.getUTCDate() === AZKI_BIRTHDAY_DAY
  );
};
