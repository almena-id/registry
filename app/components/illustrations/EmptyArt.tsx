import type { LucideIcon } from "lucide-react";

/**
 * Nothing here yet, drawn: two blank cards fanned out behind a brand disc
 * that carries what the list holds (`icon`). Tokens only, both themes.
 * Decorative.
 */
export function EmptyArt({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative h-[92px] w-[148px]" aria-hidden>
      <svg viewBox="0 0 148 92" className="absolute inset-0 size-full">
        <g strokeWidth="1.5">
          <rect
            x="16"
            y="20"
            width="78"
            height="52"
            rx="9"
            transform="rotate(-8 55 46)"
            className="fill-sunk stroke-border"
          />
          <rect
            x="54"
            y="16"
            width="78"
            height="52"
            rx="9"
            transform="rotate(7 93 42)"
            className="fill-card stroke-input"
          />
          <g className="stroke-faint" strokeLinecap="round">
            <line x1="68" y1="44" x2="104" y2="48" />
            <line x1="67" y1="53" x2="92" y2="56" />
          </g>
          <g className="fill-primary">
            <circle cx="10" cy="14" r="2" opacity="0.5" />
            <circle cx="140" cy="80" r="2.5" opacity="0.4" />
            <circle cx="132" cy="10" r="1.5" opacity="0.6" />
          </g>
        </g>
      </svg>
      <span className="absolute bottom-0 left-1/2 grid size-11 -translate-x-1/2 place-items-center rounded-full bg-brand-soft text-primary ring-4 ring-card">
        <Icon className="size-5" />
      </span>
    </div>
  );
}
