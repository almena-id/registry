import type { LucideProps } from "lucide-react";

import { CATEGORY_ICONS, isCategoryIcon } from "@/app/lib/category-icons";

/** A category's icon by the API's name: a tag for an unknown or missing one. */
export function CategoryIcon({
  icon,
  ...props
}: { icon?: string | null } & Omit<LucideProps, "name">) {
  const Icon = CATEGORY_ICONS[isCategoryIcon(icon) ? icon : "tag"];
  return <Icon {...props} />;
}
