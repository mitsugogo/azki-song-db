import "server-only";
import { siteConfig } from "@/app/config/siteConfig";

const internalTokenHeader = "x-azki-internal-token";
const productionOrigin = new URL(siteConfig.siteUrl).origin;
const vercelAliasOrigin = "https://azki-song-db.vercel.app";
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const savedSelectionPath =
  /^\/api\/share\/my-best-9-songs\/(?!participant$)[A-Za-z0-9_-]{8,20}$/;

export async function internalApiFetch(
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const url = new URL(input);
  const method = (init.method ?? "GET").toUpperCase();
  const isAllowedRequest =
    (url.pathname === "/api/songs" &&
      (method === "GET" || method === "HEAD")) ||
    (method === "GET" &&
      (url.pathname === "/api/songs/lookup" ||
        url.pathname === "/api/lives" ||
        savedSelectionPath.test(url.pathname)));

  if (!isAllowedRequest) {
    throw new Error("Unsupported internal API request");
  }

  const isLocal =
    process.env.NODE_ENV !== "production" &&
    localHosts.has(url.hostname) &&
    (url.protocol === "http:" || url.protocol === "https:");
  const isProductionOrigin =
    url.origin === productionOrigin || url.origin === vercelAliasOrigin;
  const isPreview = process.env.VERCEL_ENV === "preview";
  const isPreviewOrigin =
    isPreview &&
    !!process.env.VERCEL_URL &&
    url.origin === `https://${process.env.VERCEL_URL}`;

  if (
    url.username ||
    url.password ||
    !(isProductionOrigin || isLocal || isPreviewOrigin)
  ) {
    throw new Error("Untrusted internal API origin");
  }

  const headers = new Headers(init.headers);
  headers.delete(internalTokenHeader);

  if (isProductionOrigin) {
    const token = process.env.INTERNAL_WAF_TOKEN;
    if (!token && process.env.NODE_ENV === "production" && !isPreview) {
      throw new Error("INTERNAL_WAF_TOKEN is missing");
    }
    if (token) headers.set(internalTokenHeader, token);

    // Match the permanent redirect in next.config.ts without forwarding headers.
    if (url.origin === vercelAliasOrigin) {
      url.host = new URL(productionOrigin).host;
    }
  }

  return fetch(url, { ...init, headers, redirect: "error" });
}
