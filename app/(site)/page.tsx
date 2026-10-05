import Link from "next/link";

import { Logo } from "@/app/components/Logo";
import { Button } from "@/app/components/ui/button";
import { getI18n } from "@/app/i18n/server";
import { currentUser } from "@/app/lib/api";
import { cn } from "cn";

/** A box in the model: the person, the tenant, one of its components. */
const node =
  "rounded-lg border border-input bg-card px-[18px] py-2.5 text-center text-[15px] font-[550]";

/**
 * The public face of the registry: what it is, the way in (the Almena wallet
 * first; email and the providers are the other ways), the model drawn as it
 * works — a tenant's admins sign from their wallets for it and for its
 * issuers, verifiers and mediators — and three points on what that means.
 */
export default async function Home() {
  const { t } = await getI18n();
  const user = await currentUser();
  const d = t.home.diagram;

  return (
    <div className="grid flex-1 items-center gap-[clamp(32px,5vw,96px)] py-6 min-[900px]:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col gap-4">
        <p className="text-[13px] font-semibold tracking-[0.08em] text-primary uppercase">
          {t.app.network}
        </p>
        {/* Grows with the screen, so a wide monitor is not a small title in a void. */}
        <h1 className="max-w-[16ch] text-[clamp(34px,4.2vw,76px)] leading-[1.08] font-bold tracking-[-0.025em]">
          {t.home.title}
        </h1>
        <p className="max-w-[44ch] text-[clamp(17px,1.25vw,22px)] text-muted-foreground">
          {t.home.lead}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {user ? (
            <Button asChild size="lg">
              <Link href="/dashboard">{t.home.openDashboard}</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/login/almena">
                  <Logo size={18} className="text-primary-foreground" />
                  {t.home.signIn}
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/login">{t.home.otherWays}</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* The registry's actual model, not an illustration of one. */}
      <figure
        className="flex flex-col items-center rounded-2xl border bg-card px-5 pt-8 pb-5 shadow-card"
        aria-label={d.label}
      >
        {/* You sign for the tenant from your wallet: dashed, since you act
            for it rather than own it. */}
        <div
          className={cn(
            node,
            "inline-flex flex-col items-center rounded-full border-faint",
          )}
        >
          {d.you}
          <small className="text-xs font-[450] text-faint">{d.wallet}</small>
        </div>
        <div className="relative h-9 w-0 border-l-2 border-dashed border-input">
          {/* What a line means, said beside it. */}
          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs whitespace-nowrap text-faint">
            {d.signs}
          </span>
        </div>
        <div
          className={cn(node, "border-primary bg-brand-soft text-foreground")}
        >
          {d.tenant}
        </div>
        {/* The fan: a stem down from the tenant, then an arch over the three. */}
        <div className="relative mt-7 h-7 w-2/3 rounded-t-lg border-2 border-b-0 border-input before:absolute before:-top-[30px] before:left-1/2 before:h-7 before:w-0.5 before:-translate-x-px before:bg-input" />
        <div className="grid w-full grid-cols-3 gap-2">
          <div className={cn(node, "px-2 text-sm")}>{d.issuers}</div>
          <div className={cn(node, "px-2 text-sm")}>{d.verifiers}</div>
          <div className={cn(node, "px-2 text-sm")}>{d.mediators}</div>
        </div>
        <figcaption className="mt-6 text-[13px] text-faint">
          {d.caption}
        </figcaption>
      </figure>

      {/* Three numbered points under the hero and the model, across the width. */}
      <ol className="grid list-none gap-4 min-[900px]:col-span-full min-[900px]:grid-cols-3">
        {t.home.points.map((point, index) => (
          <li
            key={point.title}
            className="flex flex-col gap-1.5 rounded-2xl border bg-card px-[22px] py-5"
          >
            <span className="font-mono text-[13px] text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-[17px] font-[650]">{point.title}</h2>
            <p className="text-muted-foreground">{point.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
