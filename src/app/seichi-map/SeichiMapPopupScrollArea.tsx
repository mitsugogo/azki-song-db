"use client";

import { ScrollArea } from "@mantine/core";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type SeichiMapPopupScrollContent = {
  container: HTMLDivElement;
  body: HTMLDivElement;
};

export function SeichiMapPopupScrollArea({
  container,
  body,
}: SeichiMapPopupScrollContent) {
  const bodyHostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Map providers own the popup DOM; the portal keeps the site's Mantine context.
    bodyHostRef.current?.appendChild(body);
    return () => body.remove();
  }, [body, container]);

  return createPortal(
    <ScrollArea.Autosize
      style={{ flex: 1, minHeight: 0, minWidth: 0 }}
      styles={{ content: { display: "block", minWidth: 0, width: "100%" } }}
      type="auto"
      scrollbars="y"
      scrollbarSize={6}
      offsetScrollbars="y"
      overscrollBehavior="contain"
    >
      <div ref={bodyHostRef} />
    </ScrollArea.Autosize>,
    container,
  );
}
