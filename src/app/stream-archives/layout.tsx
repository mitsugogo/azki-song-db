import { Viewport } from "next";
import StreamArchivesScrollControls from "./StreamArchivesScrollControls";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 10,
  userScalable: true,
};

export default function ArchivesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <StreamArchivesScrollControls />
    </>
  );
}
