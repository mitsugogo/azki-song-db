"use client";

import { Breadcrumbs, Button, Text } from "@mantine/core";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "@/app/theme";
import styles from "../topics.module.css";
import BestNineTopicManager from "../BestNineTopicManager";
import { useAdminMode } from "@/app/context/AdminModeContext";

export default function BestNineTopicsClient() {
  const { status, data: session } = useSession();
  const { enabled: adminModeEnabled } = useAdminMode();
  const t = useTranslations("Share.myBest9.topics");
  const dm = useTranslations("DrawerMenu");
  return (
    <div className={pageClasses.shell}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" />
          {dm("home")}
        </Link>
        <Link href="/share/my-best-9-songs" className={breadcrumbClasses.link}>
          {t("generator")}
        </Link>
        <span className={breadcrumbClasses.link} aria-current="page">
          {t("manage")}
        </span>
      </Breadcrumbs>
      <div className={styles.header}>
        <div className={styles.heading}>
          <h1 className={pageClasses.heading}>{t("manage")}</h1>
          <p className={styles.description}>{t("manageHelp")}</p>
        </div>
        <Button component={Link} href="/share/my-best-9-songs?new=1" size="sm">
          {t("newTopic")}
        </Button>
      </div>
      {status === "loading" ? (
        <Text role="status">{t("loading")}</Text>
      ) : status === "authenticated" ? (
        <BestNineTopicManager
          key={`${session?.user?.id}:${adminModeEnabled}`}
          authenticated
          showAll={adminModeEnabled}
        />
      ) : (
        <Button
          onClick={() =>
            signIn("google", { callbackUrl: window.location.href })
          }
        >
          {t("login")}
        </Button>
      )}
    </div>
  );
}
