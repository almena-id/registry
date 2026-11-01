import {
  AwardIcon,
  BadgeCheckIcon,
  BriefcaseIcon,
  BuildingIcon,
  CarIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  GraduationCapIcon,
  HeartPulseIcon,
  HouseIcon,
  IdCardIcon,
  KeyIcon,
  LandmarkIcon,
  MailIcon,
  PhoneIcon,
  PlaneIcon,
  ShieldIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * What a category is drawn with: the API's icon names (lucide's), in the
 * order the picker offers them. Client-safe.
 */
export const CATEGORY_ICONS = {
  tag: TagIcon,
  user: UserIcon,
  "id-card": IdCardIcon,
  house: HouseIcon,
  mail: MailIcon,
  phone: PhoneIcon,
  "file-text": FileTextIcon,
  folder: FolderIcon,
  "graduation-cap": GraduationCapIcon,
  briefcase: BriefcaseIcon,
  users: UsersIcon,
  award: AwardIcon,
  "badge-check": BadgeCheckIcon,
  shield: ShieldIcon,
  "heart-pulse": HeartPulseIcon,
  car: CarIcon,
  landmark: LandmarkIcon,
  building: BuildingIcon,
  globe: GlobeIcon,
  key: KeyIcon,
  plane: PlaneIcon,
  wallet: WalletIcon,
} as const satisfies Record<string, LucideIcon>;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

/** The icons' names, in the picker's order. */
export const categoryIconNames = Object.keys(
  CATEGORY_ICONS,
) as CategoryIconName[];

export function isCategoryIcon(name: unknown): name is CategoryIconName {
  return typeof name === "string" && Object.hasOwn(CATEGORY_ICONS, name);
}

/** The icon a category is drawn with: a tag for an unknown or missing name. */
export function categoryIcon(name?: string | null): LucideIcon {
  return isCategoryIcon(name) ? CATEGORY_ICONS[name] : TagIcon;
}
