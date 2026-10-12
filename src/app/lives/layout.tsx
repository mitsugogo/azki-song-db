import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
};

export default function LivesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
