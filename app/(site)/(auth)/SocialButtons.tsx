"use client";

import { AppleMark, GitHubMark, GoogleMark, MicrosoftMark } from "@/app/components/BrandIcons";
import { Logo } from "@/app/components/Logo";
import { useI18n } from "@/app/i18n/client";
import type { Provider, ProviderId } from "@/app/lib/api";

const marks: Record<ProviderId, React.ReactNode> = {
  google: <GoogleMark />,
  microsoft: <MicrosoftMark />,
  apple: <AppleMark />,
  github: <GitHubMark />,
};

/**
 * Almena first — the wallet is where every account is headed — but it does
 * nothing yet. A provider the API has no credentials for is shown, and off.
 */
export function SocialButtons({ providers }: { providers: Provider[] }) {
  const { t } = useI18n();
  const copy = t.auth.social;

  return (
    <div className="social">
      {/* Icons only, in one row; each says what it is to a screen reader and on hover. */}
      <div className="social__row">
        <button
          type="button"
          className="social__button"
          disabled
          aria-label={`${copy.almena} (${copy.soon})`}
          title={`${copy.almena} · ${copy.soon}`}
        >
          <Logo size={20} />
        </button>
        {providers.map(({ id, enabled }) =>
          enabled ? (
            // A full navigation: the provider's page is another site.
            <a
              key={id}
              className="social__button"
              href={`/auth/${id}/start`}
              aria-label={copy[id]}
              title={copy[id]}
            >
              {marks[id]}
            </a>
          ) : (
            <button
              key={id}
              type="button"
              className="social__button"
              disabled
              aria-label={`${copy[id]} (${copy.notConfigured})`}
              title={`${copy[id]} · ${copy.notConfigured}`}
            >
              {marks[id]}
            </button>
          ),
        )}
      </div>
      <p className="social__or">
        <span>{copy.or}</span>
      </p>
    </div>
  );
}
