import { cn } from "cn";

import { Button } from "@/app/components/ui/button";
import { safeDeepLink } from "@/app/lib/deep-link";

/**
 * What the Almena wallet scans: the QR code, the button that opens the wallet
 * on this device instead (only for a link of the wallet's own scheme or
 * https), and a line on the wait. Every QR of the portal is drawn by this one.
 * Only `status` is announced, as it changes; `countdown`, which changes every
 * second, sits beside it outside the live region.
 */
export function WalletQr({
  qr,
  deepLink,
  label,
  open,
  status,
  countdown,
  className,
}: {
  /** The SVG drawn server side from the API's link. */
  qr: string;
  deepLink: string;
  /** What the code is, for screen readers. */
  label: string;
  open: string;
  /** Where the wait stands: announced to screen readers when it changes. */
  status: React.ReactNode;
  /** The time left, shown but never announced. */
  countdown?: React.ReactNode;
  className?: string;
}) {
  const href = safeDeepLink(deepLink);
  return (
    <div className={cn("grid gap-3.5", className)}>
      <div
        className="qr mx-auto w-[220px] rounded-xl bg-qr-paper p-2.5"
        role="img"
        aria-label={label}
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      {href && (
        <Button asChild size="lg" className="w-full">
          <a href={href}>{open}</a>
        </Button>
      )}
      <p className="text-center text-sm text-muted-foreground">
        <span role="status">{status}</span>
        {countdown && <> {countdown}</>}
      </p>
    </div>
  );
}
