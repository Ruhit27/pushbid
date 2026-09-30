export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export const compact = (n: number) => n.toLocaleString("en-US");

export function timeAgo(date: Date | string, now = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(date).getTime()) / 1000));
  const steps: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (value < size) {
      const n = Math.floor(value);
      if (unit === "second") return "just now";
      if (n === 1) return unit === "day" ? "yesterday" : `1 ${unit} ago`;
      return `${n} ${unit}s ago`;
    }
    value /= size;
  }
  return "";
}

export function formatDay(day: string): string {
  return new Date(`${day}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
