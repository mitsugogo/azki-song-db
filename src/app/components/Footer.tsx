import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  return (
    <>
      <div className="hidden lg:block h-8" aria-hidden="true" />
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-gray-800 text-white py-2 px-4 text-center hidden lg:block">
        <p className="text-xs">{t("disclaimer")}</p>
      </footer>
    </>
  );
}
