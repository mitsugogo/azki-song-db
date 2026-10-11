"use client";

import { Avatar, type AvatarProps } from "@mantine/core";
import { useMemo, useState } from "react";

function getIconSources(iconUrl: string, resolution: number) {
  if (!iconUrl) return [];

  try {
    const url = new URL(iconUrl);
    if (
      url.protocol !== "https:" ||
      !["yt3.ggpht.com", "yt3.googleusercontent.com"].includes(url.hostname)
    ) {
      return [iconUrl];
    }

    url.pathname = url.pathname.replace(/=s\d+(?=-|$)/u, `=s${resolution}`);
    const primary = url.href;
    url.hostname =
      url.hostname === "yt3.ggpht.com"
        ? "yt3.googleusercontent.com"
        : "yt3.ggpht.com";
    return [primary, url.href];
  } catch {
    return [iconUrl];
  }
}

export default function ChannelAvatar({
  name,
  iconUrl,
  resolution = 160,
  ...props
}: Omit<AvatarProps, "src" | "alt" | "children" | "imageProps"> & {
  name: string;
  iconUrl: string;
  resolution?: number;
}) {
  const sources = useMemo(
    () => getIconSources(iconUrl, resolution),
    [iconUrl, resolution],
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  return (
    <Avatar
      {...props}
      key={sourceIndex}
      src={sources[sourceIndex] || null}
      alt={name}
      radius="xl"
      color="pink"
      imageProps={{
        referrerPolicy: "no-referrer",
        onError: () =>
          setSourceIndex((index) => Math.min(index + 1, sources.length)),
      }}
    >
      {Array.from(name)[0]}
    </Avatar>
  );
}
