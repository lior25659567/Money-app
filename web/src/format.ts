const ils = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });
const ilsCompact = new Intl.NumberFormat("he-IL", { notation: "compact", maximumFractionDigits: 1 });

export const money = (n: number) => ils.format(n);
export const compact = (n: number) => `₪${ilsCompact.format(n)}`;

export const monthKey = (date: string) => date.slice(0, 7); // YYYY-MM

export function monthLabel(key: string, style: "long" | "short" = "long") {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("he-IL", { month: style, year: style === "long" ? "numeric" : "2-digit" });
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("he-IL", { day: "numeric", month: "short" });

export const ACCOUNT_NAMES: Record<string, string> = {
  mizrahi: "מזרחי טפחות",
  visaCal: "כאל",
};
