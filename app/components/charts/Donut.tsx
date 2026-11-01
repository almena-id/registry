import { cn } from "cn";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  /** Its stroke, of the theme's tokens (`stroke-primary`…), and the same
   * colour as a background for its legend (`bg-primary`…). */
  stroke: string;
  swatch: string;
};

/**
 * Parts of a whole as a ring, the total in the middle; each slice names its
 * part and number on hover (`<title>`). With nothing to count, an empty ring.
 */
export function Donut({
  slices,
  label,
  total,
  size = 88,
  className,
}: {
  slices: DonutSlice[];
  /** What the whole is, for assistive technology. */
  label: string;
  /** The words in the middle under the number; the sum by default. */
  total?: string;
  size?: number;
  className?: string;
}) {
  const sum = slices.reduce((all, slice) => all + slice.value, 0);
  const radius = 40;
  const length = 2 * Math.PI * radius;
  // A surface gap between slices, so neighbours never merge.
  const gap = slices.filter((slice) => slice.value > 0).length > 1 ? 2 : 0;
  let offset = 0;
  return (
    <div
      className={cn("relative grid flex-none place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 -rotate-90"
        role="img"
        aria-label={label}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="12"
          className="stroke-sunk"
        />
        {sum > 0 &&
          slices.map((slice) => {
            if (slice.value <= 0) return null;
            const part = (slice.value / sum) * length;
            const dash = Math.max(part - gap, 0.5);
            const circle = (
              <circle
                key={slice.key}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                strokeWidth="12"
                strokeDasharray={`${dash} ${length - dash}`}
                strokeDashoffset={-offset}
                className={slice.stroke}
              >
                <title>{`${slice.label}: ${slice.value}`}</title>
              </circle>
            );
            offset += part;
            return circle;
          })}
      </svg>
      <span className="font-brand text-lg leading-none font-semibold tabular-nums">
        {total ?? sum}
      </span>
    </div>
  );
}
