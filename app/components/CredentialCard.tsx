import { CategoryIcon } from "@/app/components/CategoryIcon";
import { Guilloche } from "@/app/components/illustrations/Guilloche";
import { Logo } from "@/app/components/Logo";
import { cn } from "cn";

/** What a status chip's dot says: valid, waiting or suspended, wrong, quiet. */
export type ChipTone = "valid" | "warning" | "danger" | "muted";

const DOT: Record<ChipTone, string> = {
  valid: "bg-primary",
  warning: "bg-warning",
  danger: "bg-destructive",
  muted: "bg-faint",
};

/** A status on a credential card: a light pill with a dot of its state. */
export function CredentialChip({
  tone,
  children,
}: {
  tone: ChipTone;
  children: React.ReactNode;
}) {
  return (
    <span className="credential-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
      <span className={cn("size-2 rounded-full", DOT[tone])} aria-hidden />
      {children}
    </span>
  );
}

/**
 * A credential drawn as the card it is: ID-1 proportions, the brand's
 * gradient with a guilloché and the Almena mark, its category's icon and
 * label on top, the type's name and its issuer below, and an optional status
 * (`children`) at the bottom right. Works on the server and the client.
 */
export function CredentialCard({
  typeName,
  issuerName,
  category,
  size = "full",
  className,
  children,
}: {
  typeName: string;
  issuerName?: string;
  /** Its category: the label and the API's icon name. */
  category?: { label: string; icon?: string | null };
  size?: "full" | "compact";
  className?: string;
  /** The status chip, bottom right. */
  children?: React.ReactNode;
}) {
  const compact = size === "compact";
  return (
    <div
      className={cn(
        "credential-card relative isolate flex aspect-[1.586/1] w-full flex-col overflow-hidden shadow-card",
        compact ? "rounded-[14px] p-[18px]" : "rounded-2xl p-5",
        className,
      )}
    >
      <Guilloche className="pointer-events-none absolute inset-0 -z-10 size-full opacity-[0.12]" />
      <Logo
        size={compact ? 96 : 140}
        className="pointer-events-none absolute -right-4 -bottom-4 -z-10 text-current opacity-10"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="grid size-9 place-items-center rounded-[10px] bg-white/15">
            <CategoryIcon
              icon={category?.icon}
              className="size-5"
              aria-hidden
            />
          </span>
          {/* The chip of a card, as a reader would touch it. */}
          {!compact && (
            <svg
              width="34"
              height="26"
              viewBox="0 0 34 26"
              aria-hidden
              className="opacity-25"
            >
              <rect
                x="0.5"
                y="0.5"
                width="33"
                height="25"
                rx="5"
                fill="none"
                stroke="currentColor"
              />
              <path
                d="M0.5 9h11M0.5 17h11M22.5 9h11M22.5 17h11M11.5 0.5v25M22.5 0.5v25"
                stroke="currentColor"
                fill="none"
              />
            </svg>
          )}
        </div>
        {category && (
          <span className="truncate text-[11px] font-medium tracking-[0.08em] uppercase opacity-80">
            {category.label}
          </span>
        )}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "line-clamp-2 font-brand leading-tight font-semibold",
              compact ? "text-base" : "text-[19px]",
            )}
          >
            {typeName}
          </p>
          {issuerName && (
            <p className="mt-0.5 truncate text-[13px] opacity-85">
              {issuerName}
            </p>
          )}
        </div>
        {children && <div className="flex-none">{children}</div>}
      </div>
    </div>
  );
}
