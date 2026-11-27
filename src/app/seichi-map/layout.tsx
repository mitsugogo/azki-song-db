import type { Viewport } from "next";
import "leaflet/dist/leaflet.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
  // iPhone のホームバー側の余白（セーフエリア）を env(safe-area-inset-bottom) で使うために必要
  viewportFit: "cover",
};

export default function SeichiMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
