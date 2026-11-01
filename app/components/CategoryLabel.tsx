import { CategoryIcon } from "@/app/components/CategoryIcon";
import { cn } from "cn";

/** A category's name with its icon before it, as pickers and lists head it. */
export function CategoryLabel({
  icon,
  children,
  className,
}: {
  /** The API's icon name; a tag when unknown. */
  icon?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CategoryIcon
        icon={icon}
        className="size-3.5 flex-none text-primary"
        aria-hidden
      />
      {children}
    </span>
  );
}
