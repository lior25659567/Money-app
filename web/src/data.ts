import { supabase } from "./supabase";
import type { Transaction } from "./types";

const PAGE = 1000; // Supabase's default max rows per request

export async function fetchTransactions(since: string): Promise<Transaction[]> {
  if (!supabase) return demoTransactions();

  const rows: Transaction[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "unique_id, company_id, account, status, activity_date, charged_amount, charged_currency, original_amount, original_currency, description, memo",
      )
      .gte("activity_date", since)
      .order("activity_date", { ascending: false })
      .order("unique_id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(
      ...data.map((r) => ({
        ...r,
        charged_amount: Number(r.charged_amount),
        original_amount: r.original_amount == null ? null : Number(r.original_amount),
      })),
    );
    if (data.length < PAGE) break;
  }
  return rows;
}

// The bank account shows the monthly Cal bill as one big debit, which would
// double count every card purchase. These patterns spot that debit.
const CARD_BILL = /כאל|כ\.א\.ל|ויזה|visa|cal\b|כרטיס.? ?אשראי/i;

export function isCardBillOnBank(t: Transaction): boolean {
  return t.company_id === "mizrahi" && t.charged_amount < 0 && CARD_BILL.test(t.description ?? "");
}

function demoTransactions(): Transaction[] {
  const out: Transaction[] = [];
  const merchants = [
    ["שופרסל דיל", 180, 520],
    ["פז דלק", 150, 320],
    ["ארומה", 18, 60],
    ["סופר-פארם", 40, 220],
    ["רב-קו", 50, 50],
    ["נטפליקס", 55, 55],
    ["וולט", 60, 180],
    ["איקאה", 120, 900],
  ] as const;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const today = new Date();
  for (let m = 0; m < 12; m++) {
    const base = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const ym = (d: number) =>
      `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const lastDay = m === 0 ? today.getDate() : 28;
    if (lastDay >= 10)
      out.push(tx(`sal-${m}`, "mizrahi", "123-456789", ym(10), 14800 + Math.round(rnd() * 600), "משכורת"));
    if (lastDay >= 2) {
      out.push(tx(`rent-${m}`, "mizrahi", "123-456789", ym(2), -5200, "שכר דירה - העברה"));
      out.push(tx(`calbill-${m}`, "mizrahi", "123-456789", ym(2), -4300, "כאל - חיוב כרטיס"));
    }
    for (let i = 0; i < 26; i++) {
      const [name, lo, hi] = merchants[Math.floor(rnd() * merchants.length)];
      const day = 1 + Math.floor(rnd() * lastDay);
      out.push(tx(`c-${m}-${i}`, "visaCal", "4580", ym(day), -Math.round(lo + rnd() * (hi - lo)), name));
    }
  }
  return out.sort((a, b) => b.activity_date.localeCompare(a.activity_date));
}

function tx(id: string, company_id: string, account: string, date: string, amount: number, description: string): Transaction {
  return {
    unique_id: id,
    company_id,
    account,
    status: "completed",
    activity_date: date,
    charged_amount: amount,
    charged_currency: "ILS",
    original_amount: amount,
    original_currency: "ILS",
    description,
    memo: null,
  };
}
