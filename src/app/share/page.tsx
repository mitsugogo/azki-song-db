import type { Metadata } from "next";
import { siteConfig } from "@/app/config/siteConfig";
import ShareIndexClient from "./client";

export const metadata: Metadata = {
  title: `共有 | ${siteConfig.siteName}`,
  description: "AZKi Song Database の共有ページです。",
};

export default function ShareIndexPage() {
  return <ShareIndexClient />;
}
