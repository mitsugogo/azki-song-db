import { Loader } from "@mantine/core";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("Loading");
  return (
    <div
      role="status"
      aria-label={t("label")}
      className="flex min-h-48 flex-1 items-center justify-center py-12"
    >
      <Loader color="pink" type="bars" />
    </div>
  );
}
