import Link from "next/link";

import type { Dictionary } from "@/app/i18n/config";
import type { Tenant } from "@/app/lib/api";
import { Logo } from "./Logo";
import { TenantSelector } from "./TenantSelector";
import { TimeZoneSelector } from "./TimeZoneSelector";
import { UserMenu } from "./UserMenu";

/**
 * The bar across the top. Signed in (`account`: how the person reads), it also carries the tenant
 * the dashboard works in, the time zone every date is shown in and, in the
 * corner, the account menu; public pages have none of them.
 */
export function SiteHeader({
  t,
  timeZone,
  account,
  tenants = [],
  tenant = null,
}: {
  t: Dictionary;
  timeZone?: string;
  account?: string;
  tenants?: Tenant[];
  tenant?: Tenant | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
      <div className="page-frame flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-brand text-[17px] tracking-tight whitespace-nowrap"
          aria-label={t.app.name}
        >
          <Logo size={28} />
          <span>
            Almena <strong className="font-semibold">Registry</strong>
          </span>
        </Link>
        <div className="flex flex-none items-center gap-2">
          {account && <TenantSelector tenants={tenants} current={tenant} />}
          {timeZone && <TimeZoneSelector timeZone={timeZone} />}
          {account && <UserMenu account={account} />}
        </div>
      </div>
    </header>
  );
}
