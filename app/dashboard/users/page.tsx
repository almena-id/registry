import type { Metadata } from "next";
import Link from "next/link";

import { PlusIcon } from "@/app/components/icons";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenants, currentUser } from "@/app/lib/api";
import { formatDateTime } from "@/app/lib/format";
import { fetchMembers } from "@/app/lib/members";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.users.title };
}

/** The current tenant's people: members first, then those invited and not yet in. */
export default async function UsersPage() {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.users;
  const [members, tenants, me, timeZone] = await Promise.all([
    fetchMembers(),
    currentTenants(),
    currentUser(),
    getTimeZone(),
  ]);
  const isAdmin = tenants[0]?.role === "admin";

  return (
    <div className="section">
      <header className="page-head page-head--actions">
        <div>
          <h1 className="page-head__title">{copy.title}</h1>
          <p className="page-head__lead">{copy.lead}</p>
        </div>
        {isAdmin && (
          <Link className="button button--primary" href="/dashboard/users/new">
            <PlusIcon />
            {copy.add}
          </Link>
        )}
      </header>

      {members === null ? (
        <div className="card list list--empty">
          <p className="alert" role="alert">
            {copy.errors.unavailable}
          </p>
        </div>
      ) : (
        <div className="card list">
          <ul className="list__rows">
            {members.map((member) => (
              <li
                key={`${member.status}:${member.email}`}
                className="list__row"
              >
                <div className="list__main">
                  <span className="list__name">
                    {member.email}
                    {member.email === me?.email && (
                      <span className="list__you"> · {copy.you}</span>
                    )}
                  </span>
                  <span className="list__tags">
                    <span className={`tag tag--${member.role}`}>
                      {copy.roles[member.role]}
                    </span>
                    {member.status === "invited" && (
                      <span className="tag tag--invited">{copy.invited}</span>
                    )}
                  </span>
                </div>
                <time
                  className="list__date"
                  dateTime={member.since}
                  title={copy.since}
                >
                  {formatDateTime(member.since, locale, timeZone)}
                </time>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
