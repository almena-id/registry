"use client";

import Link from "next/link";

import { AppleMark, GitHubMark, GoogleMark, MicrosoftMark } from "@/app/components/BrandIcons";
import { Logo } from "@/app/components/Logo";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { useI18n } from "@/app/i18n/client";
import type { Provider, ProviderId } from "@/app/lib/api";
import { cn } from "@/app/lib/utils";

const marks: Record<ProviderId, React.ReactNode> = {
  google: <GoogleMark />,
  microsoft: <MicrosoftMark />,
  apple: <AppleMark />,
  github: <GitHubMark />,
};

/** Equal outlined icon buttons sharing the row. */
const button = "h-11 flex-1 rounded-lg px-0 has-[>svg]:px-0";
/** Off: faded, and still says why on hover (so it keeps pointer events, without the hover tint). */
const off =
  "disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-background dark:disabled:hover:bg-input/30";

/**
 * Almena first — the wallet is where every account is headed; it needs no
 * email. A provider the API has no credentials for is shown, and off.
 */
export function SocialButtons({ providers }: { providers: Provider[] }) {
  const { t } = useI18n();
  const copy = t.auth.social;

  return (
    <div className="flex flex-col gap-2">
      {/* Icons only, in one row; each says what it is to a screen reader and on hover. */}
      <div className="flex gap-2">
        <Button asChild variant="outline" className={button}>
          <Link href="/login/almena" aria-label={copy.almena} title={copy.almena}>
            <Logo size={20} />
          </Link>
        </Button>
        {providers.map(({ id, enabled }) =>
          enabled ? (
            // A full navigation: the provider's page is another site.
            <Button key={id} asChild variant="outline" className={button}>
              <a href={`/auth/${id}/start`} aria-label={copy[id]} title={copy[id]}>
                {marks[id]}
              </a>
            </Button>
          ) : (
            <Button
              key={id}
              type="button"
              variant="outline"
              className={cn(button, off)}
              disabled
              aria-label={`${copy[id]} (${copy.notConfigured})`}
              title={`${copy[id]} · ${copy.notConfigured}`}
            >
              {marks[id]}
            </Button>
          ),
        )}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[13px] text-faint">
        <Separator className="flex-1" />
        {copy.or}
        <Separator className="flex-1" />
      </div>
    </div>
  );
}
