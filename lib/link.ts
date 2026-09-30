export type NormalizedLink = {
  /** What identifies a Listing: two links with the same key are the same Listing. */
  key: string;
  /** The cleaned link that Clicks go to. */
  url: string;
  kind: "site" | "x";
};

export class LinkError extends Error {}

const X_HOSTS = new Set(["x.com", "twitter.com", "mobile.twitter.com"]);
const X_RESERVED = new Set(["home", "i", "explore", "search", "settings", "notifications", "messages", "intent", "share", "hashtag", "compose", "login", "signup", "tos", "privacy"]);

/** Platforms that host many unrelated products, so the path is part of the Listing's identity. */
const PATH_KEYED_HOSTS = new Set([
  "github.com",
  "gitlab.com",
  "apps.apple.com",
  "play.google.com",
  "chromewebstore.google.com",
  "chrome.google.com",
  "addons.mozilla.org",
  "marketplace.visualstudio.com",
  "huggingface.co",
  "producthunt.com",
  "npmjs.com",
  "youtube.com",
  "linkedin.com",
  "instagram.com",
  "tiktok.com",
  "threads.net",
  "bsky.app",
  "medium.com",
  "substack.com",
  "notion.site",
  "gumroad.com",
]);

const CHAT_HOSTS = [
  "t.me",
  "telegram.me",
  "telegram.org",
  "wa.me",
  "whatsapp.com",
  "discord.gg",
  "discord.com",
  "discordapp.com",
  "m.me",
  "messenger.com",
  "signal.me",
  "signal.group",
  "kik.me",
  "line.me",
  "viber.com",
  "groupme.com",
];

const ADULT_HOSTS = ["pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "onlyfans.com", "fansly.com", "chaturbate.com", "redtube.com", "youporn.com", "stripchat.com", "brazzers.com"];
const ADULT_WORDS = /(porn|xxx|nsfw|hentai|camgirl|sexcam|escort)/;

export const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "is.gd",
  "rebrand.ly",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
  "tiny.cc",
  "lnkd.in",
  "bl.ink",
  "short.io",
  "dub.sh",
  "s.id",
]);

const matchesHost = (host: string, list: readonly string[]) =>
  list.some((h) => host === h || host.endsWith(`.${h}`));

const HANDLE = /^@?([A-Za-z0-9_]{1,15})$/;

export function normalizeLink(input: string): NormalizedLink {
  const raw = input.trim();
  if (!raw) throw new LinkError("Enter a website link or an X @handle.");

  if (raw.startsWith("@")) {
    const m = HANDLE.exec(raw);
    if (!m) throw new LinkError("That doesn't look like a valid X @handle.");
    return xListing(m[1]);
  }

  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new LinkError("That doesn't look like a valid link.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new LinkError("Only http and https links can be listed.");
  }

  const fullHost = parsed.hostname.toLowerCase();
  if (!fullHost.includes(".") || /^[\d.]+$/.test(fullHost) || fullHost.includes(":") || fullHost.endsWith(".local")) {
    throw new LinkError("That doesn't look like a public website.");
  }
  const host = fullHost.replace(/^www\./, "");

  if (matchesHost(host, CHAT_HOSTS) || host === "chat.whatsapp.com") {
    throw new LinkError("Chat and invite links can't be listed. The board is for products and profiles.");
  }
  if (matchesHost(host, ADULT_HOSTS) || ADULT_WORDS.test(host)) {
    throw new LinkError("Adult content can't be listed.");
  }

  const path = parsed.pathname.replace(/\/+$/, "");

  if (X_HOSTS.has(host)) {
    const handle = path.split("/")[1] ?? "";
    if (!HANDLE.test(handle) || X_RESERVED.has(handle.toLowerCase())) throw new LinkError("Link an X profile, like x.com/yourhandle.");
    return xListing(handle);
  }

  if (host === "apps.apple.com") {
    const id = /\/(id\d+)/.exec(path)?.[1];
    if (id) return { key: `${host}/app/${id}`, url: `https://${fullHost}${parsed.pathname}`, kind: "site" };
  }

  if (host === "play.google.com") {
    const id = parsed.searchParams.get("id");
    const query = id ? `?id=${id}` : "";
    return {
      key: `${host}${path.toLowerCase()}${query}`,
      url: `https://${fullHost}${path}${query}`,
      kind: "site",
    };
  }

  const key = PATH_KEYED_HOSTS.has(host) && path ? `${host}${path.toLowerCase()}` : host;
  return { key, url: `${parsed.protocol}//${fullHost}${parsed.pathname}`, kind: "site" };
}

function xListing(handle: string): NormalizedLink {
  const h = handle.toLowerCase();
  return { key: `x.com/${h}`, url: `https://x.com/${h}`, kind: "x" };
}

export function slugFromKey(key: string): string {
  return key.replace(/[^a-z0-9._-]+/g, "--").replace(/^-+|-+$/g, "");
}

export function isShortener(url: string): boolean {
  try {
    return SHORTENER_HOSTS.has(new URL(url).hostname.replace(/^www\./, ""));
  } catch {
    return false;
  }
}
