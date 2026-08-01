"use client";

import { Avatar, Menu, Tooltip } from "@mantine/core";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  FaCheck,
  FaGoogle,
  FaRightFromBracket,
  FaUser,
  FaWrench,
} from "react-icons/fa6";
import { useAdminMode } from "../context/AdminModeContext";

export default function AccountMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations("Account");
  const { isAdmin, enabled, setEnabled } = useAdminMode();

  return (
    <Menu position="bottom-end" width={240} shadow="md" withinPortal={true}>
      <Menu.Target>
        <button
          type="button"
          className="ml-2 mr-1 rounded-full cursor-pointer outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-white"
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
          <>
            {isAdmin && (
              <>
                <Menu.Item
                  leftSection={<FaWrench />}
                  rightSection={enabled ? <FaCheck aria-hidden /> : undefined}
                  onClick={() => setEnabled(!enabled)}
                >
                  {enabled ? t("adminDisable") : t("adminEnable")}
                </Menu.Item>
                <Menu.Divider />
              </>
            )}
            <Menu.Item
              leftSection={<FaRightFromBracket />}
              onClick={() =>
                void signOut({ callbackUrl: window.location.href })
              }
            >
              {t("signOut")}
            </Menu.Item>
          </>
        ) : (
          <Menu.Item
            leftSection={<FaGoogle />}
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
