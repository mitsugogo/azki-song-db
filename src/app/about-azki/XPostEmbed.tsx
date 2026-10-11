"use client";

import { useComputedColorScheme } from "@mantine/core";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { parseXStatusSnowflakeId } from "../lib/xStatus";

type XWidgets = {
  widgets: {
    createTweet: (
      id: string,
      target: HTMLElement,
      options: {
        theme: "light" | "dark";
        lang: string;
        dnt: boolean;
        conversation: "none";
        align: "center";
      },
    ) => Promise<HTMLElement | undefined>;
  };
};

export default function XPostEmbed({
  url,
  locale,
  children,
}: {
  url: string;
  locale: string;
  children: ReactNode;
}) {
  const theme = useComputedColorScheme("light");
  const tweetId = parseXStatusSnowflakeId(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  // A fresh identity also distinguishes returning to a previously used theme.
  const renderKey = useMemo(
    () => ({ tweetId, locale, theme }),
    [tweetId, locale, theme],
  );
  const [renderedKey, setRenderedKey] = useState<typeof renderKey | null>(null);
  const rendered = scriptReady && renderedKey === renderKey;

  useEffect(() => {
    const widgets = (window as Window & { twttr?: XWidgets }).twttr?.widgets;
    const container = containerRef.current;
    if (!scriptReady || !tweetId || !container || !widgets) return;

    // X owns this detached-on-cleanup subtree; React owns the fallback separately.
    const target = document.createElement("div");
    container.appendChild(target);
    let active = true;
    Promise.resolve()
      .then(() =>
        active
          ? widgets.createTweet(tweetId, target, {
              theme,
              lang: locale,
              dnt: true,
              conversation: "none",
              align: "center",
            })
          : undefined,
      )
      .then((element) => {
        if (active && element) setRenderedKey(renderKey);
      })
      .catch(() => {
        // Keep the server-rendered quote and source link if X is unavailable.
      });

    return () => {
      active = false;
      target.remove();
    };
  }, [scriptReady, tweetId, locale, theme, renderKey]);

  return (
    <div>
      <div
        ref={containerRef}
        className={rendered ? undefined : "h-0 overflow-hidden"}
      />
      {!rendered && children}
      {tweetId && (
        <Script
          id="x-widgets"
          src="https://platform.x.com/widgets.js"
          strategy="lazyOnload"
          onReady={() => setScriptReady(true)}
          onError={() => setScriptReady(false)}
        />
      )}
    </div>
  );
}
