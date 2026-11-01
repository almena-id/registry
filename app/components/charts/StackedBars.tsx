"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "cn";

export type BarSeries = {
  key: string;
  label: string;
  /** Its fill and, for the legend, the same colour as a background — both
   * of the theme's tokens (`fill-chart-issued`, `bg-chart-issued`). */
  fill: string;
  swatch: string;
};

export type BarDatum = {
  key: string;
  /** The day in full (tooltip, table) and short (axis). */
  label: string;
  short: string;
  values: Record<string, number>;
};

const HEIGHT = 188;
const TOP = 14;
const AXIS = 22;
const LEFT = 30;

/** A round top for the highest number the axis reaches: 1, 2, 5 × 10ⁿ. */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10])
    if (step * power >= value) return step * power;
  return 10 * power;
}

/** A bar's segment with only its top end rounded (the end away from zero). */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + w - radius}Q${x + w},${y} ${x + w},${y + radius}V${y + h}Z`;
}

/**
 * Counts per day as stacked bars, one series per token, with a legend; the
 * `marks` (counts that went wrong) as a dot above the day's bar. Hovering a
 * day — or moving along with the arrow keys — shows its numbers. A table
 * with every day says the same to assistive technology.
 */
export function StackedBars({
  data,
  series,
  marks,
  markLabel,
  markClass,
  markSwatch,
  label,
  dayHeader,
  locale,
}: {
  data: BarDatum[];
  series: BarSeries[];
  /** The values drawn as a dot above the bar, each named in the tooltip. */
  marks: { key: string; label: string }[];
  markLabel: string;
  markClass: string;
  markSwatch: string;
  /** What the chart shows, said once for assistive technology. */
  label: string;
  dayHeader: string;
  locale: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width))),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const number = new Intl.NumberFormat(locale);
  const stack = (datum: BarDatum) =>
    series.reduce((all, s) => all + (datum.values[s.key] ?? 0), 0);
  const marked = (datum: BarDatum) =>
    marks.reduce((all, m) => all + (datum.values[m.key] ?? 0), 0);
  const top = niceMax(Math.max(0, ...data.map(stack)));
  const plot = HEIGHT - TOP - AXIS;
  const slot = (width - LEFT) / Math.max(data.length, 1);
  const bar = Math.max(3, Math.min(slot * 0.62, 28));
  const y = (value: number) => TOP + plot - (value / top) * plot;
  const every = Math.max(1, Math.ceil(data.length / 7));
  const shown = active === null ? null : data[active];

  return (
    // The column is the room there is, never the chart's last width: the
    // chart is measured from it and drawn to fit.
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span
              className={cn("size-2.5 rounded-[3px]", s.swatch)}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            className={cn("size-2.5 rounded-full", markSwatch)}
            aria-hidden
          />
          {markLabel}
        </li>
      </ul>

      <div
        ref={frame}
        className="relative min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={0}
        aria-label={label}
        onMouseLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const step = event.key === "ArrowLeft" ? -1 : 1;
          setActive((now) =>
            Math.min(
              data.length - 1,
              Math.max(0, (now ?? (step > 0 ? -1 : data.length)) + step),
            ),
          );
        }}
      >
        <svg
          width={width}
          height={HEIGHT}
          // Never wider than its room, even before it is first measured.
          className="block max-w-full"
          aria-hidden
        >
          {/* A recessive grid: zero, half and the top. */}
          {[0, top / 2, top].map((tick) => (
            <g key={tick}>
              <line
                x1={LEFT}
                x2={width}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? "stroke-input" : "stroke-border"}
                strokeDasharray={tick === 0 ? undefined : "3 4"}
              />
              <text
                x={LEFT - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-faint text-[11px] tabular-nums"
              >
                {number.format(tick)}
              </text>
            </g>
          ))}
          {data.map((datum, index) => {
            const x = LEFT + index * slot + (slot - bar) / 2;
            let base = 0;
            const drawn = series.filter((s) => (datum.values[s.key] ?? 0) > 0);
            const wrong = marked(datum);
            return (
              <g
                key={datum.key}
                opacity={active === null || active === index ? 1 : 0.45}
              >
                {drawn.map((s, at) => {
                  const value = datum.values[s.key] ?? 0;
                  const from = y(base);
                  base += value;
                  const to = y(base);
                  // A surface gap between segments, so neighbours never merge.
                  const height = Math.max(from - to - (at > 0 ? 2 : 0), 1);
                  return at === drawn.length - 1 ? (
                    <path
                      key={s.key}
                      d={topRounded(x, to, bar, height, 4)}
                      className={s.fill}
                    />
                  ) : (
                    <rect
                      key={s.key}
                      x={x}
                      y={to}
                      width={bar}
                      height={height}
                      className={s.fill}
                    />
                  );
                })}
                {wrong > 0 && (
                  <circle
                    cx={x + bar / 2}
                    cy={y(base) - 7}
                    r={3.5}
                    className={cn(markClass, "stroke-card")}
                    strokeWidth={2}
                  />
                )}
                {(index % every === 0 || index === data.length - 1) &&
                  (index === data.length - 1 ||
                    data.length - 1 - index >= every / 2) && (
                    // The last day ends at its bar's right edge: centred, it
                    // would run past the chart.
                    <text
                      x={index === data.length - 1 ? x + bar : x + bar / 2}
                      y={HEIGHT - 6}
                      textAnchor={index === data.length - 1 ? "end" : "middle"}
                      className="fill-faint text-[11px]"
                    >
                      {datum.short}
                    </text>
                  )}
                {/* Wider than the bar, so a thin one is easy to point at. */}
                <rect
                  x={LEFT + index * slot}
                  y={0}
                  width={slot}
                  height={HEIGHT - AXIS}
                  fill="transparent"
                  onMouseEnter={() => setActive(index)}
                />
              </g>
            );
          })}
        </svg>

        {shown && active !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-[150px] rounded-lg border bg-popover px-3 py-2 text-[13px] text-popover-foreground shadow-card"
            style={{
              left: Math.min(
                Math.max(LEFT + active * slot + slot / 2 - 80, 0),
                width - 160,
              ),
            }}
          >
            <p className="mb-1 font-semibold">{shown.label}</p>
            <ul className="grid gap-0.5">
              {series.map((s) => (
                <li
                  key={s.key}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className={cn("size-2 rounded-[2px]", s.swatch)}
                      aria-hidden
                    />
                    {s.label}
                  </span>
                  <span className="tabular-nums">
                    {number.format(shown.values[s.key] ?? 0)}
                  </span>
                </li>
              ))}
              {marks.map((m) => (
                <li
                  key={m.key}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className={cn("size-2 rounded-full", markSwatch)}
                      aria-hidden
                    />
                    {m.label}
                  </span>
                  <span className="tabular-nums">
                    {number.format(shown.values[m.key] ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hidden in a box, not on the table: a table grows to its content
          whatever its width says, and would widen the page. */}
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{dayHeader}</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
              {marks.map((m) => (
                <th key={m.key} scope="col">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((datum) => (
              <tr key={datum.key}>
                <th scope="row">{datum.label}</th>
                {[...series, ...marks].map((s) => (
                  <td key={s.key}>{datum.values[s.key] ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
