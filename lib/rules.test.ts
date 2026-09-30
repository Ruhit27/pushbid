import { describe, expect, it } from "vitest";
import { amountToTakeRank, checkClaim, compareStanding, msUntilNextUtcDay, utcDay, type BoardStanding } from "./rules";

const allTime = (s: Partial<BoardStanding> = {}): BoardStanding => ({ board: "All-time", current: 0, topOther: null, leads: false, ...s });
const today = (s: Partial<BoardStanding> = {}): BoardStanding => ({ board: "Today", current: 0, topOther: null, leads: false, ...s });

describe("checkClaim", () => {
  it("accepts a new Listing at the $10 minimum and charges the full amount", () => {
    expect(checkClaim({ currentTotal: null, targetTotal: 10, boards: [] })).toEqual({ ok: true, charge: 10 });
  });

  it("rejects a new Listing below $10", () => {
    expect(checkClaim({ currentTotal: null, targetTotal: 9, boards: [] })).toMatchObject({ ok: false });
  });

  it("rejects non-whole-dollar and over-maximum amounts", () => {
    expect(checkClaim({ currentTotal: null, targetTotal: 10.5, boards: [] })).toMatchObject({ ok: false });
    expect(checkClaim({ currentTotal: null, targetTotal: 1_000_000, boards: [] })).toMatchObject({ ok: false });
    expect(checkClaim({ currentTotal: null, targetTotal: 999_999, boards: [] })).toMatchObject({ ok: true });
  });

  it("charges only the difference when raising", () => {
    expect(checkClaim({ currentTotal: 50, targetTotal: 51, boards: [] })).toEqual({ ok: true, charge: 1 });
  });

  it("requires a Raise to be at least $1 above the current Spend", () => {
    expect(checkClaim({ currentTotal: 50, targetTotal: 50, boards: [] })).toMatchObject({ ok: false });
  });

  it("requires $5 more than the current #1 to take #1", () => {
    const boards = [allTime({ topOther: 100 })];
    expect(checkClaim({ currentTotal: null, targetTotal: 104, boards })).toMatchObject({ ok: false });
    expect(checkClaim({ currentTotal: null, targetTotal: 105, boards })).toMatchObject({ ok: true });
  });

  it("lets an amount that stays below #1 land on the board at a lower Rank", () => {
    const boards = [allTime({ topOther: 100 })];
    expect(checkClaim({ currentTotal: null, targetTotal: 100, boards })).toMatchObject({ ok: true });
    expect(checkClaim({ currentTotal: null, targetTotal: 40, boards })).toMatchObject({ ok: true });
  });

  it("does not apply the +$5 rule to the Listing that already holds #1", () => {
    const boards = [allTime({ current: 100, topOther: 99, leads: true })];
    expect(checkClaim({ currentTotal: 100, targetTotal: 101, boards })).toEqual({ ok: true, charge: 1 });
  });

  it("requires $5 more than anyone else's Spend today to take today's #1", () => {
    const boards = [allTime({ current: 500, topOther: 1000 }), today({ current: 0, topOther: 20 })];
    expect(checkClaim({ currentTotal: 500, targetTotal: 522, boards })).toMatchObject({ ok: false, error: expect.stringContaining("$525") });
    expect(checkClaim({ currentTotal: 500, targetTotal: 525, boards })).toMatchObject({ ok: true, charge: 25 });
  });

  it("applies the +$5 rule on a Category Board too", () => {
    const boards = [allTime({ topOther: 1000 }), allTime({ board: "Developer Tools", topOther: 50 })];
    expect(checkClaim({ currentTotal: null, targetTotal: 52, boards })).toMatchObject({ ok: false, error: expect.stringContaining("Developer Tools") });
    expect(checkClaim({ currentTotal: null, targetTotal: 55, boards })).toMatchObject({ ok: true });
  });

  it("lets anyone take today's #1 for $10 when nobody has made a Claim today", () => {
    expect(checkClaim({ currentTotal: 5, targetTotal: 15, boards: [today()] })).toEqual({ ok: true, charge: 10 });
  });
});

describe("amountToTakeRank", () => {
  it("costs $5 over #1 and $1 over any other Rank", () => {
    expect(amountToTakeRank(1, 100)).toBe(105);
    expect(amountToTakeRank(2, 100)).toBe(101);
  });
});

describe("compareStanding", () => {
  it("ranks higher Spend first, and the older Listing first on equal Spend", () => {
    const older = { spend: 50, since: new Date("2026-09-01") };
    const newer = { spend: 50, since: new Date("2026-09-02") };
    const richer = { spend: 60, since: new Date("2026-09-03") };
    expect([newer, older, richer].sort(compareStanding)).toEqual([richer, older, newer]);
  });
});

describe("UTC days", () => {
  it("formats the UTC calendar day", () => {
    expect(utcDay(new Date("2026-09-29T23:59:59Z"))).toBe("2026-09-29");
    expect(utcDay(new Date("2026-09-30T00:00:00Z"))).toBe("2026-09-30");
  });

  it("counts down to the next UTC midnight", () => {
    expect(msUntilNextUtcDay(new Date("2026-09-29T23:00:00Z"))).toBe(60 * 60 * 1000);
  });
});
