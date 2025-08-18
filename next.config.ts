import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL("https://img.youtube.com/**")],
    unoptimized: true,
  },
};

export default withFlowbiteReact(nextConfig);
