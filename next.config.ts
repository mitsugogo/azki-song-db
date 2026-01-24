import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL("https://img.youtube.com/**")],
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks", "react-icons"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const withVercelToolbar = require("@vercel/toolbar/plugins/next")();

export default withVercelToolbar(withFlowbiteReact(withPWA(nextConfig)));
