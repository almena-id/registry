import { InboxIcon, type LucideIcon } from "lucide-react";

import { EmptyArt } from "@/app/components/illustrations/EmptyArt";
import { cn } from "cn";

/**
 * An empty list or block, illustrated: the drawing with what it would hold
 * (`icon`), the words, and optionally a way to start (`children`).
 */
export function EmptyState({
  icon = InboxIcon,
  title,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-5 py-10 text-center",
        className,
      )}
    >
      <EmptyArt icon={icon} />
      <p className="text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
