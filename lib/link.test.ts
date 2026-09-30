import { describe, expect, it } from "vitest";
import { LinkError, normalizeLink, slugFromKey } from "./link";

describe("normalizeLink", () => {
  it("keys a plain website by its host, without www", () => {
    expect(normalizeLink("https://www.Example.com/pricing")).toEqual({
      key: "example.com",
      url: "https://www.example.com/pricing",
      kind: "site",
    });
  });

  it("adds https when the scheme is missing", () => {
    expect(normalizeLink("example.com").url).toBe("https://example.com/");
  });

  it("strips tracking query strings and fragments", () => {
    const link = normalizeLink("https://example.com/?utm_source=x&ref=abc#top");
    expect(link.url).toBe("https://example.com/");
    expect(link.key).toBe("example.com");
  });

  it("keys GitHub and App Store links by path so different apps don't share a Listing", () => {
    expect(normalizeLink("https://github.com/unifyai/unify/").key).toBe("github.com/unifyai/unify");
    expect(normalizeLink("https://github.com/vercel/next.js").key).toBe("github.com/vercel/next.js");
    expect(normalizeLink("https://apps.apple.com/us/app/foo/id123?pt=1").key).toBe("apps.apple.com/app/id123");
  });

  it("keys App Store apps by id, whatever the country store", () => {
    expect(normalizeLink("https://apps.apple.com/gb/app/foo-bar/id123").key).toBe(
      normalizeLink("https://apps.apple.com/us/app/foo/id123").key,
    );
  });

  it("rejects X links that aren't profiles", () => {
    expect(() => normalizeLink("https://x.com/home")).toThrow(LinkError);
    expect(() => normalizeLink("https://x.com/i/communities/123")).toThrow(LinkError);
  });

  it("keeps the Play Store app id, which lives in the query string", () => {
    const link = normalizeLink("https://play.google.com/store/apps/details?id=com.foo.bar&hl=en");
    expect(link.key).toBe("play.google.com/store/apps/details?id=com.foo.bar");
    expect(link.url).toBe("https://play.google.com/store/apps/details?id=com.foo.bar");
  });

  it("treats @handles and x.com / twitter.com profiles as the same X Listing", () => {
    const expected = { key: "x.com/jack", url: "https://x.com/jack", kind: "x" };
    expect(normalizeLink("@Jack")).toEqual(expected);
    expect(normalizeLink("https://twitter.com/jack?s=20")).toEqual(expected);
    expect(normalizeLink("x.com/jack/")).toEqual(expected);
  });

  it.each([
    "https://t.me/somegroup",
    "https://chat.whatsapp.com/abc",
    "https://wa.me/123",
    "https://discord.gg/abc",
    "https://discord.com/invite/abc",
    "https://m.me/someone",
    "https://signal.group/#abc",
  ])("rejects chat and invite link %s", (input) => {
    expect(() => normalizeLink(input)).toThrow(LinkError);
  });

  it("rejects adult sites", () => {
    expect(() => normalizeLink("https://pornhub.com")).toThrow(LinkError);
    expect(() => normalizeLink("https://onlyfans.com/someone")).toThrow(LinkError);
  });

  it.each(["", "not a url at all", "ftp://example.com", "http://localhost:3000", "https://192.168.1.1"])(
    "rejects invalid link %j",
    (input) => {
      expect(() => normalizeLink(input)).toThrow(LinkError);
    },
  );
});

describe("slugFromKey", () => {
  it("turns keys into URL-safe slugs", () => {
    expect(slugFromKey("see.io")).toBe("see.io");
    expect(slugFromKey("github.com/unifyai/unify")).toBe("github.com--unifyai--unify");
    expect(slugFromKey("play.google.com/store/apps/details?id=com.foo")).toBe(
      "play.google.com--store--apps--details--id--com.foo",
    );
  });
});
