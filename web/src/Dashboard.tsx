import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "./types";
import { fetchTransactions, isCardBillOnBank } from "./data";
import { ACCOUNT_NAMES, dayLabel, money, monthKey, monthLabel, shiftMonth } from "./format";
import MonthlyChart, { type MonthTotals } from "./MonthlyChart";

type Props = { demo: boolean; onSignOut?: () => void };

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function Dashboard({ demo, onSignOut }: Props) {
  const [txns, setTxns] = useState<Transaction[] | null>(null);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(thisMonth());
  const [account, setAccount] = useState<string>("all");
  const [hideCardBill, setHideCardBill] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchTransactions(`${shiftMonth(thisMonth(), -11)}-01`)
      .then(setTxns)
      .catch((e) => setError(e.message ?? String(e)));
  }, []);

  const companies = useMemo(() => [...new Set((txns ?? []).map((t) => t.company_id))].sort(), [txns]);

  const visible = useMemo(
    () =>
      (txns ?? []).filter(
        (t) => (account === "all" || t.company_id === account) && !(hideCardBill && isCardBillOnBank(t)),
      ),
    [txns, account, hideCardBill],
  );

  const months: MonthTotals[] = useMemo(() => {
    const keys = Array.from({ length: 12 }, (_, i) => shiftMonth(thisMonth(), i - 11));
    const byKey = new Map(keys.map((k) => [k, { key: k, income: 0, expenses: 0 }]));
    for (const t of visible) {
      const m = byKey.get(monthKey(t.activity_date));
      if (!m) continue;
      if (t.charged_amount > 0) m.income += t.charged_amount;
      else m.expenses -= t.charged_amount;
    }
    return keys.map((k) => byKey.get(k)!);
  }, [visible]);

  const current = months.find((m) => m.key === month) ?? { key: month, income: 0, expenses: 0 };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter(
      (t) => monthKey(t.activity_date) === month && (!q || `${t.description ?? ""} ${t.memo ?? ""}`.toLowerCase().includes(q)),
    );
  }, [visible, month, query]);

  const topMerchants = useMemo(() => {
    const sums = new Map<string, number>();
    for (const t of list) if (t.charged_amount < 0) sums.set(t.description ?? "—", (sums.get(t.description ?? "—") ?? 0) - t.charged_amount);
    return [...sums].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [list]);

  return (
    <main className="dash">
      <header className="top">
        <h1>הכסף שלי</h1>
        {demo && <span className="badge">נתוני דמו</span>}
        {onSignOut && (
          <button className="link" onClick={onSignOut}>
            יציאה
          </button>
        )}
      </header>

      {error && <p className="error">שגיאה בטעינת הנתונים: {error}</p>}
      {!txns && !error && <p className="muted">טוען…</p>}

      {txns && (
        <>
          <div className="filters">
            <div className="chips" role="group" aria-label="חשבון">
              {["all", ...companies].map((c) => (
                <button key={c} className={`chip${account === c ? " on" : ""}`} onClick={() => setAccount(c)}>
                  {c === "all" ? "הכול" : ACCOUNT_NAMES[c] ?? c}
                </button>
              ))}
            </div>
            <label className="toggle">
              <input type="checkbox" checked={hideCardBill} onChange={(e) => setHideCardBill(e.target.checked)} />
              הסתר חיוב כאל מהבנק (מונע ספירה כפולה)
            </label>
          </div>

          <nav className="month-nav">
            <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="חודש קודם">→</button>
            <span>{monthLabel(month)}</span>
            <button onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= thisMonth()} aria-label="חודש הבא">←</button>
          </nav>

          <section className="tiles">
            <Tile label="הכנסות" value={current.income} />
            <Tile label="הוצאות" value={current.expenses} />
            <Tile label="נטו" value={current.income - current.expenses} signed />
          </section>

          <MonthlyChart months={months} selected={month} onSelect={setMonth} />

          {topMerchants.length > 0 && (
            <section className="card">
              <h2>איפה הכסף הלך החודש</h2>
              <ol className="top-list">
                {topMerchants.map(([name, sum]) => (
                  <li key={name}>
                    <span>{name}</span>
                    <span className="num">{money(sum)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="card">
            <h2>תנועות ({list.length})</h2>
            <input className="search" type="search" placeholder="חיפוש…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <ul className="txns">
              {list.map((t) => (
                <li key={t.unique_id}>
                  <div>
                    <div className="desc">{t.description || "—"}</div>
                    <div className="meta">
                      {dayLabel(t.activity_date)} · {ACCOUNT_NAMES[t.company_id] ?? t.company_id}
                      {t.original_currency && t.original_currency !== "ILS" && t.original_amount != null
                        ? ` · ${t.original_amount} ${t.original_currency}`
                        : ""}
                    </div>
                  </div>
                  <span className={`num ${t.charged_amount > 0 ? "pos" : ""}`}>{money(t.charged_amount)}</span>
                </li>
              ))}
              {list.length === 0 && <li className="muted">אין תנועות</li>}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

function Tile({ label, value, signed }: { label: string; value: number; signed?: boolean }) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className={`tile-value num${signed && value < 0 ? " neg" : ""}`}>{money(value)}</div>
    </div>
  );
}
