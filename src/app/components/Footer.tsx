"use client";

import { useTranslations } from "next-intl";
import { useResizeObserver } from "@mantine/hooks";
import PolicyLinks from "./PolicyLinks";

const footerObserverOptions = { box: "border-box" } as const;

export default function Footer() {
  const t = useTranslations("Footer");
  const [footerRef, { height }] = useResizeObserver<HTMLElement>(
    footerObserverOptions,
  );
  return (
    <>
      <div
        className="hidden lg:block shrink-0"
        style={{ height }}
        aria-hidden="true"
      />
      <footer
        ref={footerRef}
        className="fixed bottom-0 inset-x-0 z-30 bg-gray-800 text-white py-2 px-4 text-center hidden lg:flex items-center justify-center gap-x-5 whitespace-nowrap"
      >
        <p className="text-xs">{t("disclaimer")}</p>
        <PolicyLinks className="shrink-0 text-xs" />
      </footer>
    </>
  );
}
