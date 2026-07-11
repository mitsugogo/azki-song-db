"use client";

import { Avatar, Menu } from "@mantine/core";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { FaRightFromBracket, FaRightToBracket, FaUser } from "react-icons/fa6";

export default function AccountMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations("Account");

  return (
    <Menu position="bottom-end" withArrow width={240}>
      <Menu.Target>
        <button
          type="button"
          className="ml-2 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-white"
          aria-label={t("menuLabel")}
        >
          <Avatar
            src={session?.user?.image}
            alt={session?.user?.name ?? t("guest")}
            size="sm"
            color="pink"
            radius="xl"
          >
            {session?.user?.name?.slice(0, 1) ?? <FaUser />}
          </Avatar>
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        {session?.user && (
          <Menu.Label>{session.user.name ?? session.user.email}</Menu.Label>
        )}
        {status === "authenticated" ? (
          <Menu.Item
            leftSection={<FaRightFromBracket />}
            onClick={() => void signOut({ callbackUrl: window.location.href })}
          >
            {t("signOut")}
          </Menu.Item>
        ) : (
          <Menu.Item
            leftSection={<FaRightToBracket />}
            disabled={status === "loading"}
            onClick={() =>
              void signIn("google", { callbackUrl: window.location.href })
            }
          >
            {t("signIn")}
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
