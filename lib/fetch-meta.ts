import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isShortener, LinkError, normalizeLink, type NormalizedLink } from "./link";

export type LinkPreview = NormalizedLink & { title: string; description: string; iconUrl: string };

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 6000;

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  );
}

async function assertPublicHost(url: URL) {
  const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
  if (!addresses.length) throw new LinkError("We couldn't reach that website.");
  if (addresses.some((a) => isPrivateAddress(a.address))) throw new LinkError("That doesn't look like a public website.");
}

/** Fetches a public page, following up to 4 redirects and checking every hop's address. */
async function safeFetch(start: string): Promise<{ finalUrl: string; html: string }> {
  let current = new URL(start);
  for (let hop = 0; hop < 5; hop++) {
    if (current.protocol !== "https:" && current.protocol !== "http:") throw new LinkError("Unsupported link.");
    await assertPublicHost(current);
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; PushBidBot/1.0)", accept: "text/html" },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current);
      continue;
    }
    if (!(res.headers.get("content-type") ?? "").includes("html") || !res.body) {
      return { finalUrl: current.toString(), html: "" };
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    await reader.cancel().catch(() => {});
    return { finalUrl: current.toString(), html: new TextDecoder().decode(Buffer.concat(chunks)) };
  }
  throw new LinkError("That link redirects too many times.");
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();

function metaContent(html: string, names: string[]): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = /(?:name|property)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    if (name && names.includes(name)) {
      const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
      if (content) return decode(content);
    }
  }
  return "";
}

function iconHref(html: string, base: string): string {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  const rank = (rel: string) => (rel.includes("apple-touch-icon") ? 0 : rel.includes("icon") ? 1 : 9);
  const icons = links
    .map((tag) => ({
      rel: /rel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? "",
      href: /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? "",
    }))
    .filter((l) => l.href && rank(l.rel) < 9)
    .sort((a, b) => rank(a.rel) - rank(b.rel));
  if (!icons.length) return "";
  try {
    const href = new URL(decode(icons[0].href), base);
    return href.protocol === "https:" ? href.toString() : "";
  } catch {
    return "";
  }
}

export function fallbackIcon(link: Pick<NormalizedLink, "url" | "kind" | "key">): string {
  if (link.kind === "x") return `https://unavatar.io/x/${link.key.slice("x.com/".length)}`;
  const host = new URL(link.url).hostname;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

/** Resolves a link shortener to where it leads, so the Listing is keyed by the real site. */
export async function resolveLink(input: string): Promise<NormalizedLink> {
  const link = normalizeLink(input);
  if (!isShortener(link.url)) return link;
  const { finalUrl } = await safeFetch(link.url);
  const resolved = normalizeLink(finalUrl);
  if (isShortener(resolved.url)) throw new LinkError("Link shorteners can't be listed. Use the full link.");
  return resolved;
}

export async function previewLink(input: string): Promise<LinkPreview> {
  const link = await resolveLink(input);
  if (link.kind === "x") {
    const handle = link.key.slice("x.com/".length);
    return { ...link, title: `@${handle} on X`, description: "", iconUrl: fallbackIcon(link) };
  }
  const page = await safeFetch(link.url).catch((err) => {
    if (err instanceof LinkError) throw err;
    return { finalUrl: link.url, html: "" };
  });
  const title =
    metaContent(page.html, ["og:title", "twitter:title"]) ||
    decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(page.html)?.[1] ?? "") ||
    new URL(link.url).hostname.replace(/^www\./, "");
  const description = metaContent(page.html, ["description", "og:description", "twitter:description"]);
  return {
    ...link,
    title: title.slice(0, 120),
    description: description.slice(0, 300),
    iconUrl: iconHref(page.html, page.finalUrl) || fallbackIcon(link),
  };
}
