import { List } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { FaGithub } from "react-icons/fa6";
import { useTranslations } from "next-intl";

const Acknowledgment = () => {
  const t = useTranslations("Acknowledgment");

  return (
    <>
      <div className="text-sm text-muted">
        <p>{t("intro.p1")}</p>
        <p>{t("intro.p2")}</p>
        <p>{t("intro.p3")}</p>
      </div>

      <h3 className="mt-5 font-semibold">{t("video.heading")}</h3>

      <div className="text-sm text-muted mt-1">
        <p>{t("video.p1")}</p>
        <p className="mt-2">{t("video.p2")}</p>
        <p className="mt-2">{t("video.p3")}</p>
      </div>

      <h3 className="mt-5 font-semibold">{t("aggregation.heading")}</h3>

      <div className="text-sm text-muted mt-1">
        <p>{t("aggregation.p1")}</p>
        <p className="mt-2">{t("aggregation.p2")}</p>
        <p className="mt-2">{t("aggregation.p3")}</p>
        <p className="mt-2">{t("aggregation.p4")}</p>
        <p>
          {t("aggregation.contact.prefix")}
          <Link
            href="https://x.com/mitsugogo"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            @mitsugogo
          </Link>{" "}
          {t("aggregation.contact.and")}{" "}
          <a
            href="https://github.com/mitsugogo/azki-song-db"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
          >
            <FaGithub className="inline mr-1" />
            {t("aggregation.contact.github")}
          </a>{" "}
          {t("aggregation.contact.suffix")}
        </p>
      </div>

      <h3 className="mt-5 font-semibold">{t("icon.heading")}</h3>
      <div className="text-sm text-muted mt-1">
        <p>
          {t("icon.p1.prefix")}
          <Link
            href="https://x.com/YsWeissYs"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("icon.p1.linkText")}
          </Link>{" "}
          {t("icon.p1.suffix")}
        </p>
        <p className="mt-2">{t("icon.p2")}</p>
      </div>

      <h3 className="mt-5 font-semibold">{t("changelog.heading")}</h3>

      <div className="text-sm text-muted">
        <p>
          <Link
            href="https://github.com/mitsugogo/azki-song-db/blob/main/CHANGELOG.md"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub className="inline-block mr-1" />
            {t("changelog.linkText")}
          </Link>{" "}
          {t("changelog.suffix")}
        </p>
      </div>

      <h3 className="mt-5 font-semibold">{t("admin.heading")}</h3>

      <div className="text-sm text-muted">
        <p>
          <Link
            href="https://github.com/mitsugogo/azki-song-db"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub className="inline-block mr-1" />
            {t("admin.github")}
          </Link>
          &nbsp;
          <Link
            href="https://x.com/mitsugogo"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("admin.twitter")}
          </Link>
        </p>
      </div>

      <h3 className="mt-5 font-semibold">{t("license.heading")}</h3>
      <div className="text-sm text-muted">
        <p>
          {t("license.p1.prefix")}
          <Link
            href="https://github.com/mitsugogo/azki-song-db/blob/main/LICENSE"
            className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub className="inline-block mr-1" />
            {t("license.p1.linkText")}
          </Link>
        </p>
      </div>
    </>
  );
};

export default Acknowledgment;
