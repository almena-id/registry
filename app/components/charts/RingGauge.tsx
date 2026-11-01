import { cn } from "cn";

/**
 * A share, 0 to 100, as a ring filling clockwise from the top, the number in
 * the middle. `label` names it for assistive technology.
 */
export function RingGauge({
  value,
  label,
  size = 96,
  className,
}: {
  value: number;
  label: string;
  size?: number;
  className?: string;
}) {
  const share = Math.max(0, Math.min(100, value));
  const radius = 42;
  const length = 2 * Math.PI * radius;
  return (
    <div
      className={cn("relative grid flex-none place-items-center", className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={share}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-sunk"
        />
        {share > 0 && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(share / 100) * length} ${length}`}
            className="stroke-primary transition-[stroke-dasharray] duration-700"
          />
        )}
      </svg>
      <span className="font-brand text-[22px] font-semibold tabular-nums">
        {share}%
      </span>
    </div>
  );
}
