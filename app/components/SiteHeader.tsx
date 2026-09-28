import Link from "next/link";

import type { Dictionary } from "@/app/i18n/config";
import type { Tenant } from "@/app/lib/api";
import { Logo } from "./Logo";
import { TenantSelector } from "./TenantSelector";
import { TimeZoneSelector } from "./TimeZoneSelector";
import { UserMenu } from "./UserMenu";

/**
 * The bar across the top. Signed in (`email`), it also carries the tenant
 * the dashboard works in, the time zone every date is shown in and, in the
 * corner, the account menu; public pages have none of them.
 */
export function SiteHeader({
  t,
  timeZone,
  email,
  tenants = [],
}: {
  t: Dictionary;
  timeZone?: string;
  email?: string;
  tenants?: Tenant[];
}) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label={t.app.name}>
          <Logo size={28} />
          <span className="brand__name">
            Almena <strong>Registry</strong>
          </span>
        </Link>
        <div className="site-header__controls">
          {email && <TenantSelector tenants={tenants} />}
          {timeZone && <TimeZoneSelector timeZone={timeZone} />}
          {email && <UserMenu email={email} />}
        </div>
      </div>
    </header>
  );
}
