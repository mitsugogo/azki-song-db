import type { NextConfig } from "next";
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const allowedDevOrigins = process.env.SERVER_ACTIONS_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.NEXT_PLW ? ".next-playwright" : ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks", "react-icons"],
    // Keep the Vercel Toolbar's SSE connection alive through Next's rewrite proxy.
    ...(process.env.NODE_ENV === "development"
      ? { proxyTimeout: 24 * 60 * 60 * 1000 }
      : {}),
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  redirects() {
    return [
      {
        source: "/summary/:path*",
        destination: "/activity/:path*",
        permanent: true,
      },
    ];
  },
  headers() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
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

const withVercelToolbar = require("@vercel/toolbar/plugins/next")();

export default withVercelToolbar(withNextIntl(nextConfig));
