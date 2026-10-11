import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function PolicyLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const t = useTranslations("Legal");

  return (
    <nav aria-label={t("linksLabel")} className={className}>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
        <Link
          href="/terms"
          onClick={onNavigate}
          className="underline underline-offset-2 hover:opacity-80"
        >
          {t("terms")}
        </Link>
        <Link
          href="/privacy"
          onClick={onNavigate}
          className="underline underline-offset-2 hover:opacity-80"
        >
          {t("privacy")}
        </Link>
      </div>
    </nav>
  );
}
