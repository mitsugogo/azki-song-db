import "server-only";
import enMessages from "../messages/en.json";
import jaMessages from "../messages/ja.json";
import type { AppLocale } from "./routing";

const messagesByLocale = {
  en: enMessages,
  ja: jaMessages,
};

export const getMessagesForLocale = (locale: AppLocale) =>
  messagesByLocale[locale];
