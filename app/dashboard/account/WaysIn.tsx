import Link from "next/link";

import {
  AppleMark,
  GitHubMark,
  GoogleMark,
  MicrosoftMark,
} from "@/app/components/BrandIcons";
import { MailIcon } from "lucide-react";

import { Logo } from "@/app/components/Logo";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { getI18n } from "@/app/i18n/server";
import type { Provider, ProviderId, WaysIn as Ways } from "@/app/lib/api";
import { unlink } from "@/app/lib/ways-in-actions";

const marks: Record<ProviderId | "almena", React.ReactNode> = {
  almena: <Logo size={18} />,
  google: <GoogleMark />,
  microsoft: <MicrosoftMark />,
  apple: <AppleMark />,
  github: <GitHubMark />,
};

/* One row per way in: its mark, what it is, and what can be done with it. */
const row = "flex items-center gap-3 border-t py-3 first:border-t-0";
const mark = "grid size-9 flex-none place-items-center rounded-sm border";
const main = "flex min-w-0 flex-1 flex-col gap-0.5";
const detail = "truncate text-sm text-muted-foreground";
const actions = "flex flex-none items-center gap-2";

/**
 * One row per way in — the email (always shown, empty or not), each linked
 * wallet and provider account — then a button to link another: the Almena
 * wallet first, then each provider. The last way in cannot be removed.
 */
export async function WaysIn({
  waysIn,
  providers,
  notice,
  error,
}: {
  waysIn: Ways | null;
  providers: Provider[];
  notice: string | null;
  error: string | null;
}) {
  const { t } = await getI18n();
  const copy = t.dashboard.account.waysIn;
  const count = waysIn ? (waysIn.email ? 1 : 0) + waysIn.accounts.length : 0;
  const last = count <= 1;

  const remove = (id: string) => (
    <Remove id={id} last={last} label={copy.remove} lastLabel={copy.lastOne} />
  );

  return (
    // The card's look on a <section>: a region of its own, with its heading.
    <section className="mt-4 max-w-[560px] rounded-2xl border bg-card px-6 py-5 text-card-foreground shadow-card">
      <h2 className="mb-1 text-[15px] font-semibold">{copy.title}</h2>
      <p className="mb-3 text-sm text-muted-foreground">{copy.hint}</p>
      {notice && (
        <Alert variant="notice" role="status" className="mb-3">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {(error || !waysIn) && (
        <Alert variant="destructive" role="alert" className="mb-3">
          <AlertDescription>{error ?? t.dashboard.account.errors.unavailable}</AlertDescription>
        </Alert>
      )}
      {waysIn && (
        <>
          <ul>
            <li className={row}>
              <span className={mark}>
                <MailIcon className="size-[18px]" />
              </span>
              <span className={main}>
                <span className="font-semibold">{copy.email}</span>
                <span className={detail}>
                  {waysIn.email ?? copy.noEmail}
                </span>
              </span>
              <span className={actions}>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/account/email">
                    {waysIn.email ? copy.change : copy.add}
                  </Link>
                </Button>
                {waysIn.email && remove("")}
              </span>
            </li>
            {waysIn.accounts.map((account) => (
              <li key={account.id} className={row}>
                <span className={mark}>{marks[account.provider]}</span>
                <span className={main}>
                  <span className="font-semibold">
                    {account.provider === "almena"
                      ? copy.almena
                      : copy.providers[account.provider]}
                  </span>
                  {(account.did ?? account.email) && (
                    <span className={detail} title={account.did ?? undefined}>
                      {account.did ?? account.email}
                    </span>
                  )}
                </span>
                <span className={actions}>
                  {remove(account.id)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/account/almena">
                <Logo size={16} />
                {copy.link.replace("{provider}", copy.almena)}
              </Link>
            </Button>
            {providers
                .filter((p) => p.enabled)
                .map(({ id }) => (
                  // A full navigation: the provider's page is another site.
                  <Button key={id} asChild variant="ghost" size="sm">
                    <a href={`/auth/${id}/start?link=1`}>
                      {marks[id]}
                      {copy.link.replace("{provider}", copy.providers[id])}
                    </a>
                  </Button>
                ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Unlinking: the email (`id` empty) or a provider account; never the last way in. */
function Remove({
  id,
  last,
  label,
  lastLabel,
}: {
  id: string;
  last: boolean;
  label: string;
  lastLabel: string;
}) {
  if (last) return <span className="text-[13px] text-faint">{lastLabel}</span>;
  return (
    <form action={unlink.bind(null, id)}>
      <Button variant="ghost" size="sm" type="submit">
        {label}
      </Button>
    </form>
  );
}
