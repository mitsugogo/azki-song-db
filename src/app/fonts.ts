import { Roboto_Flex, Zen_Maru_Gothic } from "next/font/google";

export const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  display: "swap",
  weight: "700",
  preload: true,
  adjustFontFallback: false,
});

export const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  display: "swap",
  weight: "600",
  preload: true,
});
