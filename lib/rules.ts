import { usd } from "./format";

export const MIN_NEW_LISTING = 10;
export const MAX_SPEND = 999_999;
export const TOP_MARGIN = 5;
export const MIN_RAISE = 1;

/** Where a Listing stands on one Board before a Claim, as far as the +$5 rule for #1 cares. */
export type BoardStanding = {
  /** Name shown in errors, e.g. "All-time", "Today", or a Category name. */
  board: string;
  /** The Listing's Spend on this Board. */
  current: number;
  /** Highest Spend on this Board among every other Listing, or null when the Board has no one else. */
  topOther: number | null;
  /** Whether this Listing currently holds #1 on this Board. */
  leads: boolean;
};

export type ClaimInput = {
  /** The Listing's All-time Spend, or null when the Listing is new. */
  currentTotal: number | null;
  /** The All-time Spend the claimer wants the Listing to reach. */
  targetTotal: number;
  /** Every Board the Claim counts toward. */
  boards: BoardStanding[];
};

export type ClaimCheck = { ok: true; charge: number } | { ok: false; error: string };

export function checkClaim(input: ClaimInput): ClaimCheck {
  const { currentTotal, targetTotal } = input;

  if (!Number.isInteger(targetTotal)) return { ok: false, error: "Amounts are whole dollars." };
  if (targetTotal > MAX_SPEND) return { ok: false, error: `The maximum is ${usd(MAX_SPEND)}.` };

  if (currentTotal === null) {
    if (targetTotal < MIN_NEW_LISTING) {
      return { ok: false, error: `New listings start at ${usd(MIN_NEW_LISTING)}.` };
    }
  } else if (targetTotal < currentTotal + MIN_RAISE) {
    return {
      ok: false,
      error: `This listing already has ${usd(currentTotal)}. Raise it to at least ${usd(currentTotal + MIN_RAISE)}.`,
    };
  }

  const charge = targetTotal - (currentTotal ?? 0);

  for (const b of input.boards) {
    const after = b.current + charge;
    if (!b.leads && b.topOther !== null && after > b.topOther && after < b.topOther + TOP_MARGIN) {
      const needed = targetTotal + (b.topOther + TOP_MARGIN - after);
      return { ok: false, error: `Taking #1 on the ${b.board} board needs at least ${usd(needed)}.` };
    }
  }

  return { ok: true, charge };
}

/** What a Listing's Spend must reach to take the given Rank: $5 over #1, $1 over any other. */
export function amountToTakeRank(rank: number, spend: number): number {
  return spend + (rank === 1 ? TOP_MARGIN : MIN_RAISE);
}

/** What it takes to be #1 on a Board whose leader has `topSpend`, or an empty Board. */
export function amountToTakeFirst(topSpend: number | null): number {
  return topSpend === null ? MIN_NEW_LISTING : topSpend + TOP_MARGIN;
}

export type Standing = { spend: number; since: Date };

/** Higher Spend first; on equal Spend, whoever reached it first keeps the higher Rank. */
export function compareStanding(a: Standing, b: Standing): number {
  return b.spend - a.spend || a.since.getTime() - b.since.getTime();
}

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function utcDayStart(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function msUntilNextUtcDay(now: Date): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

export function isUtcDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && utcDay(utcDayStart(value)) === value;
}
