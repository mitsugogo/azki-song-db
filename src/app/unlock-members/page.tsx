import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { baseUrl, siteConfig } from "@/app/config/siteConfig";
import {
  hasMembersOnlyAccess,
  isMembersOnlyAccessConfigured,
  membersOnlyAccessCookieName,
} from "@/app/lib/membersOnlyAccess";
import UnlockMembersClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations({
    namespace: "Metadata.membersOnlyAccess",
    locale,
  });

  const title = tMeta("title", { siteName: siteConfig.siteName });
  const description = tMeta("description");
  const canonical = new URL("/unlock-members", baseUrl).toString();

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical,
    },
  };
}

export default async function UnlockMembersPage() {
  const cookieStore = await cookies();
  const initialUnlocked = hasMembersOnlyAccess(
    cookieStore.get(membersOnlyAccessCookieName)?.value,
  );

  return (
    <UnlockMembersClient
      initialUnlocked={initialUnlocked}
      isConfigured={isMembersOnlyAccessConfigured()}
    />
  );
}
