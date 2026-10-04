import { useState } from "react";
import { compact, money, monthLabel } from "./format";

export type MonthTotals = { key: string; income: number; expenses: number };

type Props = {
  months: MonthTotals[]; // oldest first
  selected: string;
  onSelect: (key: string) => void;
};

const W = 640;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 44 };
const BAR_GAP = 2;

export default function MonthlyChart({ months, selected, onSelect }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expenses]));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / months.length;
  const barW = Math.min(18, (slot * 0.6 - BAR_GAP) / 2);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const h = (v: number) => (v / top) * plotH;

  const hovered = hover == null ? null : months[hover];

  return (
    <figure className="chart">
      <figcaption>
        <span className="chart-title">הכנסות מול הוצאות, 12 חודשים</span>
        <span className="legend" aria-hidden="true">
          <span><i className="swatch s1" />הכנסות</span>
          <span><i className="swatch s2" />הוצאות</span>
        </span>
      </figcaption>
      <div className="chart-plot" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="הכנסות והוצאות לפי חודש" onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="tick" x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
                {compact(t)}
              </text>
            </g>
          ))}
          {months.map((m, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            const isSel = m.key === selected;
            return (
              <g key={m.key} className={hover != null && hover !== i ? "dim" : undefined}>
                {isSel && <rect className="sel" x={cx - slot / 2 + 1} y={PAD.top} width={slot - 2} height={plotH} rx={4} />}
                <path className="bar s1" d={bar(cx - BAR_GAP / 2 - barW, y(m.income), barW, h(m.income))} />
                <path className="bar s2" d={bar(cx + BAR_GAP / 2, y(m.expenses), barW, h(m.expenses))} />
                <text className={`tick${isSel ? " tick-sel" : ""}`} x={cx} y={H - 8} textAnchor="middle">
                  {monthLabel(m.key, "short")}
                </text>
                <rect
                  className="hit"
                  x={cx - slot / 2}
                  y={0}
                  width={slot}
                  height={H}
                  onMouseEnter={() => setHover(i)}
                  onTouchStart={() => setHover(i)}
                  onClick={() => onSelect(m.key)}
                />
              </g>
            );
          })}
          <line className="baseline" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
        </svg>
        {hovered && (
          <div
            className="tooltip"
            dir="rtl"
            style={{ left: `${Math.min(82, Math.max(18, ((PAD.left + slot * hover! + slot / 2) / W) * 100))}%` }}
          >
            <strong>{monthLabel(hovered.key)}</strong>
            <span><i className="swatch s1" />הכנסות {money(hovered.income)}</span>
            <span><i className="swatch s2" />הוצאות {money(hovered.expenses)}</span>
            <span className="muted">נטו {money(hovered.income - hovered.expenses)}</span>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>הכנסות והוצאות לפי חודש</caption>
        <thead>
          <tr><th>חודש</th><th>הכנסות</th><th>הוצאות</th></tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.key}><td>{monthLabel(m.key)}</td><td>{money(m.income)}</td><td>{money(m.expenses)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// Bar with 4px rounded top, square at the baseline.
function bar(x: number, y: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function niceTicks(max: number) {
  const step0 = max / 4;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= step0)!;
  const out: number[] = [];
  for (let v = 0; v < max + step; v += step) out.push(v);
  return out;
}
