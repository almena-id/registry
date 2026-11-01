import {
  BadgeCheckIcon,
  BookTextIcon,
  BuildingIcon,
  ClipboardListIcon,
  ClockIcon,
  CreditCardIcon,
  FingerprintIcon,
  FolderTreeIcon,
  GlobeIcon,
  InboxIcon,
  LayoutDashboardIcon,
  ListIcon,
  PenLineIcon,
  RadioTowerIcon,
  ScanLineIcon,
  SquareStackIcon,
  TextCursorInputIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import type { Section } from "@/app/lib/directory-types";

/** What each section is drawn with, in the menu, on the overview and empty. */
export const SECTION_ICONS: Record<Section, LucideIcon> = {
  issuers: BadgeCheckIcon,
  verifiers: ScanLineIcon,
  mediators: RadioTowerIcon,
  identities: FingerprintIcon,
};

/** The side menu's entries, each with its icon. */
export const NAV_ICONS = {
  overview: LayoutDashboardIcon,
  pending: ClockIcon,
  applications: InboxIcon,
  ...SECTION_ICONS,
  forms: ClipboardListIcon,
  fields: TextCursorInputIcon,
  credentialTypes: SquareStackIcon,
  valueLists: ListIcon,
  fieldCategories: FolderTreeIcon,
  credentialCategories: FolderTreeIcon,
  domains: GlobeIcon,
  signing: PenLineIcon,
  tenant: BuildingIcon,
  billing: CreditCardIcon,
  users: UsersIcon,
  accounts: BookTextIcon,
} satisfies Record<string, LucideIcon>;
