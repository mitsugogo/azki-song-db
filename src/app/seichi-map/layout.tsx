import type { Viewport } from "next";
import "leaflet/dist/leaflet.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
};

export default function SeichiMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
