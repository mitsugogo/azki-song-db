import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL("https://img.youtube.com/**")],
    unoptimized: true,
  },
};

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const withVercelToolbar = require("@vercel/toolbar/plugins/next")();

export default withVercelToolbar(withFlowbiteReact(withPWA(nextConfig)));
