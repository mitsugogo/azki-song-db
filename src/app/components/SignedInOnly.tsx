"use client";

import { Button, Loader } from "@mantine/core";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function SignedInOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const t = useTranslations("Account");
  if (status === "loading")
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader color="pink" />
      </div>
    );
  if (status === "unauthenticated") {
    return (
      <div className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">{t("signInRequiredTitle")}</h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t("signInRequiredDescription")}
        </p>
        <Button
          color="pink"
          onClick={() =>
            void signIn("google", { callbackUrl: window.location.href })
          }
        >
          {t("signIn")}
        </Button>
      </div>
    );
  }
  return children;
}
